LUMÉ V7.1 — OPERAÇÃO REAL / REVISÃO PONTA A PONTA

Obrigatórias na Vercel:
- URL_DO_BANCO_DE_DADOS (criada pelo Neon)
- MP_ACCESS_TOKEN
- PUBLIC_BASE_URL ou URL_BASE_PUBLICA
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- STORE_ORDER_EMAIL (ou E-MAIL_DE_PEDIDO_DA_LOJA)
- ADMIN_SESSION_SECRET (segredo aleatório >= 32 caracteres)
- MP_WEBHOOK_SECRET (segredo gerado ao configurar Webhook no Mercado Pago)

Webhook Mercado Pago:
URL: https://sex-shop-peach.vercel.app/api/webhook
Evento: Order (Mercado Pago)
Depois de salvar, copie a chave secreta do Webhook para MP_WEBHOOK_SECRET na Vercel e faça novo deploy.

Fluxo:
1. create-order cria Order no MP e já grava pedido/itens no Neon como aguardando_pagamento.
2. Webhook assinado ou página success chama sync-order e confirma no MP.
3. Pedido vira pagamento_confirmado e e-mails são enviados com idempotência.
4. ADM lista dados reais; status só pode mudar após pagamento processado.
5. Mudança de status gera histórico + e-mail.

ADM funcional:
- Dashboard com período
- KPIs reais
- Faturamento por dia
- Status
- Pedidos + busca/filtro
- Detalhe + histórico + mudança de status
- Clientes
- Produtos vendidos
- Relatório CSV
- Configurações/status de sessão
- Ctrl+K
- Botão atenção
- Logout

Observação: o catálogo de produtos da loja continua definido no código (api/_catalog.js). A tela Produtos é analítica, não é cadastro de estoque/produtos.
