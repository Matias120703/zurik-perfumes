/**
 * Sprint 6.3.1: un `update()`/`delete()` de PostgREST bloqueado por RLS no
 * devuelve ningún `error` -- la cláusula `USING` de la policy simplemente
 * filtra qué filas son visibles para actualizar/borrar, y la operación
 * "tiene éxito" con 0 filas afectadas (a diferencia de un `insert()`
 * bloqueado por `WITH CHECK`, que sí devuelve un 42501 explícito). Sin
 * verificar cuántas filas afectó, el panel reportaba una edición o un
 * borrado como exitosos aunque RLS los hubiera bloqueado por completo --
 * la causa exacta de que "editar/actualizar/eliminar no funcione" sin
 * ningún error visible en pantalla ni en consola.
 *
 * Cada `services/*.ts` que llama a `.update()`/`.delete()` debe encadenar
 * `.select("id")` (para poder contar filas) y pasar el resultado por acá
 * antes de resolver -- mismo criterio en todos los módulos del panel, en
 * vez de repetir este chequeo a mano en cada función.
 */
export function assertRowAffected<T>(data: T[] | null, message: string): void {
  if (!data || data.length === 0) {
    throw new Error(message);
  }
}
