const jwt=require('jsonwebtoken');
const cookie=require('cookie');
function secret(){const s=(process.env.ADMIN_SESSION_SECRET||'').trim();if(!s)throw new Error('ADMIN_SESSION_SECRET não configurado.');return s}
function tokenFrom(req){const c=cookie.parse(req.headers.cookie||'');return c.lume_admin||''}
function requireAdmin(req){const t=tokenFrom(req);if(!t)throw Object.assign(new Error('Não autenticado.'),{status:401});try{return jwt.verify(t,secret())}catch{throw Object.assign(new Error('Sessão inválida.'),{status:401})}}
function makeToken(user){return jwt.sign({sub:String(user.id),name:user.name,email:user.email},secret(),{expiresIn:'12h'})}
function sessionCookie(token){return cookie.serialize('lume_admin',token,{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:43200})}
function clearCookie(){return cookie.serialize('lume_admin','',{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:0})}
module.exports={requireAdmin,makeToken,sessionCookie,clearCookie};
