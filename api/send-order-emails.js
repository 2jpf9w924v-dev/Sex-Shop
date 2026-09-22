const CATALOG = {
  1:{title:'Vibrador Ponto G Luxo',unit_price:189.90},
  2:{title:'Estimulador Premium',unit_price:219.90},
  3:{title:'Kit Prazer a Dois',unit_price:299.90},
  4:{title:'Lubrificante Beijável 100ml',unit_price:69.90},
  5:{title:'Calcinha Sensual em Renda',unit_price:79.90},
  6:{title:'Algemas em Pelúcia',unit_price:59.90}
};
const brl=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function resendEmail(apiKey, body, key){
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':key},
    body:JSON.stringify(body)
  });
  const raw=await r.text(); let data={};
  try{data=raw?JSON.parse(raw):{}}catch{data={message:raw}}
  if(!r.ok) throw new Error(`Resend HTTP ${r.status}: ${data.message||data.error||raw||'erro ao enviar e-mail'}`);
  return data;
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido.'});
  const mpToken=(process.env.MP_ACCESS_TOKEN||'').trim();
  const resendKey=(process.env.RESEND_API_KEY||'').trim();
  const storeEmail=(process.env.STORE_ORDER_EMAIL||'').trim();
  const from=(process.env.RESEND_FROM_EMAIL||'LUMÉ <onboarding@resend.dev>').trim();
  if(!mpToken||!resendKey||!storeEmail) return res.status(500).json({error:'Mensageria não configurada na Vercel.',details:'Verifique MP_ACCESS_TOKEN, RESEND_API_KEY e STORE_ORDER_EMAIL.'});

  try{
    const orderId=String(req.body?.order_id||'').trim();
    const customer=req.body?.customer||{};
    const requested=Array.isArray(req.body?.items)?req.body.items:[];
    if(!orderId) return res.status(400).json({error:'order_id obrigatório.'});
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(customer.email||''))) return res.status(400).json({error:'E-mail do cliente inválido.'});

    // Confirma o pagamento diretamente no Mercado Pago antes de qualquer envio.
    const mp=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${mpToken}`,Accept:'application/json'}});
    const mpRaw=await mp.text(); let order={};
    try{order=mpRaw?JSON.parse(mpRaw):{}}catch{order={}}
    if(!mp.ok) return res.status(502).json({error:'Não foi possível validar a order no Mercado Pago.',details:order.message||mpRaw});
    if(order.status!=='processed') return res.status(409).json({error:'Pagamento ainda não confirmado.',status:order.status});

    let total=0;
    const items=requested.map(x=>{
      const p=CATALOG[Number(x.id)]; const q=Math.max(1,Math.min(20,Number(x.quantity)||1));
      if(!p) return null; total+=p.unit_price*q; return {...p,id:Number(x.id),quantity:q,line:p.unit_price*q};
    }).filter(Boolean);
    total=Math.round(total*100)/100;
    if(!items.length) return res.status(400).json({error:'Itens do pedido ausentes.'});
    const mpTotal=Number(order.total_amount||0);
    if(Math.abs(mpTotal-total)>0.01) return res.status(409).json({error:'O total local não corresponde ao pagamento confirmado.',details:`Pedido ${brl(total)} / Mercado Pago ${brl(mpTotal)}`});

    const ref=order.external_reference||orderId;
    const rows=items.map(i=>`<tr><td style="padding:9px 6px;border-bottom:1px solid #eee">${esc(i.title)}</td><td style="padding:9px 6px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:9px 6px;border-bottom:1px solid #eee;text-align:right">${brl(i.line)}</td></tr>`).join('');
    const address=`${esc(customer.street)}, ${esc(customer.number)}${customer.complement?' - '+esc(customer.complement):''}<br>${esc(customer.district)} · ${esc(customer.city)}/${esc(customer.uf)} · CEP ${esc(customer.cep)}`;
    const shell=(title,body)=>`<!doctype html><html><body style="margin:0;background:#f6f3f4;font-family:Arial,sans-serif;color:#24161c"><div style="max-width:640px;margin:24px auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #eadde2"><div style="background:#160a10;color:#fff;padding:26px 30px;font-size:26px;font-weight:700">♥ LUMÉ</div><div style="padding:30px"><h1 style="font-size:24px;margin:0 0 18px">${title}</h1>${body}</div><div style="padding:18px 30px;background:#faf7f8;color:#777;font-size:12px">LUMÉ · Prazer sem tabus</div></div></body></html>`;

    const storeHtml=shell(`Novo pedido ${esc(ref)}`,`<p>Pagamento confirmado pelo Mercado Pago.</p><p><b>Cliente:</b> ${esc(customer.name)}<br><b>E-mail:</b> ${esc(customer.email)}<br><b>Telefone:</b> ${esc(customer.phone)}</p><p><b>Entrega:</b><br>${address}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Produto</th><th>Qtd.</th><th style="text-align:right">Valor</th></tr></thead><tbody>${rows}</tbody></table><p style="font-size:20px;text-align:right"><b>Total: ${brl(total)}</b></p><p style="color:#777;font-size:13px">Order Mercado Pago: ${esc(orderId)}<br>Status: ${esc(order.status_detail||order.status)}</p>`);
    const clientHtml=shell('Pagamento confirmado!',`<p>Olá, <b>${esc(customer.name)}</b>! Recebemos seu pagamento e seu pedido já pode seguir para preparação.</p><p><b>Número do pedido:</b> ${esc(ref)}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Produto</th><th>Qtd.</th><th style="text-align:right">Valor</th></tr></thead><tbody>${rows}</tbody></table><p style="font-size:20px;text-align:right"><b>Total pago: ${brl(total)}</b></p><p><b>Endereço de entrega</b><br>${address}</p><p style="color:#777">Guarde este e-mail como confirmação do seu pedido.</p>`);

    const store=await resendEmail(resendKey,{from,to:[storeEmail],subject:`Novo pedido LUMÉ — ${ref}`,html:storeHtml},`lume-store-${orderId}`);
    let client=null, clientError=null;
    try{client=await resendEmail(resendKey,{from,to:[String(customer.email).trim()],subject:`LUMÉ — pagamento confirmado • ${ref}`,html:clientHtml},`lume-client-${orderId}`)}catch(e){clientError=e.message}
    console.log('LUMÉ emails',JSON.stringify({orderId,store:store?.id,client:client?.id,clientError}));
    return res.status(clientError?207:200).json({ok:!clientError,store_email_sent:true,customer_email_sent:!clientError,store_id:store?.id,customer_id:client?.id||null,customer_error:clientError});
  }catch(e){
    console.error('LUMÉ send-order-emails error',e);
    return res.status(500).json({error:'Erro ao enviar os e-mails do pedido.',details:e?.message||String(e)});
  }
};
