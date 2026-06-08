/* ==========================================================================
   ZURIK · Conexión a Firebase (preparado para activarse)
   --------------------------------------------------------------------------
   Hoy el catálogo, el carrito y los ajustes se guardan en localStorage
   (ver js/catalogo.js → load()/save()), por lo que cada navegador tiene su
   propia copia de los datos. Este archivo deja lista la conexión a Firebase
   Firestore para el día que se quiera pasar a una base de datos en la nube
   y así compartir el inventario entre la tienda y el panel de admin desde
   cualquier dispositivo.

   CÓMO ACTIVARLO:
   1. Crear un proyecto en https://console.firebase.google.com y habilitar
      "Firestore Database".
   2. En "Configuración del proyecto → General" copiar el objeto de
      configuración del SDK web y pegarlo en FIREBASE_CONFIG (más abajo).
   3. Agregar el SDK de Firebase (versión "compat", para no requerir módulos
      ES) en el <head> de index.html y admin.html, ANTES de este archivo:
        <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
   4. Llamar a initFirebase() — por ejemplo, al inicio de catalogo.js — y usar
      getFirestoreDb() donde antes se usaba localStorage.
   ========================================================================== */

// 🔧 Reemplaza estos valores por las credenciales de tu proyecto de Firebase.
const FIREBASE_CONFIG={
  apiKey:'',
  authDomain:'',
  projectId:'',
  storageBucket:'',
  messagingSenderId:'',
  appId:''
};

let firebaseApp=null;
let firestoreDb=null;

/* Inicializa Firebase y Firestore. Si el SDK todavía no fue agregado al HTML
   (paso 3 de arriba), avisa por consola en lugar de romper la página, para
   que el resto del sitio siga funcionando con localStorage mientras tanto. */
function initFirebase(){
  if(typeof firebase==='undefined'){
    console.warn('[ZURIK] SDK de Firebase no encontrado. Agrega los <script> del SDK antes de js/firebase.js para activar Firestore.');
    return null;
  }
  if(!FIREBASE_CONFIG.projectId){
    console.warn('[ZURIK] Falta completar FIREBASE_CONFIG en js/firebase.js antes de inicializar Firebase.');
    return null;
  }
  if(!firebaseApp){
    firebaseApp=firebase.initializeApp(FIREBASE_CONFIG);
    firestoreDb=firebase.firestore();
  }
  return firestoreDb;
}

/* Devuelve la instancia de Firestore, inicializándola si hace falta.
   Mientras FIREBASE_CONFIG esté vacío, devuelve null y el resto del código
   debe seguir usando el almacenamiento local (comportamiento actual). */
function getFirestoreDb(){
  return firestoreDb||initFirebase();
}

// initFirebase(); // ← Descomenta esta línea cuando hayas completado FIREBASE_CONFIG y agregado el SDK.
