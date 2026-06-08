/* ==========================================================================
   ZURIK · Panel de Administración — lógica (admin.html)
   --------------------------------------------------------------------------
   Controla el acceso por contraseña, el listado/edición/borrado de
   perfumes (CRUD), la carga y compresión de fotos, los ajustes de
   contacto (número de WhatsApp y enlace del grupo mayorista) y el
   dashboard financiero (ventas, gastos, totales, gráfico Ventas vs
   Gastos y producto más vendido — todo en tiempo real).
   Depende de:
     · Chart.js (CDN, cargado en admin.html antes de este archivo) →
       global "Chart", usado por renderFinanceChart.
     · js/catalogo.js → PERFUME_SVG, state, fmt, escapeHtml, showToast.
     · js/firebase.js → watchPerfumes/createPerfume/updatePerfume/
       deletePerfume/watchSettings/saveSettings/watchVentas/createVenta/
       updateVenta/deleteVenta/watchGastos/createGasto/updateGasto/
       deleteGasto: todo el CRUD se hace contra Firestore (colecciones
       "perfumes", "ajustes", "ventas" y "gastos"), y las listas y totales
       se redibujan solos apenas hay cambios — no se guarda nada localmente.
   ========================================================================== */

// 🔒 Contraseña del panel. Cámbiala por la tuya antes de publicar el sitio.
const ADMIN_PASSWORD='zurik2024';

/* ==========================================================================
   LOGIN
   ========================================================================== */
function login(){
  const v=document.getElementById('pwInput').value;
  if(v===ADMIN_PASSWORD){
    document.getElementById('loginView').style.display='none';
    document.getElementById('dashView').style.display='block';
    syncSettingsToForm();
    renderAdmin();
  }else{
    document.getElementById('pwErr').classList.add('show');
  }
}

/* ==========================================================================
   LISTADO DE INVENTARIO
   ========================================================================== */
function renderAdmin(){
  const wrap=document.getElementById('adminList');
  if(!state.products.length){
    wrap.innerHTML='<div class="admin-empty">'+PERFUME_SVG+'<p>Sin perfumes todavía. Agrega el primero con “Nuevo perfume”.</p></div>';
    return;
  }
  let rows='';
  state.products.forEach(p=>{
    const thumb=p.img?'<img class="tthumb" src="'+p.img+'" alt="">':'<div class="tthumb ph">'+PERFUME_SVG+'</div>';
    rows+='<tr>'+
      '<td><div class="tprod">'+thumb+'<div class="meta"><div class="tname">'+escapeHtml(p.name)+'</div><div class="thouse">'+escapeHtml(p.house||'—')+'</div></div></div></td>'+
      '<td>'+escapeHtml(p.cat||'—')+'</td>'+
      '<td class="tabular">₲ '+fmt(p.price)+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="mini-btn" data-edit="'+p.id+'" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
        '<button class="mini-btn del" data-del="'+p.id+'" aria-label="Eliminar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  });
  wrap.innerHTML='<table class="admin-table"><thead><tr><th>Perfume</th><th>Categoría</th><th>Precio</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
  wrap.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(b.dataset.edit));
  wrap.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(!confirm('¿Eliminar este perfume?'))return;
    deletePerfume(b.dataset.del)
      .then(()=>showToast('Perfume eliminado'))
      .catch(()=>showToast('No se pudo eliminar el perfume'));
  });
}

/* ==========================================================================
   MODAL DE PRODUCTO (alta / edición)
   ========================================================================== */
