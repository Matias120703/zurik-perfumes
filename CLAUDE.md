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
* Calificaciones.
* Comentarios.
* Dashboard financiero.
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

## Próxima prioridad

1. Calificaciones.
2. Comentarios.

## Fase 2 - Administración

9. Dashboard financiero.
10. Costos.
11. Ganancias.
12. Inventario.
13. Estadísticas.