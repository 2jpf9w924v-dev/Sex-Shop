LUMÉ V5.4 — Correção Orders API

Correção aplicada após resposta HTTP 400 do Mercado Pago:
- removidos unit_measure e total_amount de cada item;
- total_amount permanece somente no nível principal da order;
- unit_price e quantity permanecem nos itens;
- diagnóstico detalhado da API mantido no PowerShell.

Execução local:
1. Crie .env com MP_ACCESS_TOKEN=<token de teste>
2. Rode: python app.py
3. Abra: http://localhost:8000
