# Proyecto Zurik Perfumería

## Estado actual

* Web desplegada en Vercel.
* Firebase Firestore conectado.
* Admin conectado a Firestore.
* Los perfumes se guardan en la colección "perfumes".
* Los ajustes se guardan en la colección "ajustes".
* El catálogo se actualiza en tiempo real.
* Identidad visual vigente: clara, minimalista y luminosa (fondo crema
  #F8F5EF / blanco #FFFFFF, acento dorado suave #E8D8B0, texto #1A1A1A,
  bordes #EAEAEA) — reemplaza al diseño oscuro negro/dorado anterior. El
  panel admin comparte esta misma paleta (vía variables CSS de
  css/style.css), aunque su lógica no se tocó.
* El catálogo de perfumes va a subirse en adelante con fotos en PNG con
  fondo transparente; el diseño (header, hero, tarjetas, modal de detalle,
  categorías) está preparado para que esas imágenes "respiren" sobre fondo
  blanco/crema sin cajas oscuras detrás.

## Objetivo principal

Construir una plantilla premium para perfumerías que luego será reutilizada para clientes de Somapp.

## Reglas importantes

* Mantener la estética actual.
* No romper compatibilidad con Firebase.
* No eliminar funcionalidades existentes.
* Toda nueva funcionalidad debe ser editable desde admin cuando tenga sentido.

## Próximas tareas

1. Eliminar aviso de precio mayorista dentro del carrito.
2. Mantener únicamente la sección mayorista de la página principal.
3. Reducir categorías a:

   * Masculino
   * Femenino
4. Agregar buscador de perfumes.
5. Agregar filtro por categoría.
6. Agregar filtro por precio mínimo y máximo.
7. Mantener filtros en tiempo real.

## Futuras mejoras

* Página individual para cada perfume.
* Notas de salida.
* Notas de corazón.
* Notas de fondo.
* Duración.
* Proyección.
* Comentarios.
* Costos.
* Ganancias.
* Inventario.
* Estadísticas.

11. Formatear automáticamente precios en Admin:
    - Mostrar 100.000 mientras se escribe.
    - Guardar en Firestore como número.

12. Reemplazar el campo de Google Maps por geolocalización automática:
    - Botón "Compartir mi ubicación".
    - Obtener latitud y longitud.
    - Enviar ubicación exacta en el mensaje de WhatsApp.
    - Mantener campo dirección como respaldo.

    ## Completado

- Firebase conectado.
- Firestore funcionando.
- Admin conectado.
- Búsqueda.
- Filtros.
- Categorías Masculino/Femenino.
- Formato automático de precios.
- Compartir ubicación automática.
- Carrito conectado a WhatsApp.
- Página individual de perfume (modal de detalle desde el catálogo).
- Notas de salida, corazón y fondo (editables en admin, visibles en la ficha).
- Duración y proyección (editables en admin, visibles en la ficha).
- Calificaciones: promedio y cantidad de reseñas editables en admin
  (campos "Calificación promedio" y "Cantidad de reseñas"), guardadas en
  Firestore (calificacion, numeroResenas) y mostradas con estrellas doradas
  en formato "⭐⭐⭐⭐⭐ 4.8 (23 reseñas)" debajo del nombre del perfume, tanto
  en las tarjetas del catálogo como en la ficha de detalle. Solo se muestran
  cuando hay al menos una reseña cargada. Sincronizadas en tiempo real con
  Firestore.
- Dashboard financiero (pestaña propia dentro del panel admin, junto a
  "Inventario"):
  - Resumen con 7 tarjetas en tiempo real: ventas del día/mes/totales,
    gastos del día/mes/totales y ganancia neta (ventas totales − gastos
    totales).
  - Módulo "Ventas": registro manual (monto, fecha, nota opcional) con
    alta/edición/borrado. Las ventas se cargan a mano porque el carrito de
    la tienda solo arma el mensaje de WhatsApp y no guarda pedidos en
    Firestore — así los totales reflejan ventas confirmadas, no consultas
    que no se concretaron. Botón "Convertir pedido en venta": atajo que
    abre el mismo formulario de venta pre-cargado (fecha de hoy, foco en
    el monto, nota "Pedido confirmado por WhatsApp") para anotar en
    segundos un pedido de WhatsApp apenas se confirma el pago — no crea
    nada automáticamente, solo agiliza la carga manual.
  - Módulo "Gastos": registro manual (concepto, categoría —Facebook Ads,
    Google Ads, Packaging, Combustible, Imprevistos, Otros—, monto, fecha,
    observaciones) con alta/edición/borrado.
  - Guardado en Firestore (colecciones "ventas" y "gastos"; fecha en texto
    "AAAA-MM-DD"), sincronizado en tiempo real (watchVentas/watchGastos):
    los totales se recalculan solos ante cualquier alta, edición o borrado,
    incluso desde otro dispositivo.
- Rediseño de la tienda — Fase 1 (estructural, sobre el HTML/CSS/JS plano
  actual, sin frameworks; no se tocó Firebase ni el panel admin):
  - Header con menú principal (Inicio, Tienda, Perfumes Masculinos/
    Femeninos, Contacto) y menú móvil tipo drawer con botón hamburguesa.
  - Hero con botones "Ver catálogo" y "Comprar ahora".
  - Franja de beneficios ampliada a 4 ítems (perfumes originales, envío a
    todo el país, atención personalizada, compra segura).
  - Sección de categorías con tarjetas grandes (Masculino/Femenino) que
    llevan a la tienda con el filtro ya aplicado.
  - Nuevo filtro de Marca (poblado dinámicamente desde los perfumes
    cargados) y nuevo "Ordenar por" (novedades, precio asc/desc, mejor
    valorados) en la tienda.
  - Ficha de detalle del perfume: sección "También te puede interesar"
    (productos relacionados por marca/categoría) y botón "Preguntar por
    WhatsApp" con mensaje prellenado, junto al de "Añadir al carrito".
  - Botón flotante de WhatsApp (sitewide) con mensaje genérico.
  - Footer ampliado (columnas de categorías y contacto).
  - Animaciones de aparición al hacer scroll (fade-in/slide-up) con
    IntersectionObserver, sin Framer Motion (no aplica sin un framework).
  - Meta description y Open Graph básicos para SEO.
- Rediseño visual claro/minimalista (reemplaza la identidad negro/dorado
  anterior; sin cambios a Firestore, admin, carrito ni WhatsApp):
  - Paleta nueva en variables CSS (`css/style.css`): fondo crema/blanco,
    texto oscuro, acentos dorados suaves derivados de #E8D8B0. El panel
    admin (`css/admin.css`) se reskinea solo por compartir esas variables.
  - Splash de bienvenida rehecho en claro (logo dorado transparente
    `logo-mark.png` sobre fondo crema; ya no usa el JPG con fondo negro).
  - Hero en grid 50/50: texto a la izquierda, imagen grande de un perfume
    real a la derecha con sombra suave debajo (se toma del primer perfume
    con foto del catálogo cargado).
  - Tarjetas de categoría con imagen real del primer perfume de esa
    categoría (mismo mecanismo que el hero).
  - Tarjetas de producto y modal de detalle: fondo blanco, sin cajas
    oscuras detrás de la imagen, `object-fit:contain` para que las fotos
    (y a futuro los PNG transparentes) no se recorten y "respiren".
  - Nueva sección "Más vendidos" (entre Categorías y Tienda): fila con
    scroll horizontal (sin librería) de los 8 perfumes mejor valorados del
    catálogo real (no hay contador de ventas por producto en Firestore, se
    usa el rating como proxy).

## Próxima prioridad

1. Comentarios.

## Fase 2 - Rediseño tienda (pendiente)

Requiere contenido/imágenes reales y, en varios casos, nuevas colecciones
de Firestore + pantallas de admin (no se construyó en la Fase 1):

* Sección de marcas destacadas.
* Sección exclusiva de perfumes árabes (implica sumar esa categoría real
  al catálogo, hoy limitado a Masculino/Femenino).
* Ofertas con precio anterior tachado y countdown.
* Testimonios de clientes (slider).
* Blog.
* Galería de múltiples imágenes por perfume y "temporada ideal" en la
  ficha de producto.
* Íconos de redes sociales reales en el footer (falta configurar URLs).

## Fase 2 - Administración

9. Costos.
10. Ganancias.
11. Inventario.
12. Estadísticas. 