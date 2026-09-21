const CATALOG = {
  1:{title:'Vibrador Ponto G Luxo',unit_price:189.90},
  2:{title:'Estimulador Premium',unit_price:219.90},
  3:{title:'Kit Prazer a Dois',unit_price:299.90},
  4:{title:'Lubrificante Beijável 100ml',unit_price:69.90},
  5:{title:'Calcinha Sensual em Renda',unit_price:79.90},
  6:{title:'Algemas em Pelúcia',unit_price:59.90}
};

module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido'});
  const token=process.env.MP_ACCESS_TOKEN;
  if(!token) return res.status(500).json({error:'MP_ACCESS_TOKEN não configurado no servidor.'});
  try{
    const requested=Array.isArray(req.body?.items)?req.body.items:[];
    const items=requested.map(x=>{
      const p=CATALOG[Number(x.id)]; const q=Math.max(1,Math.min(20,Number(x.quantity)||1));
      return p?{id:String(x.id),title:p.title,quantity:q,currency_id:'BRL',unit_price:p.unit_price}:null;
    }).filter(Boolean);
    if(!items.length) return res.status(400).json({error:'Carrinho vazio ou inválido.'});
    // Preços vêm do catálogo do servidor, nunca do navegador.
    const base=(process.env.PUBLIC_BASE_URL||`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`).replace(/\/$/,'');
    if(!/^https:\/\//i.test(base) && !/localhost|127\.0\.0\.1/.test(base)) return res.status(500).json({error:'PUBLIC_BASE_URL precisa usar HTTPS.'});
    const external_reference=`LUME-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const body={
      items,
      external_reference,
      statement_descriptor:'LUME',
      back_urls:{success:`${base}/success.html`,failure:`${base}/failure.html`,pending:`${base}/pending.html`},
      auto_return:'approved',
      notification_url:`${base}/api/webhook`,
      metadata:{store:'LUME'}
    };
    const mp=await fetch('https://api.mercadopago.com/checkout/preferences',{
      method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json','X-Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(body)
    });
    const data=await mp.json();
    if(!mp.ok){console.error('Mercado Pago:',data);return res.status(mp.status).json({error:'Mercado Pago recusou a criação do checkout.',details:data.message||data.error});}
    const isTest=/^TEST-|^APP_USR-/i.test(token) && data.sandbox_init_point;
    res.status(200).json({preference_id:data.id,checkout_url:isTest?data.sandbox_init_point:data.init_point,external_reference});
  }catch(e){console.error(e);res.status(500).json({error:'Erro interno ao criar checkout.'});}
}
