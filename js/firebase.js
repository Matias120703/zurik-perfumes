/* ==========================================================================
   ZURIK · Conexión a Firebase Firestore — punto central de datos
   --------------------------------------------------------------------------
   Este archivo es el ÚNICO lugar que habla con Firestore. catalogo.js,
   app.js y admin.js no usan el SDK directamente: solo llaman a las
   funciones que se exponen aquí.

   Funciones expuestas:
     · watchPerfumes(cb)      Suscribe en tiempo real a la colección
                              "perfumes". cb(listaDeProductos) se llama al
                              conectar y de nuevo cada vez que algo cambia
                              (alta, edición o borrado, incluso desde otro
                              dispositivo/pestaña).
     · createPerfume(datos)   Crea un perfume nuevo.
     · updatePerfume(id,datos) Actualiza un perfume existente.
     · deletePerfume(id)      Elimina un perfume.
     · watchSettings(cb)      Suscribe en tiempo real al documento de
                              ajustes (número de WhatsApp y enlace del
                              grupo mayorista).
     · saveSettings(datos)    Guarda/combina ajustes.
     · watchVentas(cb)        Suscribe en tiempo real a la colección
                              "ventas" (dashboard financiero del admin).
     · createVenta/updateVenta/deleteVenta   CRUD de ventas.
     · watchGastos(cb)        Suscribe en tiempo real a la colección
                              "gastos" (dashboard financiero del admin).
     · createGasto/updateGasto/deleteGasto   CRUD de gastos.

   Estructura en Firestore:
     · Colección "perfumes" — un documento por perfume con los campos
       nombre, marca, precio, categoria, imagen, descripcion, etiqueta
       (insignia opcional tipo "Nuevo" / "Más vendido"), los campos de la
       página de detalle: notasSalida, notasCorazon, notasFondo, duracion
       y proyeccion, y las calificaciones: calificacion (promedio 0-5) y
       numeroResenas (cantidad de reseñas).
     · Colección "ajustes" → documento "general" con los campos
       wa (número de WhatsApp) y group (enlace del grupo mayorista).
     · Colección "ventas" — un documento por venta registrada manualmente
       desde el dashboard financiero, con los campos monto, fecha
       (texto "AAAA-MM-DD"), nota (opcional), y producto/cantidad
       (opcionales: nombre del perfume vendido y unidades, usados para
       calcular el gráfico de los últimos 30 días y la tarjeta
       "Producto más vendido").
     · Colección "gastos" — un documento por gasto registrado desde el
       dashboard financiero, con los campos concepto, categoria, monto,
       fecha (texto "AAAA-MM-DD") y observaciones.

   Requisitos (ya resueltos en index.html / admin.html):
     1. Cargar el SDK "compat" de Firebase ANTES de este archivo:
          <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
          <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
     2. Tener Firestore habilitado en el proyecto y FIREBASE_CONFIG completo
        (se obtiene en Configuración del proyecto → General → tus apps).
   ========================================================================== */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQwf3sz98SQxg0qUIvL1RBUCMrQajP_9c",
  authDomain: "zurik-perfumeria.firebaseapp.com",
  projectId: "zurik-perfumeria",
  storageBucket: "zurik-perfumeria.firebasestorage.app",
  messagingSenderId: "462641964308",
  appId: "1:462641964308:web:94f21d6f2516e0affb4e01"
};

const PERFUMES_COLLECTION='perfumes';
const SETTINGS_COLLECTION='ajustes';
const SETTINGS_DOC='general';
const SALES_COLLECTION='ventas';
const EXPENSES_COLLECTION='gastos';

let firebaseApp=null;
let firestoreDb=null;

/* Inicializa Firebase y Firestore. Si el SDK no fue cargado o falta
   configurar el proyecto, avisa por consola y devuelve null: el resto del
   sitio puede seguir mostrando la interfaz sin romperse. */
function initFirebase(){
  if(typeof firebase==='undefined'){
    console.warn('[ZURIK] SDK de Firebase no encontrado. Verifica que los <script> del SDK estén antes de js/firebase.js.');
    return null;
  }
  if(!FIREBASE_CONFIG.projectId){
    console.warn('[ZURIK] Falta completar FIREBASE_CONFIG en js/firebase.js.');
    return null;
  }
  if(!firebaseApp){
    firebaseApp=firebase.initializeApp(FIREBASE_CONFIG);
    firestoreDb=firebase.firestore();
  }
  return firestoreDb;
}
function getFirestoreDb(){
  return firestoreDb||initFirebase();
}
function noop(){}

/* ==========================================================================
   Mapeo de campos
   --------------------------------------------------------------------------
   En Firestore los perfumes se guardan con nombres en español (nombre,
   marca, precio, categoria, imagen, descripcion, etiqueta). La tienda y el
   panel admin trabajan internamente con (name, house, price, cat, notes,
   img, badge); estas dos funciones traducen entre ambos mundos para que el
   resto del código no necesite cambiar.
   ========================================================================== */
