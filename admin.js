/* =========================================================
   LUMÉ ADMIN PRO
   Dashboard administrativo
   ========================================================= */

let orders = [];
let me = null;
let period = '30';

/* =========================================================
   HELPERS
   ========================================================= */

const money = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

const labels = {
    aguardando_pagamento: 'Aguardando pagamento',
    pagamento_confirmado: 'Pagamento confirmado',
    em_preparacao: 'Em preparação',
    enviado: 'Enviado',
    entregue: 'Entregue'
};

const statusClass = (status) => {
    if (status === 'aguardando_pagamento') return 'wait';
    if (status === 'pagamento_confirmado') return 'paid';
    if (status === 'em_preparacao') return 'prep';
    if (status === 'enviado') return 'sent';
    return 'done';
};

const formatDate = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleString('pt-BR');
};

const escapeHtml = (value) => {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
};

/* =========================================================
   PERÍODO
   ========================================================= */

function periodOrders() {

    const now = new Date();

    let start = null;

    if (period === '1') {

        start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    } else if (
        period === '7' ||
        period === '30'
    ) {

        start = new Date(
            Date.now() -
            Number(period) * 86400000
        );

    } else if (period === 'month') {

        start = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );
    }

    if (!start) {
        return [...orders];
    }

    return orders.filter(
        (order) =>
            new Date(order.created_at) >= start
    );
}

/* =========================================================
   TABELA DE PEDIDOS
   ========================================================= */

function rows(list) {

    if (!list.length) {

        return `
            <div class="row header">
                <div># Pedido</div>
                <div>Cliente</div>
                <div>Total</div>
                <div>Data</div>
                <div>Status</div>
                <div>Ação</div>
            </div>

            <div class="empty">
                Nenhum pedido encontrado.
            </div>
        `;
    }

    return `
        <div class="row header">

            <div># Pedido</div>
            <div>Cliente</div>
            <div>Total</div>
            <div>Data</div>
            <div>Status</div>
            <div>Ação</div>

        </div>

        ${list.map((order) => `

            <div class="row">

                <div>

                    <div class="orderid">
                        ${escapeHtml(order.order_number)}
                    </div>

                    <div class="muted">
                        MP ${escapeHtml(
                            order.mercado_pago_order_id || '—'
                        )}
                    </div>

                </div>

                <div>

                    ${escapeHtml(
                        order.customer_name
                    )}

                    <div class="muted">
                        ${escapeHtml(
                            order.customer_email
                        )}
                    </div>

                </div>

                <div>
                    <b>
                        ${money(order.total_amount)}
                    </b>
                </div>

                <div>
                    ${formatDate(order.created_at)}
                </div>

                <div>

                    <span class="status ${statusClass(
                        order.order_status
                    )}">

                        ${
                            labels[order.order_status] ||
                            escapeHtml(order.order_status)
                        }

                    </span>

                </div>

                <div>

                    <button
                        class="open"
                        type="button"
                        onclick="openOrder(${Number(order.id)})"
                        title="Abrir pedido"
                    >
                        ›
                    </button>

                </div>

            </div>

        `).join('')}
    `;
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    const list = periodOrders();

    const paid = list.filter(
        (order) =>
            order.payment_status === 'processed'
    );

    const revenue = paid.reduce(
        (total, order) =>
            total + Number(order.total_amount || 0),
        0
    );

    const customers = new Set(
        list
            .map((order) =>
                String(order.customer_email || '')
                    .trim()
                    .toLowerCase()
            )
            .filter(Boolean)
    ).size;

    const attention = list.filter(
        (order) =>
            [
                'pagamento_confirmado',
                'em_preparacao'
            ].includes(order.order_status)
    ).length;

    document.querySelector('#kRevenue').textContent =
        money(revenue);

    document.querySelector('#kOrders').textContent =
        list.length;

    document.querySelector('#kTicket').textContent =
        money(
            paid.length
                ? revenue / paid.length
                : 0
        );

    document.querySelector('#kCustomers').textContent =
        customers;

    document.querySelector('#kAttention').textContent =
        attention;

    document.querySelector('#attentionBadge').textContent =
        attention;

    document.querySelector('#recent').innerHTML =
        rows(list.slice(0, 6));

    renderProducts(list);

    renderCharts(list);
}

