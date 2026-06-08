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
│   └── firebase.js         # Conexión a Firebase Firestore: punto central de lectura/escritura
│
├── assets/
│   ├── logos/              # Logo de Zurik (splash y marca del header)
│   ├── perfumes/           # Fotos de perfumes que se quieran versionar en el proyecto
│   └── icons/              # Íconos/imágenes auxiliares (los íconos actuales son SVG inline)
│
└── README.md
```

## Cómo funciona

- **Catálogo y ajustes en Firestore**: los perfumes (colección `perfumes`) y
  los ajustes de contacto (colección `ajustes`, documento `general`: número
  de WhatsApp y enlace del grupo mayorista) viven en Firebase Firestore y se
  sincronizan en tiempo real (`js/firebase.js`). Tanto la tienda como el
  panel admin se actualizan solos apenas hay un cambio, desde cualquier
  dispositivo.
- **Carrito**: es lo único que se guarda en `localStorage` (clave
  `zurikCart`), porque cada visitante arma su propia selección antes de
  coordinar el pedido por WhatsApp.
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

## Conexión a Firebase Firestore

`js/firebase.js` es el punto central de conexión a la base de datos: ahí
vive `FIREBASE_CONFIG`, la inicialización del SDK y todas las funciones que
leen/escriben en Firestore (`watchPerfumes`, `createPerfume`,
`updatePerfume`, `deletePerfume`, `watchSettings`, `saveSettings`). Ningún
otro archivo usa el SDK directamente.

Estructura en Firestore:

- **Colección `perfumes`** — un documento por perfume, con los campos
  `nombre`, `marca`, `precio`, `categoria`, `imagen` (dataURL JPEG
  comprimido) y `descripcion` (más `etiqueta`, opcional, para insignias
  como "Nuevo" o "Más vendido").
- **Colección `ajustes`** → documento `general`, con los campos `wa`
  (número de WhatsApp) y `group` (enlace del grupo mayorista).

Si se necesita migrar a otro proyecto de Firebase, basta con:

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
   y habilitar Firestore (en modo producción, con reglas que permitan lectura
   pública y escritura solo desde el panel admin).
2. Reemplazar las credenciales en `FIREBASE_CONFIG` (`js/firebase.js`) por
   las del nuevo proyecto (Configuración del proyecto → General → tus apps).

El SDK "compat" de Firebase (`firebase-app-compat.js` y
`firebase-firestore-compat.js`) ya está cargado en el `<head>`/scripts de
`index.html` y `admin.html`, antes de `js/firebase.js`.
