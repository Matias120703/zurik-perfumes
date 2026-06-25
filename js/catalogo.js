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

/* ---------- Encuadre inteligente de fotos con mucho margen transparente ----------
   Algunos PNG de perfumes traen el frasco chico, rodeado de margen
   transparente; con object-fit:contain eso se ve "perdido" dentro de la
   tarjeta. Esta utilidad analiza el canal alfa de cada foto (en un canvas
   oculto, nunca toca Firestore ni el archivo original) para detectar el
   recuadro real del frasco y aplica zoom+recentrado vía variables CSS
   (--fit-scale/--fit-tx/--fit-ty que usa css/style.css) hasta que ese
   recuadro ocupe ~78% del alto/ancho disponible. Si la foto ya viene bien
   encuadrada, o si el navegador no puede leer sus píxeles (CORS), no se
   toca nada y la imagen se ve como siempre. Se cachea por URL para no
   repetir el análisis en cada re-render del catálogo en tiempo real. */
const SMART_FIT_TARGET=.78;
const smartFitCache=new Map();
function applySmartFit(img){
  if(!img)return;
  const src=img.getAttribute('src');
  if(!src)return;
  const use=r=>{
    if(!r)return;
    img.style.setProperty('--fit-scale',r.s);
    img.style.setProperty('--fit-tx',r.tx+'%');
    img.style.setProperty('--fit-ty',r.ty+'%');
  };
  if(smartFitCache.has(src)){use(smartFitCache.get(src));return;}
  const analyze=()=>{
    try{
      const w=img.naturalWidth,h=img.naturalHeight;
      if(!w||!h)return;
      const max=160,down=Math.min(1,max/Math.max(w,h));
      const cw=Math.max(1,Math.round(w*down)),ch=Math.max(1,Math.round(h*down));
      const canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,cw,ch);
      const data=ctx.getImageData(0,0,cw,ch).data;
      let minX=cw,minY=ch,maxX=-1,maxY=-1;
      for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
        if(data[(y*cw+x)*4+3]>12){
          if(x<minX)minX=x;if(x>maxX)maxX=x;
          if(y<minY)minY=y;if(y>maxY)maxY=y;
        }
      }
      if(maxX<0||maxY<0){smartFitCache.set(src,null);return;}
      const bw=maxX-minX+1,bh=maxY-minY+1;
      if((bw*bh)/(cw*ch)<.02){smartFitCache.set(src,null);return;}
      const fDom=Math.max(bw/cw,bh/ch);
      const s=Math.min(2.5,Math.max(1,SMART_FIT_TARGET/fDom));
      const r=s>1.02?{
        s:+s.toFixed(3),
        tx:+(((cw/2-(minX+maxX+1)/2)/cw)*100).toFixed(2),
        ty:+(((ch/2-(minY+maxY+1)/2)/ch)*100).toFixed(2)
      }:null;
      smartFitCache.set(src,r);use(r);
    }catch(e){smartFitCache.set(src,null);} // imagen sin CORS habilitado: se deja como está
  };
  if(img.complete&&img.naturalWidth)analyze();
  else img.addEventListener('load',analyze,{once:true});
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
