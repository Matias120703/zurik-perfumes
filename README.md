# ZURIK · Perfumería de Autor

Sitio web de la perfumería ZURIK: catálogo de fragancias con carrito de
compras y pedido por WhatsApp, más un panel de administración para gestionar
el inventario. Es un sitio estático (HTML, CSS y JavaScript "vanilla", sin
build ni dependencias) listo para desplegar en Vercel.

## Estructura del proyecto

```
/
├── index.html              # Tienda (catálogo, carrito, checkout)
├── admin.html              # Panel de administración (independiente, protegido por contraseña)
│
├── css/
│   ├── style.css           # Variables, base y estilos de la tienda + componentes compartidos
│   └── admin.css           # Estilos exclusivos del panel de administración
│
├── js/
│   ├── app.js              # Lógica de la tienda: catálogo, carrito, checkout, splash
│   ├── catalogo.js         # Datos y utilidades compartidas (productos, estado, formato, toast)
│   ├── admin.js            # Lógica del panel: login, alta/edición/borrado de perfumes, ajustes
│   └── firebase.js         # Conexión a Firebase Firestore (preparada, lista para activarse)
│
├── assets/
│   ├── logos/              # Logo de Zurik (splash y marca del header)
│   ├── perfumes/           # Fotos de perfumes que se quieran versionar en el proyecto
│   └── icons/              # Íconos/imágenes auxiliares (los íconos actuales son SVG inline)
│
└── README.md
```

## Cómo funciona

- **Catálogo y carrito**: los perfumes, el carrito, el número de WhatsApp y el
  enlace del grupo mayorista se guardan en `localStorage` (clave `zurikStore`),
  por lo que cada navegador conserva su propia copia. La carga inicial usa los
  perfumes de ejemplo definidos en `SEED` (`js/catalogo.js`).
- **Pedido por WhatsApp**: al finalizar la compra se arma un mensaje con el
  detalle del pedido y los datos de envío, y se abre `wa.me` con ese mensaje
  precargado hacia el número configurado en el panel admin.
- **Acceso al panel**: existen dos caminos —
  1. Ir directo a `admin.html`.
  2. Escribir `#admin` al final de la URL de la tienda (`index.html#admin`);
     es un atajo histórico que ahora simplemente redirige a `admin.html`.
  La contraseña por defecto es `zurik2024` y se cambia en
  `js/admin.js` (constante `ADMIN_PASSWORD`) **antes de publicar el sitio**.

## Ejecutar en local

Al ser un sitio 100% estático, alcanza con abrirlo con un servidor local
(no funciona perfectamente con `file://` porque algunos navegadores
restringen `localStorage`/módulos en ese esquema). Por ejemplo:

```bash
npx serve .
# o
python -m http.server 5173
```

y luego visitar `http://localhost:<puerto>`.

## Despliegue en Vercel

El proyecto no requiere build: Vercel lo sirve como sitio estático y
`index.html`/`admin.html` quedan disponibles en la raíz (`/` y `/admin.html`).
No hace falta ningún `vercel.json` adicional.

## Preparado para Firebase Firestore

Hoy los datos viven en `localStorage`. `js/firebase.js` deja lista la
conexión a Firebase Firestore para el día que se quiera centralizar el
catálogo en la nube (y así compartirlo entre dispositivos/usuarios). Pasos
para activarlo están documentados como comentario al inicio de ese archivo:

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
   y habilitar Firestore.
2. Completar el objeto `FIREBASE_CONFIG` en `js/firebase.js` con las
   credenciales del proyecto.
3. Agregar el SDK de Firebase (`firebase-app-compat.js` y
   `firebase-firestore-compat.js`) en el `<head>` de `index.html` y
   `admin.html`, antes de `js/firebase.js`.
4. Llamar a `initFirebase()` y reemplazar gradualmente `load()`/`save()`
   de `js/catalogo.js` por lecturas/escrituras a Firestore mediante
   `getFirestoreDb()`.

Mientras `FIREBASE_CONFIG` esté vacío, `firebase.js` no hace nada y el
sitio sigue funcionando exactamente igual que ahora, con `localStorage`.
