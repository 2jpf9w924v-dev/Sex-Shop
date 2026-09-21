LUMÉ V5 - CHECKOUT MERCADO PAGO

1) TESTE VISUAL LOCAL (carrinho funciona):
   node local-server.js
   Abra http://localhost:8000

2) TESTE REAL DO CHECKOUT (recomendado):
   - Crie uma aplicação no Mercado Pago Developers.
   - Copie o Access Token DE TESTE.
   - Publique este projeto no Vercel.
   - No Vercel > Settings > Environment Variables, crie:
       MP_ACCESS_TOKEN = seu token de teste
       PUBLIC_BASE_URL = https://SEU-PROJETO.vercel.app
   - Faça novo deploy.
   - Use uma conta comprador de teste do Mercado Pago para pagar.

3) SEGURANÇA IMPLEMENTADA:
   - O navegador envia somente IDs e quantidades.
   - Os preços reais ficam no backend (api/create-preference.js).
   - O Access Token fica somente no servidor.
   - success.html consulta a API do backend e só mostra pagamento confirmado se o Mercado Pago retornar status=approved.
   - O carrinho só é limpo após confirmação aprovada.

4) PRODUÇÃO:
   Troque MP_ACCESS_TOKEN pela credencial de produção apenas quando a integração estiver validada.
   Para uma loja real, o próximo passo é persistir pedidos em banco e validar a assinatura secreta do webhook.
