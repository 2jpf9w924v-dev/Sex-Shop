module.exports=async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Método não permitido'});
  const token=process.env.MP_ACCESS_TOKEN; const id=String(req.query?.payment_id||'').replace(/[^0-9]/g,'');
  if(!token) return res.status(500).json({error:'MP_ACCESS_TOKEN não configurado.'});
  if(!id) return res.status(400).json({error:'payment_id inválido.'});
  try{
    const r=await fetch(`https://api.mercadopago.com/v1/payments/${id}`,{headers:{Authorization:`Bearer ${token}`}}); const d=await r.json();
    if(!r.ok) return res.status(r.status).json({error:'Pagamento não encontrado.'});
    res.json({id:d.id,status:d.status,status_detail:d.status_detail,external_reference:d.external_reference,transaction_amount:d.transaction_amount,date_approved:d.date_approved});
  }catch(e){res.status(500).json({error:'Falha ao consultar pagamento.'});}
}
