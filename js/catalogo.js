/* ==========================================================================
   ZURIK · Catálogo — datos y utilidades compartidas
   --------------------------------------------------------------------------
   Este archivo es el "corazón" de los datos de la tienda: define el estado
   global (productos, carrito, ajustes), cómo se guarda/recupera y un set de
   utilidades (formato de moneda, escape de HTML, ícono de perfume, aviso
   tipo toast). Tanto index.html (tienda) como admin.html (panel) lo cargan,
   por eso vive aparte de app.js y admin.js.

   Persistencia: hoy se usa localStorage bajo la clave "zurikStore". Cuando
   se active Firebase (ver js/firebase.js) este es el lugar natural para
   reemplazar load()/save() por lecturas/escrituras a Firestore, sin tener
   que tocar la lógica de la tienda ni la del panel admin.
   ========================================================================== */

/* Ícono de perfume en SVG, reutilizado como placeholder cuando un producto
   no tiene foto (en la grilla, el carrito y la tabla de administración). */
const PERFUME_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M9 2h6v3H9zM8 5h8M7 9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v9a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z" stroke-linejoin="round"/><path d="M10 12h4" stroke-linecap="round"/></svg>';

/* Catálogo inicial: se usa solo la primera vez (o si se borra el localStorage)
   para que la tienda no arranque vacía. */
const SEED=[
  {id:'p1',house:'Maison Zurik',name:'Noir Absolu',price:420000,cat:'Unisex',notes:'Oud, vainilla negra y ámbar. Estela nocturna e intensa.',badge:'Más vendido',img:''},
  {id:'p2',house:'Atelier Lumière',name:'Rosa Eterna',price:350000,cat:'Femenino',notes:'Rosa de Damasco, peonía y almizcle blanco.',badge:'Nuevo',img:''},
  {id:'p3',house:'Casa Oriental',name:'Sultan Oud',price:480000,cat:'Árabe',notes:'Oud puro, azafrán y cuero. Lujo de Medio Oriente.',badge:'',img:''},
  {id:'p4',house:'Maison Zurik',name:'Bois Cèdre',price:390000,cat:'Masculino',notes:'Cedro, vetiver y bergamota. Elegancia sobria.',badge:'',img:''},
];

/* Estado global de la tienda: productos, datos de contacto/WhatsApp y carrito.
   Lo comparten app.js (tienda) y admin.js (panel). */
let state={products:[],wa:'595984158986',group:'',cart:{}};

/* ---------- Persistencia (localStorage) ---------- */
function load(){
  try{
    const s=JSON.parse(localStorage.getItem('zurikStore')||'null');
    if(s&&s.products){
      state=s;
      if(typeof state.group==='undefined')state.group='';
      return;
    }
  }catch(e){}
  state.products=SEED.slice();
  save();
}
function save(){
  try{localStorage.setItem('zurikStore',JSON.stringify(state));}catch(e){}
}

/* ---------- Utilidades ---------- */
function gid(){return 'p'+Date.now()+Math.floor(Math.random()*999)}
function fmt(n){return new Intl.NumberFormat('es-PY').format(n)}
function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* ---------- Aviso flotante (toast) ----------
   Se usa tanto en la tienda ("Añadido al carrito") como en el panel admin
   ("Perfume guardado", "Número guardado", etc.), por eso vive en el módulo
   compartido. Requiere que el HTML tenga #toast y #toastMsg. */
let toastT;
function showToast(m){
  const t=document.getElementById('toast');document.getElementById('toastMsg').textContent=m;
  t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200);
}
