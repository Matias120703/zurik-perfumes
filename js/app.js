/* ==========================================================================
   ZURIK · Tienda — lógica de la storefront (index.html)
   --------------------------------------------------------------------------
   Maneja todo lo que ve el cliente: splash de bienvenida, grilla de
   perfumes con búsqueda, carrito de compras, checkout (datos de envío) y
   el envío del pedido por WhatsApp. Depende de js/catalogo.js, que debe
   cargarse antes que este archivo (expone PERFUME_SVG, state, load, save,
   gid, fmt, escapeHtml y showToast).
   ========================================================================== */

/* Costo de envío, umbral para el aviso de precio mayorista y enlace por
   defecto del grupo de WhatsApp mayorista (se puede sobrescribir desde el
   panel admin → se guarda en state.group). */
const SHIPPING=30000;
const WHOLESALE_MIN=5;
const WHOLESALE_GROUP='https://chat.whatsapp.com/'; // ← Se usa si en el panel admin no se configuró un enlace propio.

/* ==========================================================================
   CATÁLOGO (grilla + búsqueda)
   ========================================================================== */
let searchTerm='';
function renderGrid(){
  const g=document.getElementById('grid');g.innerHTML='';
  const q=searchTerm.trim().toLowerCase();
  const list=state.products.filter(p=>{
    if(!q)return true;
    return [p.name,p.house,p.cat,p.notes].some(f=>(f||'').toLowerCase().includes(q));
  });
  if(!list.length){
    const txt=q?'No encontramos perfumes para “'+escapeHtml(searchTerm.trim())+'”.':'Aún no hay perfumes disponibles.';
    g.innerHTML='<div class="empty-cat">'+PERFUME_SVG+'<p>'+txt+'</p></div>';
    return;
  }
  list.forEach(p=>{
    const card=document.createElement('article');card.className='card';
    const media=p.img
      ?'<div class="card-media"><img src="'+p.img+'" alt="'+escapeHtml(p.name)+'"></div>'
      :'<div class="card-media"><div class="ph">'+PERFUME_SVG+'</div></div>';
    const badge=p.badge?'<span class="badge">'+escapeHtml(p.badge)+'</span>':'';
    card.innerHTML=media.replace('class="card-media">','class="card-media">'+badge)+
      '<div class="card-body">'+
        (p.house?'<span class="house">'+escapeHtml(p.house)+'</span>':'')+
        '<h3>'+escapeHtml(p.name)+'</h3>'+
        (p.notes?'<p class="notes">'+escapeHtml(p.notes)+'</p>':'<p class="notes"></p>')+
        '<div class="card-foot">'+
          '<span class="price tabular"><span class="cur">₲</span>'+fmt(p.price)+'</span>'+
          '<button class="add-btn" data-add="'+p.id+'">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>'+
            '<span>Añadir</span></button>'+
        '</div>'+
      '</div>';
    g.appendChild(card);
  });
  g.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
}

/* ==========================================================================
   CARRITO
   ========================================================================== */
function addToCart(id){
  state.cart[id]=(state.cart[id]||0)+1;save();renderCart();
  const p=state.products.find(x=>x.id===id);
  showToast((p?p.name:'Producto')+' añadido');
  pulseCart();
}
function pulseCart(){const c=document.getElementById('cartCount');c.animate([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:300})}
function cartItems(){
  return Object.keys(state.cart).map(id=>{
    const p=state.products.find(x=>x.id===id);
    return p?{...p,qty:state.cart[id]}:null;
  }).filter(Boolean);
}
function cartTotal(){return cartItems().reduce((s,i)=>s+i.price*i.qty,0)}
function cartQty(){return Object.values(state.cart).reduce((a,b)=>a+b,0)}
function renderCart(){
  const items=cartItems();
  const cnt=document.getElementById('cartCount');
  const q=cartQty();
  cnt.textContent=q;cnt.classList.toggle('show',q>0);
  const body=document.getElementById('cartBody');
  if(!items.length){
    body.innerHTML='<div class="cart-empty">'+PERFUME_SVG+'<p>Tu selección está vacía.</p></div>';
  }else{
    body.innerHTML='';
    items.forEach(i=>{
      const line=document.createElement('div');line.className='cart-line';
      const thumb=i.img?'<img class="thumb" src="'+i.img+'" alt="">':'<div class="thumb ph">'+PERFUME_SVG+'</div>';
      line.innerHTML=thumb+
        '<div class="info">'+
          (i.house?'<div class="house">'+escapeHtml(i.house)+'</div>':'')+
          '<h4>'+escapeHtml(i.name)+'</h4>'+
          '<div class="lp tabular">₲ '+fmt(i.price)+'</div>'+
          '<div class="qty">'+
            '<button data-dec="'+i.id+'" aria-label="Quitar uno">−</button>'+
            '<span class="tabular">'+i.qty+'</span>'+
            '<button data-inc="'+i.id+'" aria-label="Agregar uno">+</button>'+
          '</div>'+
          '<button class="line-remove" data-rm="'+i.id+'">Eliminar</button>'+
        '</div>';
      body.appendChild(line);
    });
    body.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>{state.cart[b.dataset.inc]++;save();renderCart()});
    body.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>{const id=b.dataset.dec;state.cart[id]--;if(state.cart[id]<=0)delete state.cart[id];save();renderCart()});
    body.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{delete state.cart[b.dataset.rm];save();renderCart()});
  }
  const sub=cartTotal();
  const ship=items.length?SHIPPING:0;
  document.getElementById('cartSubtotal').textContent='₲ '+fmt(sub);
  document.getElementById('cartShip').textContent='₲ '+fmt(ship);
  document.getElementById('cartTotal').textContent='₲ '+fmt(sub+ship);
  document.getElementById('checkoutBtn').disabled=!items.length;
  // Aviso mayorista (solo informativo, no aplica descuento en la web)
  const note=document.getElementById('wholesaleNote');
  if(cartQty()>=WHOLESALE_MIN){note.classList.add('show')}else{note.classList.remove('show')}
}
function openCart(){document.getElementById('drawer').classList.add('open');document.getElementById('scrim').classList.add('open');document.body.classList.add('no-scroll')}
function closeCart(){document.getElementById('drawer').classList.remove('open');document.getElementById('scrim').classList.remove('open');document.body.classList.remove('no-scroll')}

