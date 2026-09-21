LUMÉ V5.1 — TESTE LOCAL SEM NODE.JS
====================================

1) Copie o arquivo .env.example e renomeie a cópia para .env
2) No .env, informe sua credencial de TESTE do Mercado Pago:
   MP_ACCESS_TOKEN=SEU_TOKEN_DE_TESTE

   Para teste apenas local, deixe PUBLIC_BASE_URL vazio:
   PUBLIC_BASE_URL=

3) Abra o terminal do VS Code nesta pasta e execute:
   python app.py

4) Acesse:
   http://localhost:8000

IMPORTANTE
- Não coloque o Access Token em index.html ou script.js.
- Não envie o arquivo .env para GitHub. O .gitignore já ignora esse arquivo.
- O carrinho e a criação do checkout podem ser testados localmente.
- Retorno automático + webhook completos devem ser testados após publicar em uma URL HTTPS (ex.: Vercel).
- Em produção, use credenciais de produção somente depois de validar tudo com credenciais de teste.

PUBLICAÇÃO NO VERCEL
A estrutura /api em JavaScript foi mantida para o deploy serverless no Vercel.
O app.py existe somente para você conseguir desenvolver/testar localmente sem instalar Node.js.
