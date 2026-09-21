LUMÉ V5.5 — Vercel + Mercado Pago Orders API

Correções principais:
- adicionada /api/create-order.js para Vercel usando POST /v1/orders;
- adicionada /api/order-status.js para validar a order no retorno;
- URLs success/failure/pending usam PUBLIC_BASE_URL;
- auto_return configurado como approved;
- frontend trata respostas não-JSON sem gerar "Unexpected token";
- .env removido deste pacote por segurança.

Variáveis na Vercel (Production):
MP_ACCESS_TOKEN = Access Token do Mercado Pago (Secret)
PUBLIC_BASE_URL = https://sex-shop-peach.vercel.app (Configuration)

Depois de publicar: faça Redeploy e teste pelo domínio da Vercel.