let editingId=null,tempImg='';
function openModal(id){
  editingId=id||null;tempImg='';
  document.getElementById('formErr').classList.remove('show');
  const t=document.getElementById('modalTitle');
  if(id){
    const p=state.products.find(x=>x.id===id);
    t.textContent='Editar perfume';
    document.getElementById('fHouse').value=p.house||'';
    document.getElementById('fName').value=p.name||'';
    document.getElementById('fPrice').value=p.price?fmt(p.price):'';
    document.getElementById('fCat').value=p.cat||'Masculino';
    document.getElementById('fNotes').value=p.notes||'';
    document.getElementById('fTopNotes').value=p.topNotes||'';
    document.getElementById('fHeartNotes').value=p.heartNotes||'';
    document.getElementById('fBaseNotes').value=p.baseNotes||'';
    document.getElementById('fDuration').value=p.duration||'';
    document.getElementById('fProjection').value=p.projection||'';
    document.getElementById('fBadge').value=p.badge||'';
    document.getElementById('fRating').value=p.rating?String(p.rating):'';
    document.getElementById('fReviewCount').value=p.reviewCount?String(p.reviewCount):'';
    tempImg=p.img||'';
    setPreview(tempImg);
  }else{
    t.textContent='Nuevo perfume';
    ['fHouse','fName','fPrice','fNotes','fTopNotes','fHeartNotes','fBaseNotes','fDuration','fProjection','fBadge','fRating','fReviewCount'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('fCat').value='Femenino';
    setPreview('');
  }
  document.getElementById('fImg').value='';
  document.getElementById('modalScrim').classList.add('open');
}
function setPreview(src){
  const prev=document.getElementById('imgPreview');
  if(src){prev.src=src;prev.classList.remove('ph');prev.innerHTML='';}
  else{prev.removeAttribute('src');prev.classList.add('ph');prev.innerHTML=PERFUME_SVG;}
}
function closeModal(){document.getElementById('modalScrim').classList.remove('open')}
function saveProduct(){
  const name=document.getElementById('fName').value.trim();
  const price=parseInt(document.getElementById('fPrice').value.replace(/\D/g,''),10);
  if(!name||!price||price<=0){document.getElementById('formErr').classList.add('show');return;}
  let rating=parseFloat(document.getElementById('fRating').value.replace(',','.'));
  if(isNaN(rating))rating=0;
  rating=Math.min(5,Math.max(0,rating));
  const reviewCount=parseInt(document.getElementById('fReviewCount').value.replace(/\D/g,''),10)||0;
  const data={
    house:document.getElementById('fHouse').value.trim(),
    name,price,
    cat:document.getElementById('fCat').value,
    notes:document.getElementById('fNotes').value.trim(),
    topNotes:document.getElementById('fTopNotes').value.trim(),
    heartNotes:document.getElementById('fHeartNotes').value.trim(),
    baseNotes:document.getElementById('fBaseNotes').value.trim(),
    duration:document.getElementById('fDuration').value.trim(),
    projection:document.getElementById('fProjection').value.trim(),
    badge:document.getElementById('fBadge').value.trim(),
    rating,reviewCount,
    img:tempImg
  };
  const action=editingId?updatePerfume(editingId,data):createPerfume(data);
  action.then(()=>{
    closeModal();
    showToast('Perfume guardado');
  }).catch(()=>{
    showToast('No se pudo guardar el perfume en Firestore');
  });
}

/* ---------- Carga de imagen (con compresión a JPEG) ----------
   La foto se redimensiona en un <canvas> a un máximo de 700px de lado y se
   guarda como dataURL JPEG dentro del propio documento de Firestore (campo
   "imagen"), sin depender de un servidor de archivos ni de Storage. La
   compresión mantiene el dataURL liviano (muy por debajo del límite de 1MB
   por documento de Firestore). */
document.getElementById('fImg').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const max=700;let{width:w,height:h}=img;
      if(w>max||h>max){if(w>h){h=h*max/w;w=max}else{w=w*max/h;h=max}}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      tempImg=c.toDataURL('image/jpeg',0.82);
      setPreview(tempImg);
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(f);
});

/* ---------- Formato automático del precio (100000 → 100.000) ----------
   Mientras se escribe se reformatea con separador de miles (es-PY); al
   guardar, saveProduct() vuelve a extraer solo los dígitos y lo convierte
   a número plano para Firestore. */
document.getElementById('fPrice').addEventListener('input',e=>{
  const digits=e.target.value.replace(/\D/g,'');
  e.target.value=digits?fmt(parseInt(digits,10)):'';
});

/* ==========================================================================
   AJUSTES (WhatsApp y grupo mayorista)
   ========================================================================== */
document.getElementById('saveWa').onclick=()=>{
  const wa=document.getElementById('waNumber').value.replace(/\D/g,'');
  saveSettings({wa})
    .then(()=>showToast('Número guardado'))
    .catch(()=>showToast('No se pudo guardar el número'));
};
document.getElementById('saveGroup').onclick=()=>{
  const group=document.getElementById('waGroup').value.trim();
  saveSettings({group})
    .then(()=>showToast('Grupo guardado'))
    .catch(()=>showToast('No se pudo guardar el grupo'));
};

