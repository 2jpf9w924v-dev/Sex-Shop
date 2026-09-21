LUMÉ V5.3 - Mercado Pago Checkout Pro / Orders API

1. Copie .env.example para .env.
2. Cole o Access Token DE TESTE no .env.
3. Rode: python app.py
4. Abra: http://localhost:8000
5. Adicione produto e clique em Finalizar compra.

A V5.3 remove campos extras do item, adiciona capture_mode=automatic_async e imprime no terminal o HTTP/JSON devolvido pelo Mercado Pago em caso de erro.
O arquivo .env não é incluído no ZIP.