/* =========================================================
   PRODUTOS
   ========================================================= */

function productStats(list = orders) {

    const products = {};

    list.forEach((order) => {

        (order.items || []).forEach((item) => {

            const name =
                item.product_name || 'Produto';

            if (!products[name]) {

                products[name] = {
                    qty: 0,
                    revenue: 0
                };
            }

            products[name].qty +=
                Number(item.quantity || 0);

            products[name].revenue +=
                Number(item.total_price || 0);
        });
    });

    return Object.entries(products)

        .map(([name, values]) => ({
            name,
            ...values
        }))

        .sort(
            (a, b) =>
                b.qty - a.qty
        );
}

/* =========================================================
   RENDER PRODUTOS
   ========================================================= */

function renderProducts(list) {

    const products = productStats(list);

    const max =
        products[0]?.qty || 1;

    const dashboardProducts =
        document.querySelector('#dashboard #products');

    if (dashboardProducts) {

        dashboardProducts.innerHTML =
            products.length

                ? products
                    .slice(0, 5)
                    .map((product, index) => {

                        const percentage =
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    (product.qty / max) * 100
                                )
                            );

                        return `

                            <div class="product-row">

                                <b>
                                    ${index + 1}
                                </b>

                                <div>

                                    <small title="${escapeHtml(product.name)}">
                                        ${escapeHtml(product.name)}
                                    </small>

                                    <div class="track">

                                        <div
                                            class="fill"
                                            style="width:${percentage}%"
                                        ></div>

                                    </div>

                                </div>

                                <b>
                                    ${product.qty}
                                </b>

                            </div>

                        `;

                    }).join('')

                : `
                    <div
                        class="empty"
                        style="padding:25px 15px"
                    >
                        Sem vendas ainda.
                    </div>
                `;
    }

    const productList =
        document.querySelector('#productList');

    if (!productList) return;

    productList.innerHTML = `

        <div class="row header">

            <div>Produto</div>
            <div>Quantidade</div>
            <div>Faturamento</div>
            <div></div>
            <div></div>
            <div></div>

        </div>

        ${
            products.length

                ? products.map((product) => `

                    <div class="row">

                        <div>
                            <b>
                                ${escapeHtml(product.name)}
                            </b>
                        </div>

                        <div>
                            ${product.qty}
                        </div>

                        <div>
                            <b>
                                ${money(product.revenue)}
                            </b>
                        </div>

                        <div></div>
                        <div></div>
                        <div></div>

                    </div>

                `).join('')

                : `
                    <div class="empty">
                        Nenhum produto vendido ainda.
                    </div>
                `
        }
    `;
}

/* =========================================================
   GRÁFICO DE FATURAMENTO
   ========================================================= */