/* ==========================================================================
   PESTAÑAS (Inventario / Dashboard financiero)
   ========================================================================== */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target=btn.dataset.tab;
    ['inventoryTab','financeTab'].forEach(id=>{
      document.getElementById(id).style.display=(id===target)?'':'none';
    });
    if(target==='financeTab'&&financeChart)requestAnimationFrame(()=>financeChart.resize());
  };
});

/* ==========================================================================
   DASHBOARD FINANCIERO (ventas, gastos y totales)
   --------------------------------------------------------------------------
   Ventas y gastos se cargan a mano desde acá (el carrito de la tienda solo
   arma el mensaje de WhatsApp y no guarda nada en Firestore — el botón
   "Convertir pedido en venta" es solo un atajo que abre el mismo modal de
   "Registrar venta" pre-cargado con la fecha de hoy y el foco en el monto,
   para anotar en segundos un pedido de WhatsApp apenas se confirma el
   pago). La fecha se guarda como texto "AAAA-MM-DD" — el mismo formato que
   entrega <input type="date"> — para poder sumar "hoy" y "este mes"
   comparando strings, sin lidiar con zonas horarias. Todo llega en vivo
   vía watchVentas/watchGastos: cualquier alta, edición o borrado recalcula
   los totales al instante. */
function dateToStr(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function todayStr(){return dateToStr(new Date())}
function monthStr(){return todayStr().slice(0,7)}
function sumMontos(list,pred){return list.filter(pred).reduce((s,x)=>s+(Number(x.monto)||0),0)}

function renderFinanceStats(){
  const today=todayStr(),month=monthStr();
  const ventas=state.ventas||[],gastos=state.gastos||[];
  const todayPred=x=>x.fecha===today;
  const monthPred=x=>x.fecha.slice(0,7)===month;
  const vHoy=sumMontos(ventas,todayPred),vMes=sumMontos(ventas,monthPred),vTotal=sumMontos(ventas,()=>true);
  const gHoy=sumMontos(gastos,todayPred),gMes=sumMontos(gastos,monthPred),gTotal=sumMontos(gastos,()=>true);
  const neta=vTotal-gTotal;
  const cards=[
    ['Ventas del día',vHoy,'pos'],
    ['Ventas del mes',vMes,'pos'],
    ['Ventas totales',vTotal,'pos'],
    ['Gastos del día',gHoy,'neg'],
    ['Gastos del mes',gMes,'neg'],
    ['Gastos totales',gTotal,'neg'],
    ['Ganancia neta',neta,neta>=0?'pos':'neg']
  ];
  document.getElementById('financeStats').innerHTML=cards.map(c=>
    '<div class="stat-card '+c[2]+'">'+
      '<span class="stat-lbl">'+c[0]+'</span>'+
      '<span class="stat-val tabular">₲ '+fmt(c[1])+'</span>'+
    '</div>'
  ).join('');
}

/* ==========================================================================
   FILTRO DE FECHAS DEL DASHBOARD (botones rápidos + Desde/Hasta)
   --------------------------------------------------------------------------
   Un único objeto "financeFilter" ({desde,hasta,quick}) gobierna, a la vez,
   el gráfico Ventas vs Gastos, las tarjetas "Ventas/Gastos/Ganancia neta"
   filtradas y la tarjeta "Producto más vendido": los tres se recalculan
   juntos desde renderFinanceFiltered() cada vez que el filtro cambia o
   cada vez que watchVentas/watchGastos entrega datos nuevos de Firestore
   (así queda sincronizado en tiempo real, incluso desde otro dispositivo).
   "fecha" se guarda como texto "AAAA-MM-DD", por lo que comparar con <= / >=
   como strings alcanza para acotar el rango sin lidiar con zonas horarias.
   ========================================================================== */
function lastNDays(n){
  const out=[],hoy=new Date();
  for(let i=n-1;i>=0;i--)out.push(dateToStr(new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()-i)));
  return out;
}
function rangeWeek(){
  const d=new Date(),dow=(d.getDay()+6)%7; // 0=lunes … 6=domingo
  const lunes=new Date(d.getFullYear(),d.getMonth(),d.getDate()-dow);
  return{desde:dateToStr(lunes),hasta:dateToStr(new Date(lunes.getFullYear(),lunes.getMonth(),lunes.getDate()+6))};
}
function rangeMonth(){
  const d=new Date();
  return{desde:dateToStr(new Date(d.getFullYear(),d.getMonth(),1)),hasta:dateToStr(new Date(d.getFullYear(),d.getMonth()+1,0))};
}
function rangeYear(){
  const y=new Date().getFullYear();
  return{desde:y+'-01-01',hasta:y+'-12-31'};
}
let financeFilter={desde:'',hasta:'',quick:'month'};
function inFinanceRange(fecha){
  if(financeFilter.desde&&fecha<financeFilter.desde)return false;
  if(financeFilter.hasta&&fecha>financeFilter.hasta)return false;
  return true;
}
function formatFechaCorta(f){
  const p=(f||'').split('-');
  return p.length===3?p[2]+'/'+p[1]+'/'+p[0].slice(2):'';
}
const FINANCE_QUICK_LABELS={today:'hoy',week:'esta semana',month:'este mes',year:'este año',all:'histórico completo'};
function financeRangeLabel(){
  if(financeFilter.quick&&FINANCE_QUICK_LABELS[financeFilter.quick])return FINANCE_QUICK_LABELS[financeFilter.quick];
  const{desde,hasta}=financeFilter;
  if(desde&&hasta)return formatFechaCorta(desde)+' – '+formatFechaCorta(hasta);
  if(desde)return 'desde '+formatFechaCorta(desde);
  if(hasta)return 'hasta '+formatFechaCorta(hasta);
  return 'histórico completo';
}
function setFinanceFilter(desde,hasta,quick){
  financeFilter={desde:desde||'',hasta:hasta||'',quick:quick||null};
  document.getElementById('filterDesde').value=financeFilter.desde;
  document.getElementById('filterHasta').value=financeFilter.hasta;
  document.querySelectorAll('.qf-btn').forEach(b=>b.classList.toggle('active',b.dataset.range===financeFilter.quick));
  renderFinanceFiltered();
}
function renderFilteredStats(){
  const ventas=(state.ventas||[]).filter(x=>inFinanceRange(x.fecha));
  const gastos=(state.gastos||[]).filter(x=>inFinanceRange(x.fecha));
  const vTotal=sumMontos(ventas,()=>true),gTotal=sumMontos(gastos,()=>true);
  const neta=vTotal-gTotal;
  const cards=[
    ['Ventas',vTotal,'pos'],
    ['Gastos',gTotal,'neg'],
    ['Ganancia neta',neta,neta>=0?'pos':'neg']
  ];
  document.getElementById('filteredStats').innerHTML=cards.map(c=>
    '<div class="stat-card '+c[2]+'">'+
      '<span class="stat-lbl">'+c[0]+'</span>'+
      '<span class="stat-val tabular">₲ '+fmt(c[1])+'</span>'+
    '</div>'
  ).join('');
}
function renderFinanceFiltered(){
  renderFilteredStats();
  renderFinanceChart();
  renderTopProduct();
}

