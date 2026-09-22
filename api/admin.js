const bcrypt = require('bcryptjs');

const { db } = require('../lib/db');
const {
  requireAdmin,
  makeToken,
  sessionCookie,
  clearCookie
} = require('../lib/auth');
const { sendStatusEmail } = require('../lib/mailer');

const allowed = {
  pagamento_confirmado: 'Pagamento confirmado',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue'
};

const action = (req) => String(req.query?.action || '').trim();

/**
 * Garante que o corpo da requisição seja sempre um objeto.
 * Dependendo da execução na Vercel, req.body pode chegar
 * como objeto ou como string JSON.
 */
function getBody(req) {
  let body = req.body || {};

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  return body;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const a = action(req);
    const sql = db();

    // =========================================================
    // SETUP - CRIAÇÃO DO PRIMEIRO ADMINISTRADOR
    // =========================================================

    if (a === 'setup') {

      if (req.method === 'GET') {
        const r = await sql`
          SELECT count(*)::int AS count
          FROM admin_users
          WHERE active = true
        `;

        return res.json({
          setup_required: r[0].count === 0
        });
      }

      if (req.method !== 'POST') {
        return res.status(405).json({
          error: 'Método não permitido.'
        });
      }

      const c = await sql`
        SELECT count(*)::int AS count
        FROM admin_users
      `;

      if (c[0].count > 0) {
        return res.status(409).json({
          error: 'Configuração inicial já concluída.'
        });
      }

      const body = getBody(req);

      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      const emailValido =
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

      if (
        name.length < 2 ||
        !emailValido ||
        password.length < 10
      ) {
        return res.status(400).json({
          error:
            'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.'
        });
      }

      const hash = await bcrypt.hash(password, 12);

      await sql`
        INSERT INTO admin_users (
          name,
          email,
          password_hash
        )
        VALUES (
          ${name},
          ${email},
          ${hash}
        )
      `;

      return res.status(201).json({
        ok: true
      });
    }

    // =========================================================
    // LOGIN
    // =========================================================

    if (a === 'login') {

      if (req.method !== 'POST') {
        return res.status(405).json({
          error: 'Método não permitido.'
        });
      }

      const body = getBody(req);

      const email = String(body.email || '')
        .trim()
        .toLowerCase();

      const password = String(body.password || '');

      if (!email || !password) {
        return res.status(400).json({
          error: 'Informe e-mail e senha.'
        });
      }

      const u = await sql`
        SELECT
          id,
          name,
          email,
          password_hash
        FROM admin_users
        WHERE email = ${email}
          AND active = true
        LIMIT 1
      `;

      if (
        !u[0] ||
        !(await bcrypt.compare(password, u[0].password_hash))
      ) {
        return res.status(401).json({
          error: 'E-mail ou senha inválidos.'
        });
      }

      res.setHeader(
        'Set-Cookie',
        sessionCookie(makeToken(u[0]))
      );

      return res.json({
        ok: true,
        name: u[0].name
      });
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    if (a === 'logout') {
      res.setHeader(
        'Set-Cookie',
        clearCookie()
      );

      return res.json({
        ok: true
      });
    }

    // =========================================================
    // A PARTIR DAQUI EXIGE LOGIN
    // =========================================================

    const admin = requireAdmin(req);

    // =========================================================
    // ADMIN ATUAL
    // =========================================================

    if (a === 'me') {
      return res.json({
        user: admin
      });
    }

    // =========================================================
    // PEDIDOS
    // =========================================================

    if (a === 'orders') {

      const orders = await sql`
        SELECT
          o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'product_name', i.product_name,
                'quantity', i.quantity,
                'unit_price', i.unit_price,
                'total_price', i.total_price
              )
            )
            FILTER (WHERE i.id IS NOT NULL),
            '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items i
          ON i.order_id = o.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 1000
      `;

      return res.json({
        orders
      });
    }

    // =========================================================
    // HISTÓRICO DO PEDIDO
    // =========================================================

    if (a === 'history') {

      const id = Number(req.query?.id);

      if (!id) {
        return res.status(400).json({
          error: 'id obrigatório'
        });
      }

      const history = await sql`
        SELECT *
        FROM order_status_history
        WHERE order_id = ${id}
        ORDER BY created_at DESC
      `;

      return res.json({
        history
      });
    }

    // =========================================================
    // ALTERAÇÃO DE STATUS
    // =========================================================

    if (a === 'status') {

      if (req.method !== 'POST') {
        return res.status(405).json({
          error: 'Método não permitido.'
        });
      }

      const body = getBody(req);

      const status = String(body.status || '');
      const id = Number(body.id);

      if (!allowed[status] || !id) {
        return res.status(400).json({
          error: 'Pedido/status inválido.'
        });
      }

      const rows = await sql`
        SELECT
          id,
          order_number,
          customer_name,
          customer_email,
          order_status,
          payment_status
        FROM orders
        WHERE id = ${id}
      `;

      if (!rows[0]) {
        return res.status(404).json({
          error: 'Pedido não encontrado.'
        });
      }

      const o = rows[0];

      if (o.payment_status !== 'processed') {
        return res.status(409).json({
          error:
            'Só é possível alterar o fluxo após o pagamento confirmado.'
        });
      }

      if (o.order_status === status) {
        return res.json({
          ok: true,
          email_sent: false
        });
      }

      await sql`
        UPDATE orders
        SET
          order_status = ${status},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      await sql`
        INSERT INTO order_status_history (
          order_id,
          old_status,
          new_status,
          changed_by
        )
        VALUES (
          ${id},
          ${o.order_status},
          ${status},
          ${admin.email}
        )
      `;

      let email_sent = true;
      let email_error = null;

      try {
        await sendStatusEmail(o, status);
      } catch (e) {
        email_sent = false;
        email_error = e.message;
      }

      return res.json({
        ok: true,
        email_sent,
        email_error
      });
    }

    // =========================================================
    // AÇÃO NÃO ENCONTRADA
    // =========================================================

    return res.status(404).json({
      error: 'Ação administrativa não encontrada.'
    });

  } catch (e) {

    console.error('admin api', e);

    return res.status(e.status || 500).json({
      error: e.message || 'Erro interno.'
    });
  }
};