/* ==========================================================================
   CHECKOUT (datos de envío + resumen)
   ========================================================================== */
function openCheckout(){
  const items=cartItems();if(!items.length)return;
  document.getElementById('checkoutErr').classList.remove('show');
  renderOrderSummary();
  document.getElementById('checkoutScrim').classList.add('open');
  document.body.classList.add('no-scroll');
}
function closeCheckout(){document.getElementById('checkoutScrim').classList.remove('open');if(!document.getElementById('drawer').classList.contains('open'))document.body.classList.remove('no-scroll')}
function renderOrderSummary(){
  const sub=cartTotal();const ship=SHIPPING;const tot=sub+ship;
  document.getElementById('orderSummary').innerHTML=
    '<div class="os-line"><span>Subtotal ('+cartQty()+' art.)</span><span class="tabular">₲ '+fmt(sub)+'</span></div>'+
    '<div class="os-line"><span>Envío</span><span class="tabular">₲ '+fmt(ship)+'</span></div>'+
    '<div class="os-line os-total"><span>Total a pagar</span><span class="tabular">₲ '+fmt(tot)+'</span></div>';
}

/* ---------- Enviar pedido → WhatsApp ---------- */
function sendOrder(){
  const name=val('cName'),last=val('cLast'),ci=val('cCi'),phone=val('cPhone'),addr=val('cAddr'),maps=val('cMaps');
  if(!name||!last||!ci||!phone||!addr){
    document.getElementById('checkoutErr').classList.add('show');return;
  }
  const items=cartItems();if(!items.length)return;
  const sub=cartTotal();const tot=sub+SHIPPING;
  let msg='¡Hola ZURIK! 🌙 Quiero finalizar esta compra:\n\n';
  items.forEach(i=>{
    msg+='• '+i.qty+'x '+i.name+(i.house?' ('+i.house+')':'')+' — ₲ '+fmt(i.price*i.qty)+'\n';
  });
  msg+='\nSubtotal: ₲ '+fmt(sub)+'\n';
  msg+='Envío: ₲ '+fmt(SHIPPING)+'\n';
  msg+='*Total: ₲ '+fmt(tot)+'*\n\n';
  msg+='———————\n';
  msg+='*Datos de envío*\n';
  msg+='Nombre: '+name+' '+last+'\n';
  msg+='Cédula: '+ci+'\n';
  msg+='Teléfono: '+phone+'\n';
  msg+='Dirección: '+addr+'\n';
  if(maps)msg+='Ubicación: '+maps+'\n';
  const num=(state.wa||'').replace(/\D/g,'');
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');
}
function val(id){return document.getElementById(id).value.trim()}

/* ==========================================================================
   SPLASH (pantalla de bienvenida)
   ========================================================================== */
(function(){
  const sp=document.getElementById('splash');
  document.body.classList.add('no-scroll');
  function dismiss(){
    sp.classList.add('hide');
    document.body.classList.remove('no-scroll');
    setTimeout(()=>{sp.style.display='none'},750);
  }
  // Se cierra solo tras la animación; también al tocar
  const t=setTimeout(dismiss,4200);
  sp.addEventListener('click',()=>{clearTimeout(t);dismiss()});
})();

/* ==========================================================================
   ACCESO OCULTO AL PANEL ADMIN
   --------------------------------------------------------------------------
   Históricamente el panel vivía dentro de esta misma página y se abría
   escribiendo "#admin" al final de la URL. Ahora admin.html es una página
   independiente, así que ese atajo simplemente redirige hacia ella (se
   conserva el comportamiento para no romper enlaces o hábitos guardados).
   ========================================================================== */
function checkAdminHash(){
  if(location.hash==='#admin')location.href='admin.html';
}
window.addEventListener('hashchange',checkAdminHash);

/* ==========================================================================
   EVENTOS
   ========================================================================== */
document.getElementById('openCart').onclick=openCart;
document.getElementById('closeCart').onclick=closeCart;
document.getElementById('scrim').onclick=closeCart;
document.getElementById('checkoutBtn').onclick=openCheckout;
document.getElementById('checkoutClose').onclick=closeCheckout;
document.getElementById('checkoutBack').onclick=closeCheckout;
document.getElementById('sendOrder').onclick=sendOrder;
document.getElementById('checkoutScrim').onclick=e=>{if(e.target.id==='checkoutScrim')closeCheckout()};
document.getElementById('wholesaleLink').onclick=e=>{e.preventDefault();window.open(state.group||WHOLESALE_GROUP,'_blank')};
document.getElementById('wholesaleCtaBtn').onclick=()=>window.open(state.group||WHOLESALE_GROUP,'_blank');

(function(){
  const si=document.getElementById('searchInput');
  const sc=document.getElementById('searchClear');
  si.addEventListener('input',()=>{
    searchTerm=si.value;
    sc.style.display=si.value?'grid':'none';
    renderGrid();
  });
  sc.onclick=()=>{si.value='';searchTerm='';sc.style.display='none';renderGrid();si.focus();};
})();

document.getElementById('brandHome').onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'})};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeCheckout();}});

/* ==========================================================================
   INICIO
   ========================================================================== */
load();renderGrid();renderCart();checkAdminHash();