function renderRevenueChart(list) {

    const container =
        document.querySelector('#revenueChart');

    if (!container) return;

    const paid = list.filter(
        (order) =>
            order.payment_status === 'processed'
    );

    const daily = {};

    paid.forEach((order) => {

        const date =
            new Date(order.created_at);

        const key =
            `${date.getFullYear()}-` +
            `${String(date.getMonth() + 1).padStart(2, '0')}-` +
            `${String(date.getDate()).padStart(2, '0')}`;

        if (!daily[key]) {
            daily[key] = 0;
        }

        daily[key] +=
            Number(order.total_amount || 0);
    });

    const entries =
        Object.entries(daily)
            .sort(
                ([a], [b]) =>
                    new Date(a) - new Date(b)
            )
            .slice(-14);

    if (!entries.length) {

        container.innerHTML = `
            <div
                class="empty"
                style="
                    height:100%;
                    display:grid;
                    place-items:center;
                    padding:20px;
                "
            >
                Sem faturamento no período.
            </div>
        `;

        return;
    }

    const values =
        entries.map(([, value]) => value);

    const maxValue =
        Math.max(...values, 1);

    /*
       Criamos espaço interno para o SVG.
    */

    const width = 1000;
    const height = 180;

    const paddingX = 25;
    const paddingTop = 15;
    const paddingBottom = 28;

    const usableWidth =
        width - paddingX * 2;

    const usableHeight =
        height -
        paddingTop -
        paddingBottom;

    const points =
        entries.map(
            ([date, value], index) => {

                const x =
                    entries.length === 1
                        ? width / 2
                        : paddingX +
                          index *
                          (
                              usableWidth /
                              (entries.length - 1)
                          );

                const y =
                    paddingTop +
                    usableHeight -
                    (
                        value /
                        maxValue
                    ) *
                    usableHeight;

                return {
                    date,
                    value,
                    x,
                    y
                };
            }
        );

    const linePoints =
        points
            .map(
                (point) =>
                    `${point.x},${point.y}`
            )
            .join(' ');

    const areaPoints = `
        ${paddingX},${height - paddingBottom}
        ${linePoints}
        ${width - paddingX},${height - paddingBottom}
    `;

    /*
       Escala vertical.
    */

    const yValues = [
        maxValue,
        maxValue * 0.75,
        maxValue * 0.5,
        maxValue * 0.25,
        0
    ];

    container.innerHTML = `

        <div class="ylabels">

            ${yValues
                .map(
                    (value) =>
                        `<span>${money(value)}</span>`
                )
                .join('')}

        </div>


        <svg
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="none"
            aria-label="Gráfico de faturamento"
        >

            <defs>

                <linearGradient
                    id="revenueArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >

                    <stop
                        offset="0%"
                        stop-color="#f52b7d"
                        stop-opacity=".30"
                    />

                    <stop
                        offset="100%"
                        stop-color="#f52b7d"
                        stop-opacity="0"
                    />

                </linearGradient>

            </defs>


            <polygon
                points="${areaPoints}"
                fill="url(#revenueArea)"
            ></polygon>


            <polyline
                points="${linePoints}"
                class="line"
                vector-effect="non-scaling-stroke"
            ></polyline>


            ${points.map((point) => `

                <circle
                    cx="${point.x}"
                    cy="${point.y}"
                    r="5"
                    fill="#ff367e"
                >

                    <title>
                        ${new Date(
                            point.date + 'T12:00:00'
                        ).toLocaleDateString('pt-BR')}
                        — ${money(point.value)}
                    </title>

                </circle>

            `).join('')}

        </svg>


        <div class="xlabels">

            ${points.map((point) => `

                <span>

                    ${new Date(
                        point.date + 'T12:00:00'
                    ).toLocaleDateString(
                        'pt-BR',
                        {
                            day: '2-digit',
                            month: '2-digit'
                        }
                    )}

                </span>

            `).join('')}

        </div>

    `;
}

/* =========================================================
   GRÁFICO DE STATUS
   ========================================================= */

function renderStatusChart(list) {

    const container =
        document.querySelector('#statusChart');

    if (!container) return;

    const statuses = [
        'aguardando_pagamento',
        'pagamento_confirmado',
        'em_preparacao',
        'enviado',
        'entregue'
    ];

    const counts =
        statuses.map((status) => ({
            status,

            count:
                list.filter(
                    (order) =>
                        order.order_status === status
                ).length
        }));

    const total = list.length;

    const colors = {
        aguardando_pagamento: '#8b93a3',
        pagamento_confirmado: '#ff367e',
        em_preparacao: '#f4b942',
        enviado: '#2196f3',
        entregue: '#42cf8d'
    };

    /*
       Montagem dinâmica do conic-gradient.
    */

    let current = 0;

    const gradientParts = [];

    counts.forEach((item) => {

        const percentage =
            total
                ? (item.count / total) * 100
                : 0;

        const start = current;
        const end = current + percentage;

        if (percentage > 0) {

            gradientParts.push(
                `${colors[item.status]} ${start}% ${end}%`
            );
        }

        current = end;
    });

    const donutBackground =
        gradientParts.length
            ? `conic-gradient(${gradientParts.join(',')})`
            : '#252a33';

    container.innerHTML = `

        <div
            class="donut"
            style="background:${donutBackground}"
        >

            <div>

                <b>
                    ${total}
                </b>

                <span>
                    pedidos
                </span>

            </div>

        </div>


        <div class="legend">

            ${counts.map((item) => {

                const percentage =
                    total
                        ? Math.round(
                            (
                                item.count /
                                total
                            ) * 100
                        )
                        : 0;

                return `

                    <p>

                        <i
                            style="
                                background:
                                ${colors[item.status]}
                            "
                        ></i>

                        ${labels[item.status]}

                        <b>
                            ${item.count}
                        </b>

                        <span>
                            ${percentage}%
                        </span>

                    </p>

                `;

            }).join('')}

        </div>

    `;
}

