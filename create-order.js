const { randomUUID } = require('crypto');

const CATALOG = {
  1:{title:'Vibrador Ponto G Luxo',unit_price:189.90},
  2:{title:'Estimulador Premium',unit_price:219.90},
  3:{title:'Kit Prazer a Dois',unit_price:299.90},
  4:{title:'Lubrificante Beijável 100ml',unit_price:69.90},
  5:{title:'Calcinha Sensual em Renda',unit_price:79.90},
  6:{title:'Algemas em Pelúcia',unit_price:59.90}
};
const money = n => Number(n).toFixed(2);

module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido.'});
  const token=(process.env.MP_ACCESS_TOKEN||'').trim();
  if(!token) return res.status(500).json({error:'MP_ACCESS_TOKEN não configurado na Vercel.'});

  try{
    const requested=Array.isArray(req.body?.items)?req.body.items:[];
    const email=String(req.body?.payer_email||'').trim().toLowerCase();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({error:'Informe um e-mail válido para o comprador.'});

    let total=0;
    const items=requested.map(x=>{
      const p=CATALOG[Number(x.id)];
      const q=Math.max(1,Math.min(20,Number(x.quantity)||1));
      if(!p) return null;
      total += p.unit_price*q;
      return {title:p.title,quantity:q,unit_price:money(p.unit_price)};
    }).filter(Boolean);
    total=Math.round(total*100)/100;
    if(!items.length) return res.status(400).json({error:'Carrinho vazio ou inválido.'});

    const configured=(process.env.PUBLIC_BASE_URL||'').trim().replace(/\/$/,'');
    const forwardedProto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
    const host=req.headers['x-forwarded-host']||req.headers.host;
    const base=configured || (host ? `${forwardedProto}://${host}` : '');
    if(!/^https:\/\//i.test(base)) return res.status(500).json({error:'PUBLIC_BASE_URL precisa ser uma URL HTTPS válida.'});

    const external_reference=`LUME-${Date.now()}-${randomUUID().slice(0,6).toUpperCase()}`;
    const payload={
      type:'online',
      processing_mode:'manual',
      capture_mode:'automatic_async',
      total_amount:money(total),
      external_reference,
      payer:{email},
      items,
      description:'Compra LUMÉ',
      config:{
        statement_descriptor:'LUME',
        online:{
          success_url:`${base}/success.html`,
          failure_url:`${base}/failure.html`,
          pending_url:`${base}/pending.html`,
          auto_return:'approved'
        }
      }
    };

    const mp=await fetch('https://api.mercadopago.com/v1/orders',{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json','X-Idempotency-Key':randomUUID()},
      body:JSON.stringify(payload)
    });
    const raw=await mp.text();
    let data={};
    try{ data=raw?JSON.parse(raw):{}; }catch{ data={message:raw||'Resposta vazia do Mercado Pago.'}; }
    console.log('LUMÉ create-order',JSON.stringify({http:mp.status,external_reference,mp:data}));
    if(!mp.ok){
      const details=Array.isArray(data?.errors)?data.errors.map(e=>`${e.code||'erro'}: ${e.message||''}${e.details?' | '+e.details.join(' | '):''}`).join(' || '):(data?.message||data?.error||'Erro não informado.');
      return res.status(mp.status).json({error:'Mercado Pago recusou a criação da order.',details});
    }
    if(!data.checkout_url) return res.status(502).json({error:'Order criada, mas o Mercado Pago não retornou checkout_url.'});
    return res.status(200).json({order_id:data.id,checkout_url:data.checkout_url,external_reference,status:data.status});
  }catch(e){
    console.error('LUMÉ create-order error',e);
    return res.status(500).json({error:'Erro interno ao criar a order.',details:e?.message||String(e)});
  }
};