/* ---------- Gráfico Ventas vs Gastos (Chart.js) ----------
   Una barra dorada (ventas) y una roja suave (gastos) por bloque de tiempo,
   acotadas al rango de "financeFilter". Si el rango cae en 62 días o menos
   se grafica día por día; si es más amplio (p. ej. "Este año" o "Todo" con
   mucho historial) se agrupa por mes para que el gráfico siga siendo
   legible. Cuando no hay límites explícitos (filtro "Todo"), el rango se
   deduce de las fechas mínima/máxima presentes en ventas+gastos. Se
   redibuja solo —sin recrear el gráfico— en cada cambio de filtro o de
   datos, así queda sincronizado con Firestore en tiempo real. */
const MES_ABREV=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function resolveFinanceSpan(){
  let{desde,hasta}=financeFilter;
  if(!desde||!hasta){
    const fechas=[...(state.ventas||[]),...(state.gastos||[])].map(x=>x.fecha).filter(Boolean).sort();
    const dias=lastNDays(30);
    if(!desde)desde=fechas.length?fechas[0]:dias[0];
    if(!hasta)hasta=fechas.length?fechas[fechas.length-1]:dias[dias.length-1];
  }
  if(desde>hasta){const t=desde;desde=hasta;hasta=t;}
  return{desde,hasta};
}
function financeChartSeries(ventas,gastos){
  const{desde,hasta}=resolveFinanceSpan();
  const inicio=new Date(desde+'T00:00:00'),fin=new Date(hasta+'T00:00:00');
  const spanDias=Math.round((fin-inicio)/86400000)+1;
  if(spanDias<=62){
    const dias=[];
    for(let d=new Date(inicio);d<=fin;d.setDate(d.getDate()+1))dias.push(dateToStr(d));
    return{
      labels:dias.map(d=>{const p=d.split('-');return p[2]+'/'+p[1];}),
      datosVentas:dias.map(d=>sumMontos(ventas,x=>x.fecha===d)),
      datosGastos:dias.map(d=>sumMontos(gastos,x=>x.fecha===d))
    };
  }
  const meses=[];
  const cursor=new Date(inicio.getFullYear(),inicio.getMonth(),1);
  const limite=new Date(fin.getFullYear(),fin.getMonth(),1);
  while(cursor<=limite){
    meses.push(cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0'));
    cursor.setMonth(cursor.getMonth()+1);
  }
  return{
    labels:meses.map(m=>{const p=m.split('-');return MES_ABREV[Number(p[1])-1]+' '+p[0].slice(2);}),
    datosVentas:meses.map(m=>sumMontos(ventas,x=>x.fecha.slice(0,7)===m)),
    datosGastos:meses.map(m=>sumMontos(gastos,x=>x.fecha.slice(0,7)===m))
  };
}
let financeChart=null;
function renderFinanceChart(){
  const canvas=document.getElementById('financeChart');
  if(!canvas||typeof Chart==='undefined')return;
  const ventas=(state.ventas||[]).filter(x=>inFinanceRange(x.fecha));
  const gastos=(state.gastos||[]).filter(x=>inFinanceRange(x.fecha));
  const{labels,datosVentas,datosGastos}=financeChartSeries(ventas,gastos);
  const subt=document.getElementById('financeChartSubtitle');
  if(subt)subt.textContent='· '+financeRangeLabel();
  if(financeChart){
    financeChart.data.labels=labels;
    financeChart.data.datasets[0].data=datosVentas;
    financeChart.data.datasets[1].data=datosGastos;
    financeChart.update();
    return;
  }
  financeChart=new Chart(canvas.getContext('2d'),{
    type:'bar',
    data:{labels,datasets:[
      {label:'Ventas',data:datosVentas,backgroundColor:'rgba(228,197,133,.6)',borderColor:'#e4c585',borderWidth:1.5,borderRadius:4,maxBarThickness:16},
      {label:'Gastos',data:datosGastos,backgroundColor:'rgba(211,107,94,.55)',borderColor:'#d36b5e',borderWidth:1.5,borderRadius:4,maxBarThickness:16}
    ]},
    options:{
      responsive:true,maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      scales:{
        x:{ticks:{color:'#80766a',maxRotation:0,autoSkip:true,maxTicksLimit:10},grid:{display:false}},
        y:{beginAtZero:true,ticks:{color:'#80766a',callback:v=>fmt(v)},grid:{color:'rgba(58,47,37,.5)'}}
      },
      plugins:{
        legend:{labels:{color:'#b8ac9a',usePointStyle:true,pointStyle:'rectRounded',boxWidth:10,boxHeight:10,padding:18}},
        tooltip:{backgroundColor:'#1d1815',borderColor:'#3a2f25',borderWidth:1,titleColor:'#f3ece1',bodyColor:'#b8ac9a',padding:10,callbacks:{label:ctx=>' '+ctx.dataset.label+': ₲ '+fmt(ctx.raw)}}
      }
    }
  });
}

/* ---------- Producto más vendido ----------
   Se calcula sumando cantidad/monto de las ventas —dentro del rango de
   "financeFilter"— que tienen un producto asociado (campo opcional
   "producto" + "cantidad" del modal de venta) y mostrando el de mayor
   cantidad vendida. Si ninguna venta del rango tiene producto asociado,
   se muestra un estado vacío explicando cómo cargarlo. */
function renderTopProduct(){
  const el=document.getElementById('topProductCard');
  if(!el)return;
  const acumulado={};
  (state.ventas||[]).filter(v=>inFinanceRange(v.fecha)).forEach(v=>{
    const nombre=(v.producto||'').trim();
    const cantidad=Number(v.cantidad)||0;
    if(!nombre||cantidad<=0)return;
    if(!acumulado[nombre])acumulado[nombre]={cantidad:0,ingresos:0};
    acumulado[nombre].cantidad+=cantidad;
    acumulado[nombre].ingresos+=Number(v.monto)||0;
  });
  const top=Object.keys(acumulado)
    .map(nombre=>({nombre,cantidad:acumulado[nombre].cantidad,ingresos:acumulado[nombre].ingresos}))
    .sort((a,b)=>b.cantidad-a.cantidad||b.ingresos-a.ingresos)[0];
  if(!top){
    el.className='top-product-card empty';
    el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v18h18M7 14l4-4 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
      '<p>No hay ventas con un producto asociado en el rango seleccionado ('+escapeHtml(financeRangeLabel())+').<br>Selecciona un perfume al registrar una venta para ver el más vendido aquí.</p>';
    return;
  }
  el.className='top-product-card';
  const prod=(state.products||[]).find(p=>p.name===top.nombre);
  el.innerHTML=
    '<span class="tp-lbl">Producto más vendido</span>'+
    '<div><div class="tp-name">'+escapeHtml(top.nombre)+'</div>'+
    (prod&&prod.house&&prod.house!==prod.name?'<div class="tp-house">'+escapeHtml(prod.house)+'</div>':'')+
    '</div>'+
    '<div class="tp-stats">'+
      '<div class="tp-stat"><strong class="tabular">'+fmt(top.cantidad)+'</strong><span>Unidades vendidas</span></div>'+
      '<div class="tp-stat"><strong class="tabular">₲ '+fmt(top.ingresos)+'</strong><span>Ingresos generados</span></div>'+
    '</div>';
}

/* ---------- Selector de "producto vendido" del modal de venta ---------- */
function populateVentaProductoSelect(selected){
  const sel=document.getElementById('vProducto');
  const opciones=(state.products||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''))
    .map(p=>'<option value="'+escapeHtml(p.name)+'">'+escapeHtml(p.name)+(p.house&&p.house!==p.name?' · '+escapeHtml(p.house):'')+'</option>');
  sel.innerHTML='<option value="">— Sin producto asociado —</option>'+opciones.join('');
  sel.value=selected||'';
}