/* =========================================================
   TODOS OS GRÁFICOS
   ========================================================= */

function renderCharts(list) {

    renderRevenueChart(list);

    renderStatusChart(list);
}

/* =========================================================
   CLIENTES
   ========================================================= */

function renderCustomers() {

    const customers = {};

    orders.forEach((order) => {

        const email =
            String(
                order.customer_email || ''
            )
            .trim()
            .toLowerCase();

        if (!email) return;

        if (!customers[email]) {

            customers[email] = {

                name:
                    order.customer_name ||
                    'Cliente',

                email,

                phone:
                    order.customer_phone || '',

                count: 0,

                total: 0,

                last:
                    order.created_at
            };
        }

        customers[email].count++;

        if (
            order.payment_status ===
            'processed'
        ) {

            customers[email].total +=
                Number(
                    order.total_amount || 0
                );
        }

        if (
            new Date(order.created_at) >
            new Date(customers[email].last)
        ) {

            customers[email].last =
                order.created_at;

            customers[email].name =
                order.customer_name ||
                customers[email].name;

            customers[email].phone =
                order.customer_phone ||
                customers[email].phone;
        }
    });

    const list =
        Object.values(customers)
            .sort(
                (a, b) =>
                    new Date(b.last) -
                    new Date(a.last)
            );

    const container =
        document.querySelector(
            '#customerList'
        );

    if (!container) return;

    container.innerHTML = `

        <div class="row header">

            <div>Cliente</div>
            <div>E-mail</div>
            <div>Pedidos</div>
            <div>Total pago</div>
            <div>Última compra</div>
            <div></div>

        </div>

        ${
            list.length

                ? list.map((customer) => `

                    <div class="row">

                        <div>

                            <b>
                                ${escapeHtml(customer.name)}
                            </b>

                            <div class="muted">
                                ${escapeHtml(customer.phone)}
                            </div>

                        </div>

                        <div>
                            ${escapeHtml(customer.email)}
                        </div>

                        <div>
                            ${customer.count}
                        </div>

                        <div>
                            <b>
                                ${money(customer.total)}
                            </b>
                        </div>

                        <div>
                            ${formatDate(customer.last)}
                        </div>

                        <div></div>

                    </div>

                `).join('')

                : `
                    <div class="empty">
                        Nenhum cliente encontrado.
                    </div>
                `
        }
    `;
}

/* =========================================================
   FILTRO DE PEDIDOS
   ========================================================= */

