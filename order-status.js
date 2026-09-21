module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({error:'Método não permitido.'});
  const token=(process.env.MP_ACCESS_TOKEN||'').trim();
  if(!token) return res.status(500).json({error:'MP_ACCESS_TOKEN não configurado na Vercel.'});
  const oid=String(req.query?.order_id||'').trim();
  if(!/^[A-Za-z0-9_-]+$/.test(oid)) return res.status(400).json({error:'order_id inválido.'});
  try{
    const mp=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(oid)}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
    const raw=await mp.text();
    let data={}; try{data=raw?JSON.parse(raw):{};}catch{data={message:raw};}
    if(!mp.ok) return res.status(mp.status).json({error:'Não foi possível consultar a order.',details:data?.message||data?.error||raw});
    return res.status(200).json({id:data.id,status:data.status,status_detail:data.status_detail,external_reference:data.external_reference,total_amount:data.total_amount,total_paid_amount:data.total_paid_amount,last_updated_date:data.last_updated_date});
  }catch(e){
    console.error('LUMÉ order-status error',e);
    return res.status(500).json({error:'Erro interno ao consultar a order.',details:e?.message||String(e)});
  }
};
