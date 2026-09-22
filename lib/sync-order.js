const {db}=require('./db');
const {sendPaidEmails}=require('./mailer');
async function getMP(orderId){
  const token=(process.env.MP_ACCESS_TOKEN||'').trim();
  if(!token) throw new Error('MP_ACCESS_TOKEN não configurado.');
  const r=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.message||`Mercado Pago HTTP ${r.status}`);
  return d;
}
async function syncOrder(orderId){
  const order=await getMP(orderId),sql=db();
  const rows=await sql`SELECT * FROM orders WHERE mercado_pago_order_id=${String(orderId)} LIMIT 1`;
  if(!rows[0]) return {found:false,order};
  const current=rows[0],paid=order.status==='processed';
  const method=String(order.transactions?.payments?.[0]?.payment_method?.id||'');
  const nextStatus=paid&&current.order_status==='aguardando_pagamento'?'pagamento_confirmado':current.order_status;
  await sql`UPDATE orders SET payment_status=${String(order.status||'unknown')},payment_method=${method},order_status=${nextStatus},updated_at=NOW() WHERE id=${current.id}`;
  if(paid&&current.order_status==='aguardando_pagamento'){
    await sql`INSERT INTO order_status_history(order_id,old_status,new_status,changed_by) SELECT ${current.id},${current.order_status},'pagamento_confirmado','Mercado Pago' WHERE NOT EXISTS(SELECT 1 FROM order_status_history WHERE order_id=${current.id} AND new_status='pagamento_confirmado')`;
  }
  if(paid){
    const items=await sql`SELECT * FROM order_items WHERE order_id=${current.id} ORDER BY id`;
    const refreshed=(await sql`SELECT * FROM orders WHERE id=${current.id}`)[0];
    const email=await sendPaidEmails(refreshed,items);
    return {found:true,paid:true,dbOrder:refreshed,email,mp:order};
  }
  return {found:true,paid:false,dbOrder:current,mp:order};
}
module.exports={syncOrder,getMP};
