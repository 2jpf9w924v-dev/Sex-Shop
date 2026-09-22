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


const checkoutFieldIds=['coName','coEmail','coPhone','coCep','coStreet','coNumber','coDistrict','coCity','coUf'];
function onlyDigits(v){return String(v||'').replace(/\D/g,'')}
function formatPhone(v){const d=onlyDigits(v).slice(0,11);if(d.length<=10)return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/,'($1) $2-$3').replace(/[- ]+$/,'');return d.replace(/(\d{2})(\d{0,5})(\d{0,4})/,'($1) $2-$3').replace(/[- ]+$/,'')}
function formatCep(v){const d=onlyDigits(v).slice(0,8);return d.length>5?d.slice(0,5)+'-'+d.slice(5):d}
function getCustomer(){return {name:coName.value.trim(),email:coEmail.value.trim().toLowerCase(),phone:coPhone.value.trim(),cep:coCep.value.trim(),street:coStreet.value.trim(),number:coNumber.value.trim(),complement:coComplement.value.trim(),district:coDistrict.value.trim(),city:coCity.value.trim(),uf:coUf.value.trim()}}
function fillCustomer(c={}){coName.value=c.name||'';coEmail.value=c.email||'';coPhone.value=c.phone||'';coCep.value=c.cep||'';coStreet.value=c.street||'';coNumber.value=c.number||'';coComplement.value=c.complement||'';coDistrict.value=c.district||'';coCity.value=c.city||'';coUf.value=c.uf||''}
function startCheckout(){
  if(!cart.length){toast('Adicione pelo menos um produto ao carrinho.');return}
  try{fillCustomer(JSON.parse(localStorage.getItem('lumeCustomer')||'{}'))}catch(e){}
  document.querySelector('#cart').classList.remove('open');document.querySelector('#overlay').classList.remove('show');
  checkoutModal.classList.add('open');checkoutModal.setAttribute('aria-hidden','false');backToDelivery();setTimeout(()=>coName.focus(),100)
}
function closeCheckout(){checkoutModal.classList.remove('open');checkoutModal.setAttribute('aria-hidden','true')}
function validateDelivery(){
  document.querySelectorAll('#deliveryForm .invalid').forEach(x=>x.classList.remove('invalid'));
  const c=getCustomer();let bad=[];
  if(c.name.length<3)bad.push(coName);if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email))bad.push(coEmail);
  if(onlyDigits(c.phone).length<10)bad.push(coPhone);if(onlyDigits(c.cep).length!==8)bad.push(coCep);
  if(!c.street)bad.push(coStreet);if(!c.number)bad.push(coNumber);if(!c.district)bad.push(coDistrict);if(!c.city)bad.push(coCity);if(!/^[A-Z]{2}$/.test(c.uf))bad.push(coUf);
  bad.forEach(x=>x.classList.add('invalid'));if(!coPrivacy.checked){toast('Confirme os dados para entrega.');return false}
  if(bad.length){toast('Preencha corretamente os campos obrigatórios.');bad[0].focus();return false}return true
}
async function lookupCep(){
  const cep=onlyDigits(coCep.value);if(cep.length!==8){coCep.classList.add('invalid');cepStatus.textContent='Informe um CEP com 8 dígitos.';return}
  cepStatus.textContent='Buscando CEP...';
  try{const r=await fetch('https://viacep.com.br/ws/'+cep+'/json/');const d=await r.json();if(!r.ok||d.erro)throw new Error('CEP não encontrado');coStreet.value=d.logradouro||coStreet.value;coDistrict.value=d.bairro||coDistrict.value;coCity.value=d.localidade||coCity.value;coUf.value=d.uf||coUf.value;cepStatus.textContent='CEP localizado.';coNumber.focus()}catch(e){cepStatus.textContent='Não foi possível localizar o CEP. Preencha o endereço manualmente.'}
}
function reviewCheckout(e){e.preventDefault();if(!validateDelivery())return;const c=getCustomer();localStorage.setItem('lumeCustomer',JSON.stringify(c));reviewItems.innerHTML=cart.map(x=>`<div class="reviewItem"><img src="${x.img}" alt=""><div><b>${x.name}</b><small>${x.q} × ${money(x.price)}</small></div><strong>${money(x.price*x.q)}</strong></div>`).join('');reviewName.textContent=c.name;reviewAddress.textContent=`${c.street}, ${c.number}${c.complement?' - '+c.complement:''} · ${c.district} · ${c.city}/${c.uf} · CEP ${c.cep}`;reviewContact.textContent=`${c.email} · ${c.phone}`;reviewTotal.textContent=money(cart.reduce((a,b)=>a+b.price*b.q,0));deliveryStep.hidden=true;reviewStep.hidden=false;stepDot1.classList.remove('active');stepDot2.classList.add('active');checkoutPanelTop()}
function checkoutPanelTop(){document.querySelector('.checkoutPanel').scrollTo({top:0,behavior:'smooth'})}
function backToDelivery(){deliveryStep.hidden=false;reviewStep.hidden=true;stepDot1.classList.add('active');stepDot2.classList.remove('active');checkoutPanelTop()}
async function submitPayment(){
  const customer=getCustomer();const btn=document.querySelector('#payBtn');const old=btn.textContent;btn.disabled=true;btn.textContent='Preparando pagamento...';
  const pending={customer,items:cart.map(x=>({id:x.id,name:x.name,quantity:x.q,unit_price:x.price,image:x.img})),total:cart.reduce((a,b)=>a+b.price*b.q,0),createdAt:Date.now()};localStorage.setItem('lumePendingOrder',JSON.stringify(pending));
  try{const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payer_email:customer.email,customer,items:cart.map(({id,q})=>({id,quantity:q}))})});const raw=await response.text();let data;try{data=raw?JSON.parse(raw):{}}catch{throw new Error('A API da loja respondeu em formato inválido. HTTP '+response.status+'. '+raw.slice(0,160))}if(!response.ok)throw new Error((data.error||'Não foi possível iniciar o pagamento.')+(data.details?' '+data.details:''));if(!data.checkout_url)throw new Error('Mercado Pago não retornou checkout_url.');localStorage.setItem('lumeLastOrder',JSON.stringify({order_id:data.order_id,reference:data.external_reference,createdAt:Date.now()}));window.location.href=data.checkout_url}catch(err){console.error(err);toast(err.message||'Erro ao abrir o checkout.');btn.disabled=false;btn.textContent=old}
}
coPhone?.addEventListener('input',e=>e.target.value=formatPhone(e.target.value));coCep?.addEventListener('input',e=>e.target.value=formatCep(e.target.value));coCep?.addEventListener('blur',()=>{if(onlyDigits(coCep.value).length===8&&!coStreet.value)lookupCep()});
