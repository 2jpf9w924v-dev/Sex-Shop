LUMÉ V7 - NEON

1. Banco Neon já deve conter: orders, order_items, order_status_history, admin_users.
2. Variável criada pela integração Vercel: URL_DO_BANCO_DE_DADOS.
3. Adicione na Vercel um SEGREDO chamado ADMIN_SESSION_SECRET com uma sequência aleatória longa (mín. 32 caracteres).
4. Publique todos os arquivos desta versão no GitHub.
5. Após o deploy, acesse /admin-login.html. Se não existir administrador, a própria tela entra em modo de configuração inicial.
6. Crie o primeiro dono. Depois disso o setup fica bloqueado e a tela vira login.
7. Faça uma nova compra de teste. Após pagamento aprovado, success.html valida no Mercado Pago, salva no Neon e mantém a mensageria Resend.
8. No ADM, a mudança de status salva no Neon e envia e-mail ao cliente.

IMPORTANTE: não coloque URL_DO_BANCO_DE_DADOS nem ADMIN_SESSION_SECRET no GitHub.