/* ---------- Ventas ---------- */
let editingVentaId=null;
function renderVentas(){
  const wrap=document.getElementById('ventasList');
  const list=(state.ventas||[]).slice().sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if(!list.length){
    wrap.innerHTML='<div class="admin-empty"><p>Sin ventas registradas todavía. Usa “Registrar venta” para cargar la primera.</p></div>';
    return;
  }
  let rows='';
  list.forEach(v=>{
    rows+='<tr>'+
      '<td class="tabular">'+escapeHtml(v.fecha||'—')+'</td>'+
      '<td class="tabular">₲ '+fmt(v.monto)+'</td>'+
      '<td>'+escapeHtml(v.nota||'—')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="mini-btn" data-edit-venta="'+v.id+'" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
        '<button class="mini-btn del" data-del-venta="'+v.id+'" aria-label="Eliminar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  });
  wrap.innerHTML='<table class="admin-table"><thead><tr><th>Fecha</th><th>Monto</th><th>Nota</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
  wrap.querySelectorAll('[data-edit-venta]').forEach(b=>b.onclick=()=>openVentaModal(b.dataset.editVenta));
  wrap.querySelectorAll('[data-del-venta]').forEach(b=>b.onclick=()=>{
    if(!confirm('¿Eliminar esta venta?'))return;
    deleteVenta(b.dataset.delVenta)
      .then(()=>showToast('Venta eliminada'))
      .catch(()=>showToast('No se pudo eliminar la venta'));
  });
}
function openVentaModal(id,fromOrder){
  editingVentaId=id||null;
  document.getElementById('ventaErr').classList.remove('show');
  const t=document.getElementById('ventaModalTitle');
  if(id){
    const v=state.ventas.find(x=>x.id===id);
    t.textContent='Editar venta';
    document.getElementById('vMonto').value=v.monto?fmt(v.monto):'';
    document.getElementById('vFecha').value=v.fecha||'';
    document.getElementById('vNota').value=v.nota||'';
    populateVentaProductoSelect(v.producto);
    document.getElementById('vCantidad').value=v.cantidad?v.cantidad:'';
  }else{
    t.textContent=fromOrder?'Convertir pedido en venta':'Registrar venta';
    document.getElementById('vMonto').value='';
    document.getElementById('vFecha').value=todayStr();
    document.getElementById('vNota').value=fromOrder?'Pedido confirmado por WhatsApp':'';
    populateVentaProductoSelect('');
    document.getElementById('vCantidad').value='';
  }
  document.getElementById('ventaScrim').classList.add('open');
  if(fromOrder)setTimeout(()=>document.getElementById('vMonto').focus(),50);
}
function closeVentaModal(){document.getElementById('ventaScrim').classList.remove('open')}
function saveVenta(){
  const monto=parseInt(document.getElementById('vMonto').value.replace(/\D/g,''),10);
  const fecha=document.getElementById('vFecha').value;
  if(!monto||monto<=0||!fecha){document.getElementById('ventaErr').classList.add('show');return;}
  const producto=document.getElementById('vProducto').value;
  const cantidadInput=parseInt(document.getElementById('vCantidad').value,10);
  const data={
    monto,fecha,
    nota:document.getElementById('vNota').value.trim(),
    producto,
    cantidad:producto?(cantidadInput>0?cantidadInput:1):0
  };
  const action=editingVentaId?updateVenta(editingVentaId,data):createVenta(data);
  action.then(()=>{closeVentaModal();showToast('Venta guardada');})
    .catch(()=>showToast('No se pudo guardar la venta en Firestore'));
}

/* ---------- Gastos ---------- */
let editingGastoId=null;
function renderGastos(){
  const wrap=document.getElementById('gastosList');
  const list=(state.gastos||[]).slice().sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if(!list.length){
    wrap.innerHTML='<div class="admin-empty"><p>Sin gastos registrados todavía. Usa “Registrar gasto” para cargar el primero.</p></div>';
    return;
  }
  let rows='';
  list.forEach(g=>{
    rows+='<tr>'+
      '<td class="tabular">'+escapeHtml(g.fecha||'—')+'</td>'+
      '<td><div class="meta"><div class="tname">'+escapeHtml(g.concepto||'—')+'</div><div class="thouse">'+escapeHtml(g.categoria||'—')+'</div></div></td>'+
      '<td class="tabular">₲ '+fmt(g.monto)+'</td>'+
      '<td>'+escapeHtml(g.observaciones||'—')+'</td>'+
      '<td><div class="row-actions">'+
        '<button class="mini-btn" data-edit-gasto="'+g.id+'" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
        '<button class="mini-btn del" data-del-gasto="'+g.id+'" aria-label="Eliminar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
      '</div></td>'+
    '</tr>';
  });
  wrap.innerHTML='<table class="admin-table"><thead><tr><th>Fecha</th><th>Concepto / Categoría</th><th>Monto</th><th>Observaciones</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
  wrap.querySelectorAll('[data-edit-gasto]').forEach(b=>b.onclick=()=>openGastoModal(b.dataset.editGasto));
  wrap.querySelectorAll('[data-del-gasto]').forEach(b=>b.onclick=()=>{
    if(!confirm('¿Eliminar este gasto?'))return;
    deleteGasto(b.dataset.delGasto)
      .then(()=>showToast('Gasto eliminado'))
      .catch(()=>showToast('No se pudo eliminar el gasto'));
  });
}
function openGastoModal(id){
  editingGastoId=id||null;
  document.getElementById('gastoErr').classList.remove('show');
  const t=document.getElementById('gastoModalTitle');
  if(id){
    const g=state.gastos.find(x=>x.id===id);
    t.textContent='Editar gasto';
    document.getElementById('gConcepto').value=g.concepto||'';
    document.getElementById('gCategoria').value=g.categoria||'Otros';
    document.getElementById('gMonto').value=g.monto?fmt(g.monto):'';
    document.getElementById('gFecha').value=g.fecha||'';
    document.getElementById('gObservaciones').value=g.observaciones||'';
  }else{
    t.textContent='Registrar gasto';
    document.getElementById('gConcepto').value='';
    document.getElementById('gCategoria').value='Facebook Ads';
    document.getElementById('gMonto').value='';
    document.getElementById('gFecha').value=todayStr();
    document.getElementById('gObservaciones').value='';
  }
  document.getElementById('gastoScrim').classList.add('open');
}
function closeGastoModal(){document.getElementById('gastoScrim').classList.remove('open')}
function saveGasto(){
  const concepto=document.getElementById('gConcepto').value.trim();
  const monto=parseInt(document.getElementById('gMonto').value.replace(/\D/g,''),10);
  const fecha=document.getElementById('gFecha').value;
  if(!concepto||!monto||monto<=0||!fecha){document.getElementById('gastoErr').classList.add('show');return;}
  const data={
    concepto,
    categoria:document.getElementById('gCategoria').value,
    monto,fecha,
    observaciones:document.getElementById('gObservaciones').value.trim()
  };
  const action=editingGastoId?updateGasto(editingGastoId,data):createGasto(data);
  action.then(()=>{closeGastoModal();showToast('Gasto guardado');})
    .catch(()=>showToast('No se pudo guardar el gasto en Firestore'));
}

/* ---------- Formato automático del monto (ventas y gastos) ---------- */
['vMonto','gMonto'].forEach(id=>{
  document.getElementById(id).addEventListener('input',e=>{
    const digits=e.target.value.replace(/\D/g,'');
    e.target.value=digits?fmt(parseInt(digits,10)):'';
  });
});

/* ==========================================================================
   EVENTOS
   ========================================================================== */
document.getElementById('loginBtn').onclick=login;
document.getElementById('pwInput').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
document.getElementById('loginCancel').onclick=()=>{location.href='index.html'};
document.getElementById('backStore').onclick=()=>{location.href='index.html'};
document.getElementById('newProdBtn').onclick=()=>openModal(null);
document.getElementById('modalClose').onclick=closeModal;
document.getElementById('modalCancel').onclick=closeModal;
document.getElementById('modalSave').onclick=saveProduct;
document.getElementById('modalScrim').onclick=e=>{if(e.target.id==='modalScrim')closeModal()};

document.getElementById('newVentaBtn').onclick=()=>openVentaModal(null);
document.getElementById('convertOrderBtn').onclick=()=>openVentaModal(null,true);
document.getElementById('ventaModalClose').onclick=closeVentaModal;
document.getElementById('ventaModalCancel').onclick=closeVentaModal;
document.getElementById('ventaModalSave').onclick=saveVenta;
document.getElementById('ventaScrim').onclick=e=>{if(e.target.id==='ventaScrim')closeVentaModal()};

/* ---------- Filtros del dashboard financiero ---------- */
const FINANCE_QUICK_RANGES={
  today:()=>{const t=todayStr();return{desde:t,hasta:t};},
  week:rangeWeek,
  month:rangeMonth,
  year:rangeYear,
  all:()=>({desde:'',hasta:''})
};
document.querySelectorAll('.qf-btn').forEach(btn=>{
  btn.onclick=()=>{
    const r=FINANCE_QUICK_RANGES[btn.dataset.range]();
    setFinanceFilter(r.desde,r.hasta,btn.dataset.range);
  };
});
['filterDesde','filterHasta'].forEach(id=>{
  document.getElementById(id).addEventListener('change',()=>{
    document.querySelectorAll('.qf-btn').forEach(b=>b.classList.remove('active'));
    financeFilter={
      desde:document.getElementById('filterDesde').value,
      hasta:document.getElementById('filterHasta').value,
      quick:null
    };
    renderFinanceFiltered();
  });
});

document.getElementById('newGastoBtn').onclick=()=>openGastoModal(null);
document.getElementById('gastoModalClose').onclick=closeGastoModal;
document.getElementById('gastoModalCancel').onclick=closeGastoModal;
document.getElementById('gastoModalSave').onclick=saveGasto;
document.getElementById('gastoScrim').onclick=e=>{if(e.target.id==='gastoScrim')closeGastoModal()};

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();closeVentaModal();closeGastoModal();}
});