function filterOrders() {

    const search =
        (
            document.querySelector('#search')
                ?.value || ''
        )
        .trim()
        .toLowerCase();

    const status =
        document.querySelector('#filter')
            ?.value || '';

    const list =
        orders.filter((order) => {

            const text = `

                ${order.order_number || ''}
                ${order.customer_name || ''}
                ${order.customer_email || ''}
                ${JSON.stringify(
                    order.items || []
                )}

            `.toLowerCase();

            const matchesSearch =
                !search ||
                text.includes(search);

            const matchesStatus =
                !status ||
                order.order_status === status;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    document.querySelector(
        '#orderList'
    ).innerHTML = rows(list);
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showView(id) {

    document
        .querySelectorAll('.view')
        .forEach((view) =>
            view.classList.remove('active')
        );

    document
        .getElementById(id)
        ?.classList.add('active');

    document
        .querySelectorAll(
            'nav button[data-view]'
        )
        .forEach((button) => {

            button.classList.toggle(
                'active',
                button.dataset.view === id
            );
        });

    if (id === 'dashboard') {
        renderDashboard();
    }

    if (id === 'orders') {
        filterOrders();
    }

    if (id === 'customers') {
        renderCustomers();
    }

    if (id === 'products') {
        renderProducts(orders);
    }
}

window.showView = showView;

/* =========================================================
   DETALHES DO PEDIDO
   ========================================================= */

async function openOrder(id) {

    const order =
        orders.find(
            (item) =>
                Number(item.id) ===
                Number(id)
        );

    if (!order) {

        alert(
            'Pedido não encontrado.'
        );

        return;
    }

    let history = [];

    try {

        const response =
            await fetch(
                '/api/admin?action=history&id=' +
                encodeURIComponent(id)
            );

        const data =
            await response.json();

        if (response.ok) {

            history =
                data.history || [];
        }

    } catch (error) {

        console.error(
            'Erro ao carregar histórico:',
            error
        );
    }

    const items =
        (order.items || [])
            .map((item) => `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        gap:15px;
                        margin:8px 0;
                    "
                >

                    <span>
                        ${escapeHtml(item.product_name)}
                        × ${Number(item.quantity || 0)}
                    </span>

                    <b>
                        ${money(item.total_price)}
                    </b>

                </div>

            `)
            .join('');

    const paid =
        order.payment_status ===
        'processed';

    document.querySelector(
        '#detail'
    ).innerHTML = `

        <p class="muted">
            ${formatDate(order.created_at)}
        </p>

        <h2>
            ${escapeHtml(order.order_number)}
        </h2>

        <span
            class="status ${statusClass(
                order.order_status
            )}"
        >
            ${
                labels[order.order_status] ||
                escapeHtml(order.order_status)
            }
        </span>


        <div class="detailbox">

            <b>Cliente</b>

            <p>
                ${escapeHtml(order.customer_name)}
                <br>

                ${escapeHtml(order.customer_email)}
                <br>

                ${escapeHtml(
                    order.customer_phone || ''
                )}
            </p>

        </div>


        <div class="detailbox">

            <b>Pedido</b>

            <div style="margin-top:12px">

                ${
                    items ||
                    '<span class="muted">Sem itens.</span>'
                }

            </div>

            <hr
                style="
                    border:0;
                    border-top:1px solid #29313d;
                    margin:15px 0;
                "
            >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <span>Total</span>

                <b>
                    ${money(order.total_amount)}
                </b>

            </div>

            <p class="muted">
                Pagamento:
                ${escapeHtml(order.payment_status)}
            </p>

        </div>


        <div class="detailbox">

            <b>Entrega</b>

            <p>

                ${escapeHtml(order.address_street || '')},
                ${escapeHtml(order.address_number || '')}

                ${
                    order.address_complement
                        ? ' - ' +
                          escapeHtml(
                              order.address_complement
                          )
                        : ''
                }

                <br>

                ${escapeHtml(
                    order.address_neighborhood || ''
                )}

                ·

                ${escapeHtml(
                    order.address_city || ''
                )}

                /

                ${escapeHtml(
                    order.address_state || ''
                )}

                <br>

                CEP
                ${escapeHtml(
                    order.address_zip || ''
                )}

            </p>

        </div>


        <div class="detailbox">

            <b>Histórico</b>

            <div style="margin-top:12px">

                ${
                    history.length

                        ? history.map((item) => `

                            <p
                                style="
                                    margin:8px 0;
                                    line-height:1.45;
                                "
                            >

                                ${formatDate(item.created_at)}

                                —

                                <b>
                                    ${
                                        labels[
                                            item.new_status
                                        ] ||
                                        escapeHtml(
                                            item.new_status
                                        )
                                    }
                                </b>

                                <span class="muted">

                                    ${
                                        item.changed_by
                                            ? '(' +
                                              escapeHtml(
                                                  item.changed_by
                                              ) +
                                              ')'
                                            : '(sistema)'
                                    }

                                </span>

                            </p>

                        `).join('')

                        : `
                            <p class="muted">
                                Sem movimentações.
                            </p>
                        `
                }

            </div>

        </div>


        ${
            paid

                ? `

                    <div class="status-form">

                        <label>
                            Novo status
                        </label>

                        <select id="newStatus">

                            <option value="pagamento_confirmado">
                                Pagamento confirmado
                            </option>

                            <option value="em_preparacao">
                                Em preparação
                            </option>

                            <option value="enviado">
                                Enviado
                            </option>

                            <option value="entregue">
                                Entregue
                            </option>

                        </select>


                        <button
                            type="button"
                            onclick="updateStatus(${Number(order.id)})"
                        >
                            Atualizar status
                        </button>


                        <span class="hint">
                            Salva no Neon e envia e-mail ao cliente.
                        </span>

                    </div>

                `

                : `

                    <p class="muted">

                        Aguardando confirmação do pagamento.

                        O status operacional fica bloqueado
                        até o Mercado Pago confirmar.

                    </p>

                `
        }
    `;

    if (paid) {

        const select =
            document.querySelector(
                '#newStatus'
            );

        if (select) {

            select.value =
                order.order_status;
        }
    }

    document
        .querySelector('#drawer')
        .classList
        .add('show');
}

window.openOrder = openOrder;

/* =========================================================
   ATUALIZAÇÃO DE STATUS
   ========================================================= */

async function updateStatus(id) {

    const select =
        document.querySelector(
            '#newStatus'
        );

    if (!select) return;

    const status =
        select.value;

    const response =
        await fetch(
            '/api/admin?action=status',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    id,
                    status
                })
            }
        );

    const data =
        await response.json();

    if (!response.ok) {

        alert(
            data.error ||
            'Erro ao atualizar status.'
        );

        return;
    }

    document
        .querySelector('#drawer')
        .classList
        .remove('show');

    await loadOrders();

    if (data.email_sent) {

        alert(
            'Status atualizado e e-mail enviado.'
        );

    } else {

        alert(
            'Status atualizado.' +
            (
                data.email_error
                    ? ' E-mail: ' +
                      data.email_error
                    : ''
            )
        );
    }
}

