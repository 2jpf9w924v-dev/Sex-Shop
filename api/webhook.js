module.exports=async function handler(req,res){
  // O webhook confirma eventos no servidor. Em produção, valide a assinatura x-signature
  // conforme a documentação do Mercado Pago e grave o pedido em um banco de dados.
  if(req.method!=='POST') return res.status(405).end();
  console.log('Webhook Mercado Pago',JSON.stringify(req.body||{}));
  res.status(200).json({received:true});
}