/* ==========================================================================
   INICIO
   --------------------------------------------------------------------------
   El inventario y los ajustes llegan en vivo desde Firestore: apenas se
   conecta (y cada vez que cambian, incluso desde otro dispositivo) se
   refresca la tabla y, si el panel ya está abierto, también el formulario
   de ajustes. */
function syncSettingsToForm(){
  document.getElementById('waNumber').value=state.wa||'';
  document.getElementById('waGroup').value=state.group||'';
}
{const m=rangeMonth();setFinanceFilter(m.desde,m.hasta,'month');}
watchPerfumes(list=>{state.products=list;renderAdmin();renderTopProduct();});
watchVentas(list=>{state.ventas=list;renderFinanceStats();renderVentas();renderFinanceFiltered();});
watchGastos(list=>{state.gastos=list;renderFinanceStats();renderGastos();renderFinanceFiltered();});
watchSettings(s=>{
  if(!s)return;
  if(s.wa)state.wa=s.wa;
  if(typeof s.group!=='undefined')state.group=s.group;
  if(document.getElementById('dashView').style.display!=='none')syncSettingsToForm();
});

document.getElementById('pwInput').value='';
document.getElementById('pwErr').classList.remove('show');
setTimeout(()=>document.getElementById('pwInput').focus(),100);