window.updateStatus = updateStatus;

/* =========================================================
   EXPORTAÇÃO CSV
   ========================================================= */

function exportCsv() {

    const escapeCsv = (value) =>
        '"' +
        String(value ?? '')
            .replaceAll('"', '""') +
        '"';

    const header = [
        'Pedido',
        'Cliente',
        'Email',
        'Telefone',
        'Total',
        'Pagamento',
        'Status',
        'Data'
    ];

    const lines = [

        header
            .map(escapeCsv)
            .join(';'),

        ...orders.map((order) => [

            order.order_number,
            order.customer_name,
            order.customer_email,
            order.customer_phone,

            Number(
                order.total_amount || 0
            ).toFixed(2),

            order.payment_status,

            labels[order.order_status] ||
                order.order_status,

            formatDate(order.created_at)

        ]
        .map(escapeCsv)
        .join(';'))
    ];

    const blob =
        new Blob(
            [
                '\ufeff' +
                lines.join('\n')
            ],
            {
                type:
                    'text/csv;charset=utf-8'
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement('a');

    link.href = url;

    link.download =
        'lume-pedidos.csv';

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    await fetch(
        '/api/admin?action=logout',
        {
            method: 'POST'
        }
    ).catch(() => {});

    location.href =
        '/admin-login.html';
}

/* =========================================================
   CARREGAR PEDIDOS
   ========================================================= */

async function loadOrders() {

    const response =
        await fetch(
            '/api/admin?action=orders'
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.error ||
            'Erro ao carregar pedidos.'
        );
    }

    orders =
        Array.isArray(data.orders)
            ? data.orders
            : [];

    renderDashboard();

    renderCustomers();

    renderProducts(orders);

    filterOrders();
}

/* =========================================================
   CARREGAMENTO DO ADMIN
   ========================================================= */

async function load() {

    const response =
        await fetch(
            '/api/admin?action=me'
        );

    if (!response.ok) {

        location.href =
            '/admin-login.html';

        return;
    }

    const data =
        await response.json();

    me =
        data.user || data;

    document.querySelector(
        '#adminName'
    ).textContent =
        me.name ||
        'Administrador';

    document.querySelector(
        '#adminEmail'
    ).textContent =
        me.email || '';

    const initials =
        (me.name || 'LA')
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => word[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

    document.querySelector(
        '#avatar'
    ).textContent =
        initials || 'LA';

    document.querySelector(
        '#systemStatus'
    ).innerHTML = `

        <h2>
            Integrações
        </h2>

        <p>
            Banco Neon:
            <b>conectado pelo backend</b>
        </p>

        <p>
            Administrador:
            <b>
                ${escapeHtml(me.email || '')}
            </b>
        </p>

        <p>
            Mercado Pago / Resend:
            usados pelas APIs da loja.
        </p>
    `;

    await loadOrders();
}

/* =========================================================
   EVENTOS DE NAVEGAÇÃO
   ========================================================= */

document
    .querySelectorAll(
        'nav button[data-view]'
    )
    .forEach((button) => {

        button.addEventListener(
            'click',
            () =>
                showView(
                    button.dataset.view
                )
        );
    });


document
    .querySelectorAll(
        '[data-go]'
    )
    .forEach((button) => {

        button.addEventListener(
            'click',
            () =>
                showView(
                    button.dataset.go
                )
        );
    });


/* =========================================================
   FILTROS DE PERÍODO
   ========================================================= */

document
    .querySelectorAll(
        '.period button[data-days]'
    )
    .forEach((button) => {

        button.addEventListener(
            'click',
            () => {

                period =
                    button.dataset.days;

                document
                    .querySelectorAll(
                        '.period button'
                    )
                    .forEach((item) =>
                        item.classList.remove(
                            'active'
                        )
                    );

                button.classList.add(
                    'active'
                );

                renderDashboard();
            }
        );
    });


/* =========================================================
   FILTROS DOS PEDIDOS
   ========================================================= */

const searchInput =
    document.querySelector('#search');

if (searchInput) {

    searchInput.addEventListener(
        'input',
        filterOrders
    );
}


const statusFilter =
    document.querySelector('#filter');

if (statusFilter) {

    statusFilter.addEventListener(
        'change',
        filterOrders
    );
}


/* =========================================================
   BUSCA GLOBAL
   ========================================================= */

const globalSearch =
    document.querySelector(
        '#globalSearch'
    );

if (globalSearch) {

    globalSearch.addEventListener(
        'input',
        (event) => {

            const orderSearch =
                document.querySelector(
                    '#search'
                );

            if (orderSearch) {

                orderSearch.value =
                    event.target.value;
            }

            showView('orders');
        }
    );
}


/* =========================================================
   CTRL + K
   ========================================================= */

document.addEventListener(
    'keydown',
    (event) => {

        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key.toLowerCase() === 'k'
        ) {

            event.preventDefault();

            globalSearch?.focus();
        }

        if (
            event.key === 'Escape'
        ) {

            document
                .querySelector('#drawer')
                ?.classList
                .remove('show');
        }
    }
);


/* =========================================================
   BOTÃO DE ATENÇÃO
   ========================================================= */

const attentionButton =
    document.querySelector(
        '#attentionBtn'
    );

if (attentionButton) {

    attentionButton.addEventListener(
        'click',
        () => {

            showView('orders');

            const filter =
                document.querySelector(
                    '#filter'
                );

            if (filter) {

                filter.value =
                    'pagamento_confirmado';

                filterOrders();
            }
        }
    );
}


/* =========================================================
   BOTÕES
   ========================================================= */

document
    .querySelector('#exportCsv')
    ?.addEventListener(
        'click',
        exportCsv
    );

document
    .querySelector('#logoutBtn')
    ?.addEventListener(
        'click',
        logout
    );

document
    .querySelector('#settingsLogout')
    ?.addEventListener(
        'click',
        logout
    );


/* =========================================================
   DRAWER
   ========================================================= */

document
    .querySelector('#close')
    ?.addEventListener(
        'click',
        () => {

            document
                .querySelector('#drawer')
                ?.classList
                .remove('show');
        }
    );


document
    .querySelector('#drawer')
    ?.addEventListener(
        'click',
        (event) => {

            if (
                event.target.id ===
                'drawer'
            ) {

                event.currentTarget
                    .classList
                    .remove('show');
            }
        }
    );


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

load().catch((error) => {

    console.error(
        'LUMÉ Admin:',
        error
    );

    alert(
        error.message ||
        'Erro ao carregar o painel administrativo.'
    );
});
