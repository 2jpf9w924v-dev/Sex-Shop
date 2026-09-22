LUMÉ V5.7 — Mensageria de pedidos

Variáveis obrigatórias na Vercel:
- MP_ACCESS_TOKEN (Segredo)
- PUBLIC_BASE_URL (Configuração)
- RESEND_API_KEY (Segredo)
- STORE_ORDER_EMAIL (Configuração)

Opcional/recomendado para produção:
- RESEND_FROM_EMAIL (Configuração), ex.: LUMÉ <pedidos@seudominio.com.br>
  Para enviar para qualquer cliente, use no Resend um domínio próprio verificado.

Fluxo:
1. Cliente informa dados de entrega e revisa o pedido.
2. Mercado Pago processa o pagamento.
3. success.html consulta /api/order-status.
4. Somente com status processed chama /api/send-order-emails.
5. A API valida novamente a order no Mercado Pago e confere o total do catálogo.
6. Resend envia um e-mail para a loja e outro para o cliente.
7. Idempotency-Key reduz duplicidades em tentativas repetidas (janela do Resend).

Observação: nesta versão o disparo acontece no retorno do cliente à success.html. Para garantir envio mesmo se o cliente fechar o navegador antes do retorno, a próxima evolução deve persistir o pedido em banco e processar o webhook do Mercado Pago no servidor.