function perfumeFromDoc(doc){
  const d=doc.data()||{};
  return {
    id:doc.id,
    house:d.marca||'',
    name:d.nombre||'',
    price:Number(d.precio)||0,
    cat:d.categoria||'',
    notes:d.descripcion||'',
    img:d.imagen||'',
    badge:d.etiqueta||'',
    topNotes:d.notasSalida||'',
    heartNotes:d.notasCorazon||'',
    baseNotes:d.notasFondo||'',
    duration:d.duracion||'',
    projection:d.proyeccion||'',
    rating:Number(d.calificacion)||0,
    reviewCount:Number(d.numeroResenas)||0
  };
}
function perfumeToDoc(p){
  return {
    nombre:p.name||'',
    marca:p.house||'',
    precio:Number(p.price)||0,
    categoria:p.cat||'',
    descripcion:p.notes||'',
    imagen:p.img||'',
    etiqueta:p.badge||'',
    notasSalida:p.topNotes||'',
    notasCorazon:p.heartNotes||'',
    notasFondo:p.baseNotes||'',
    duracion:p.duration||'',
    proyeccion:p.projection||'',
    calificacion:Number(p.rating)||0,
    numeroResenas:Number(p.reviewCount)||0
  };
}

/* ==========================================================================
   Catálogo — colección "perfumes"
   ========================================================================== */
function watchPerfumes(onChange){
  const db=getFirestoreDb();
  if(!db){onChange([]);return noop;}
  return db.collection(PERFUMES_COLLECTION).onSnapshot(
    snap=>onChange(snap.docs.map(perfumeFromDoc)),
    err=>console.error('[ZURIK] No se pudo sincronizar el catálogo con Firestore:',err)
  );
}
function createPerfume(data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(PERFUMES_COLLECTION).add(perfumeToDoc(data));
}
function updatePerfume(id,data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(PERFUMES_COLLECTION).doc(id).set(perfumeToDoc(data));
}
function deletePerfume(id){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(PERFUMES_COLLECTION).doc(id).delete();
}

/* ==========================================================================
   Ajustes — colección "ajustes", documento "general"
   (número de WhatsApp y enlace del grupo mayorista)
   ========================================================================== */
function watchSettings(onChange){
  const db=getFirestoreDb();
  if(!db){onChange(null);return noop;}
  return db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC).onSnapshot(
    doc=>onChange(doc.exists?doc.data():null),
    err=>console.error('[ZURIK] No se pudo sincronizar los ajustes con Firestore:',err)
  );
}
function saveSettings(data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC).set(data,{merge:true});
}

/* ==========================================================================
   Dashboard financiero — colecciones "ventas" y "gastos"
   --------------------------------------------------------------------------
   Ambas se cargan a mano desde el panel admin (sin relación con el carrito
   de la tienda, que solo arma el mensaje de WhatsApp y no persiste nada).
   La fecha se guarda como texto "AAAA-MM-DD" para poder calcular los
   totales del día/mes con una simple comparación de strings.
   ========================================================================== */
function ventaFromDoc(doc){
  const d=doc.data()||{};
  return {id:doc.id,monto:Number(d.monto)||0,fecha:d.fecha||'',nota:d.nota||'',producto:d.producto||'',cantidad:Number(d.cantidad)||0};
}
function ventaToDoc(v){
  return {monto:Number(v.monto)||0,fecha:v.fecha||'',nota:v.nota||'',producto:v.producto||'',cantidad:Number(v.cantidad)||0};
}
function watchVentas(onChange){
  const db=getFirestoreDb();
  if(!db){onChange([]);return noop;}
  return db.collection(SALES_COLLECTION).onSnapshot(
    snap=>onChange(snap.docs.map(ventaFromDoc)),
    err=>console.error('[ZURIK] No se pudo sincronizar las ventas con Firestore:',err)
  );
}
function createVenta(data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(SALES_COLLECTION).add(ventaToDoc(data));
}
function updateVenta(id,data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(SALES_COLLECTION).doc(id).set(ventaToDoc(data));
}
function deleteVenta(id){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(SALES_COLLECTION).doc(id).delete();
}

function gastoFromDoc(doc){
  const d=doc.data()||{};
  return {id:doc.id,concepto:d.concepto||'',categoria:d.categoria||'',monto:Number(d.monto)||0,fecha:d.fecha||'',observaciones:d.observaciones||''};
}
function gastoToDoc(g){
  return {concepto:g.concepto||'',categoria:g.categoria||'',monto:Number(g.monto)||0,fecha:g.fecha||'',observaciones:g.observaciones||''};
}
function watchGastos(onChange){
  const db=getFirestoreDb();
  if(!db){onChange([]);return noop;}
  return db.collection(EXPENSES_COLLECTION).onSnapshot(
    snap=>onChange(snap.docs.map(gastoFromDoc)),
    err=>console.error('[ZURIK] No se pudo sincronizar los gastos con Firestore:',err)
  );
}
function createGasto(data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(EXPENSES_COLLECTION).add(gastoToDoc(data));
}
function updateGasto(id,data){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(EXPENSES_COLLECTION).doc(id).set(gastoToDoc(data));
}
function deleteGasto(id){
  const db=getFirestoreDb();
  if(!db)return Promise.reject(new Error('Firestore no disponible'));
  return db.collection(EXPENSES_COLLECTION).doc(id).delete();
}
