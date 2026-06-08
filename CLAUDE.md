# Proyecto Zurik Perfumería

## Estado actual

* Web desplegada en Vercel.
* Firebase Firestore conectado.
* Admin conectado a Firestore.
* Los perfumes se guardan en la colección "perfumes".
* Los ajustes se guardan en la colección "ajustes".
* El catálogo se actualiza en tiempo real.
* El diseño premium negro y dorado NO debe modificarse.

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

## Próxima prioridad

1. Comentarios.

## Fase 2 - Administración

9. Costos.
10. Ganancias.
11. Inventario.
12. Estadísticas. 