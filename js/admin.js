/* ==========================================================================
   ZURIK · Panel de Administración — lógica (admin.html)
   --------------------------------------------------------------------------
   Controla el acceso por contraseña, el listado/edición/borrado de
   perfumes (CRUD), la carga y compresión de fotos, y los ajustes de
   contacto (número de WhatsApp y enlace del grupo mayorista).
   Depende de:
     · js/catalogo.js → PERFUME_SVG, state, fmt, escapeHtml, showToast.
     · js/firebase.js → watchPerfumes/createPerfume/updatePerfume/
       deletePerfume/watchSettings/saveSettings: todo el CRUD se hace
       contra Firestore (colección "perfumes" + ajustes), y la tabla se
       redibuja sola apenas hay cambios — no se guarda nada localmente.
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
    tempImg=p.img||'';
    setPreview(tempImg);
  }else{
    t.textContent='Nuevo perfume';
    ['fHouse','fName','fPrice','fNotes','fTopNotes','fHeartNotes','fBaseNotes','fDuration','fProjection','fBadge'].forEach(i=>document.getElementById(i).value='');
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
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

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
watchPerfumes(list=>{state.products=list;renderAdmin();});
watchSettings(s=>{
  if(!s)return;
  if(s.wa)state.wa=s.wa;
  if(typeof s.group!=='undefined')state.group=s.group;
  if(document.getElementById('dashView').style.display!=='none')syncSettingsToForm();
});

document.getElementById('pwInput').value='';
document.getElementById('pwErr').classList.remove('show');
setTimeout(()=>document.getElementById('pwInput').focus(),100);
