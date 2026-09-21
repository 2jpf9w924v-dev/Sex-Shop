LUMÉ V5.2 — MERCADO PAGO CHECKOUT PRO / ORDERS API

1. Crie um arquivo .env ao lado do app.py.
2. Configure MP_ACCESS_TOKEN com o Access Token de TESTE.
3. Deixe PUBLIC_BASE_URL vazio enquanto estiver em localhost.
4. Rode: python app.py
5. Abra: http://localhost:8000
6. Adicione produtos e clique em Finalizar compra.
7. Informe o e-mail da CONTA COMPRADOR DE TESTE do Mercado Pago.

IMPORTANTE SOBRE LOCALHOST
A Orders API cria a order e retorna checkout_url normalmente. Para retorno automático completo
(success/failure/pending), publique o site em uma URL HTTPS e configure PUBLIC_BASE_URL.

O backend valida os IDs e preços do catálogo; o navegador envia apenas IDs e quantidades.
O Access Token fica somente no backend.
