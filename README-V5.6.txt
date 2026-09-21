LUMÉ V5.6 — Checkout com dados de entrega

Fluxo:
Carrinho -> Dados do cliente/entrega -> Revisar pedido -> Mercado Pago -> Pagamento aprovado -> Pedido confirmado.

Campos obrigatórios:
- Nome completo
- E-mail
- Telefone
- CEP
- Endereço
- Número
- Bairro
- Cidade
- UF
Complemento é opcional.

Recursos:
- Busca de CEP via ViaCEP, com preenchimento automático quando disponível.
- Validação no navegador e novamente na API create-order.
- Tela de revisão com itens, total, contato e endereço antes do Mercado Pago.
- Dados do pedido preservados no navegador durante o redirecionamento.
- Mantém MP_ACCESS_TOKEN e PUBLIC_BASE_URL exclusivamente nas variáveis de ambiente da Vercel.

Observação:
Esta versão coleta e valida os dados de entrega. O disparo de e-mails para loja e cliente deve ser conectado a um webhook confirmado do Mercado Pago e a um serviço transacional de e-mail na próxima etapa, para evitar confirmação falsa por simples abertura da página de sucesso.
