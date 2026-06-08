/* ==========================================================================
   ZURIK · Catálogo — datos y utilidades compartidas
   --------------------------------------------------------------------------
   Este archivo define el estado global (productos, carrito, ajustes) y un
   set de utilidades (formato de moneda, escape de HTML, ícono de perfume,
   aviso tipo toast). Tanto index.html (tienda) como admin.html (panel) lo
   cargan, por eso vive aparte de app.js y admin.js.

   Persistencia:
     · Productos y ajustes (WhatsApp, grupo mayorista) viven en Firestore y
       llegan en vivo mediante watchPerfumes()/watchSettings() (ver
       js/firebase.js); app.js y admin.js arrancan esas suscripciones y
       actualizan `state` cada vez que cambian.
     · El carrito es lo único que sigue viviendo en este navegador
       (localStorage), porque cada visitante arma su propia selección antes
       de coordinar el pedido por WhatsApp — ver loadCart()/saveCart().
   ========================================================================== */

/* Ícono de perfume en SVG, reutilizado como placeholder cuando un producto
   no tiene foto (en la grilla, el carrito y la tabla de administración). */
const PERFUME_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M9 2h6v3H9zM8 5h8M7 9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v9a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" stroke-linejoin="round"/><path d="M10 12h4" stroke-linecap="round"/></svg>';

/* Estado global de la tienda: productos (sincronizados desde Firestore),
   datos de contacto/WhatsApp (también desde Firestore) y carrito (local).
   Lo comparten app.js (tienda) y admin.js (panel). */
let state={products:[],wa:'595984158986',group:'',cart:{},ventas:[],gastos:[]};

/* ---------- Persistencia del carrito (localStorage) ---------- */
const CART_KEY='zurikCart';
function loadCart(){
  try{
    const c=JSON.parse(localStorage.getItem(CART_KEY)||'null');
    if(c&&typeof c==='object')state.cart=c;
  }catch(e){}
}
function saveCart(){
  try{localStorage.setItem(CART_KEY,JSON.stringify(state.cart));}catch(e){}
}

/* ---------- Utilidades ---------- */
function fmt(n){return new Intl.NumberFormat('es-PY').format(n)}
function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* ---------- Calificaciones (estrellas + promedio + reseñas) ----------
   Se usa tanto en la grilla del catálogo como en la ficha de detalle. Solo
   se muestra cuando el perfume tiene al menos una reseña cargada desde
   admin; mientras no haya reseñas, renderRating() devuelve '' y no ocupa
   espacio en el layout. */
const STAR_SVG='<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.5 6.9.7-5.2 4.8 1.4 6.9L12 17.7 5.9 21.4l1.4-6.9-5.2-4.8 6.9-.7z"/></svg>';
function renderStars(rating){
  const r=Math.round(Math.min(5,Math.max(0,Number(rating)||0)));
  let html='';
  for(let i=1;i<=5;i++)html+='<span class="star'+(i<=r?' filled':'')+'">'+STAR_SVG+'</span>';
  return html;
}
function renderRating(p){
  const count=Number(p.reviewCount)||0;
  if(!count)return '';
  const rating=Number(p.rating)||0;
  return '<div class="rating"><span class="stars">'+renderStars(rating)+'</span>'+
    '<span class="score tabular">'+rating.toFixed(1)+'</span>'+
    '<span class="count">('+count+(count===1?' reseña':' reseñas')+')</span></div>';
}

/* ---------- Aviso flotante (toast) ----------
   Se usa tanto en la tienda ("Añadido al carrito") como en el panel admin
   ("Perfume guardado", "Número guardado", etc.), por eso vive en el módulo
   compartido. Requiere que el HTML tenga #toast y #toastMsg. */
let toastT;
function showToast(m){
  const t=document.getElementById('toast');document.getElementById('toastMsg').textContent=m;
  t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200);
}
