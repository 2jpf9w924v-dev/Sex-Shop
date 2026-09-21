const categories=[
['Vibradores','assets/category-vibradores.jpg'],['Estimuladores','assets/category-estimuladores.jpg'],['Lubrificantes','assets/category-lubrificantes.jpg'],['Lingeries Sensuais','assets/category-lingerie.jpg'],['Kits & Combos','assets/category-kits.jpg'],['Bem-estar Íntimo','assets/category-bemestar.jpg'],['Para Casais','assets/category-casais.jpg']];
const products=[
{id:1,name:'Vibrador Ponto G Luxo',price:189.90,cat:'Bem-estar',img:'assets/product-1.jpg',badge:'Mais vendido',rating:128},
{id:2,name:'Estimulador Premium',price:219.90,old:279.90,cat:'Bem-estar',img:'assets/product-2.jpg',badge:'Oferta',rating:97},
{id:3,name:'Kit Prazer a Dois',price:299.90,cat:'Casais',img:'assets/product-3.jpg',badge:'Novo',rating:64},
{id:4,name:'Lubrificante Beijável 100ml',price:69.90,old:89.90,cat:'Bem-estar',img:'assets/product-4.jpg',badge:'-20%',rating:112},
{id:5,name:'Calcinha Sensual em Renda',price:79.90,cat:'Casais',img:'assets/product-5.jpg',badge:'Favorito',rating:84},
{id:6,name:'Algemas em Pelúcia',price:59.90,old:69.90,cat:'Casais',img:'assets/product-6.jpg',badge:'-15%',rating:56}];
let cart=JSON.parse(localStorage.getItem('lumeCart')||'[]');
function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function enterSite(){localStorage.setItem('lume18','1');document.querySelector('#age').classList.add('hide')}
if(localStorage.getItem('lume18'))document.querySelector('#age').classList.add('hide');
function renderCats(){document.querySelector('#cats').innerHTML=categories.map(c=>`<article class="cat" onclick="document.querySelector('#products').scrollIntoView({behavior:'smooth'})"><img src="${c[1]}" alt="${c[0]}"><b>${c[0]}</b></article>`).join('')}
function renderProducts(list=products){document.querySelector('#products').innerHTML=list.map(p=>`<article class="product"><span class="badge">${p.badge}</span><button class="fav" onclick="this.classList.toggle('liked');this.textContent=this.classList.contains('liked')?'♥':'♡'">♡</button><div class="pic"><img src="${p.img}" alt="${p.name}"></div><div class="info"><h3>${p.name}</h3><div class="rating">★★★★★ <span>(${p.rating})</span></div><div class="price">${money(p.price)} ${p.old?`<del>${money(p.old)}</del>`:''}</div><div class="installment">em até 6x de ${money(p.price/6)}</div><button class="add" onclick="addCart(${p.id})">Adicionar 🛒</button></div></article>`).join('')}
function filterProducts(cat,el){document.querySelectorAll('.filter button').forEach(b=>b.classList.remove('on'));el.classList.add('on');renderProducts(cat==='Todos'?products:products.filter(p=>p.cat===cat))}
function addCart(id){let p=products.find(x=>x.id===id),i=cart.find(x=>x.id===id);i?i.q++:cart.push({...p,q:1});updateCart();toast('Produto adicionado ao carrinho')}
function removeCart(id){cart=cart.filter(x=>x.id!==id);updateCart()}
function updateCart(){localStorage.setItem('lumeCart',JSON.stringify(cart));document.querySelector('#cartCount').textContent=cart.reduce((a,b)=>a+b.q,0);document.querySelector('#cartItems').innerHTML=cart.length?cart.map(x=>`<div class="cartItem"><img src="${x.img}"><span><b>${x.name}</b><br><small>${x.q} × ${money(x.price)}</small></span><button onclick="removeCart(${x.id})">×</button></div>`).join(''):'<p class="empty">Seu carrinho está vazio.</p>';document.querySelector('#cartTotal').textContent=money(cart.reduce((a,b)=>a+b.price*b.q,0))}
function toggleCart(){document.querySelector('#cart').classList.toggle('open');document.querySelector('#overlay').classList.toggle('show')}
function doSearch(){let q=document.querySelector('#search').value.toLowerCase().trim();renderProducts(products.filter(p=>p.name.toLowerCase().includes(q)));document.querySelector('#products').scrollIntoView({behavior:'smooth'})}
document.querySelector('#search').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
function newsletter(e){e.preventDefault();e.target.reset();toast('Cupom LUME10 liberado!')}
function toast(t){let x=document.querySelector('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
renderCats();renderProducts();updateCart();


async function startCheckout(){
  if(!cart.length){toast('Adicione pelo menos um produto ao carrinho.');return;}
  const savedEmail=localStorage.getItem('lumeBuyerEmail')||'';
  const payerEmail=prompt('Digite o e-mail do COMPRADOR DE TESTE do Mercado Pago:',savedEmail);
  if(!payerEmail)return;
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payerEmail.trim())){toast('Digite um e-mail válido.');return;}
  localStorage.setItem('lumeBuyerEmail',payerEmail.trim());
  const btn=document.querySelector('#checkoutBtn');
  const old=btn.textContent;
  btn.disabled=true;btn.textContent='Preparando pagamento...';
  try{
    const response=await fetch('/api/create-order',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({payer_email:payerEmail.trim(),items:cart.map(({id,q})=>({id,quantity:q}))})
    });
    const raw=await response.text();
    let data;
    try{data=raw?JSON.parse(raw):{};}catch{throw new Error('A API da loja respondeu em formato inválido. HTTP '+response.status+'. '+raw.slice(0,160));}
    if(!response.ok) throw new Error((data.error||'Não foi possível iniciar o pagamento.')+(data.details?' '+data.details:''));
    if(!data.checkout_url) throw new Error('Mercado Pago não retornou checkout_url.');
    localStorage.setItem('lumeLastOrder',JSON.stringify({order_id:data.order_id,reference:data.external_reference,createdAt:Date.now()}));
    window.location.href=data.checkout_url;
  }catch(err){
    console.error(err);toast(err.message||'Erro ao abrir o checkout.');
    btn.disabled=false;btn.textContent=old;
  }
}
