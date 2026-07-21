import { createClient } from "@/lib/supabase/client";
import { assertRowAffected } from "@/lib/supabase/assert-write";

/**
 * Toda la comunicación admin con `stock_movements` (y las dos columnas
 * nuevas de `products`, `sku`/`low_stock_threshold`) vive acá -- mismo
 * criterio que `services/products.ts`/`services/orders.ts`. A diferencia
 * de esos dos, la escritura de stock nunca es un `update` directo desde
 * acá: siempre pasa por la función de Postgres `register_stock_movement`
 * (Sprint 6.0), que es quien garantiza -- en una única transacción -- que
 * el stock y su historial se actualicen juntos y que nunca quede
 * negativo. Este archivo lee `products` directamente para armar el
 * listado de inventario (mismo criterio que `services/customers.ts`
 * leyendo `orders` sin pasar por `services/orders.ts`, Fase 16) pero
 * nunca escribe `products.stock` -- eso es exclusivo de la función RPC.
 */

export type MovementType = "manual_in" | "manual_adjustment" | "order_confirmed" | "order_cancelled";

export const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: "manual_in", label: "Entrada manual" },
  { value: "manual_adjustment", label: "Ajuste manual" },
  { value: "order_confirmed", label: "Pedido confirmado" },
  { value: "order_cancelled", label: "Pedido cancelado" },
];

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = Object.fromEntries(
  MOVEMENT_TYPES.map((option) => [option.value, option.label])
) as Record<MovementType, string>;

export function getMovementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABEL[type];
}

export type InventoryStatus = "out_of_stock" | "low_stock" | "normal";

export function getInventoryStatus(stock: number, lowStockThreshold: number): InventoryStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowStockThreshold) return "low_stock";
  return "normal";
}

export type AdminInventoryItem = {
  productId: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  stock: number;
  lowStockThreshold: number;
  status: InventoryStatus;
  lastMovementAt: string | null;
  lastMovementType: MovementType | null;
};

export type AdminStockMovement = {
  id: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  orderNumber: number | null;
  createdAt: string;
};

export type StockAdjustmentInput = {
  productId: string;
  type: Extract<MovementType, "manual_in" | "manual_adjustment">;
  /** Delta con signo: positivo para entrada/ajuste positivo, negativo para ajuste negativo. */
  quantity: number;
  reason: string;
};

export type InventorySettingsInput = {
  sku: string | null;
  lowStockThreshold: number;
};

type ProductInventoryRow = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  categories: { name: string } | null;
  stock_movements: { created_at: string; type: MovementType }[];
};

const INVENTORY_SELECT = `
  id, name, sku, stock, low_stock_threshold,
  categories ( name ),
  stock_movements ( created_at, type )
`;

function mapInventoryRow(row: ProductInventoryRow): AdminInventoryItem {
  const lastMovement = [...row.stock_movements].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )[0];

  return {
    productId: row.id,
    name: row.name,
    sku: row.sku,
    categoryName: row.categories?.name ?? null,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    status: getInventoryStatus(row.stock, row.low_stock_threshold),
    lastMovementAt: lastMovement?.created_at ?? null,
    lastMovementType: lastMovement?.type ?? null,
  };
}

/** Trae los 6 productos ya sembrados con su último movimiento embebido en
 * la misma consulta (mismo criterio que listCustomers(), Fase 16: una
 * sola query, no una segunda consulta por fila). */
export async function listInventory(): Promise<AdminInventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(INVENTORY_SELECT)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as unknown as ProductInventoryRow[]).map(mapInventoryRow);
}

export async function getInventoryItemById(productId: string): Promise<AdminInventoryItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(INVENTORY_SELECT)
    .eq("id", productId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapInventoryRow(data as unknown as ProductInventoryRow) : null;
}

type MovementRow = {
  id: string;
  type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
  orders: { order_number: number } | null;
};

const MOVEMENT_SELECT = `
  id, type, quantity, previous_stock, new_stock, reason, created_at,
  orders ( order_number )
`;

export async function listMovements(productId: string): Promise<AdminStockMovement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(MOVEMENT_SELECT)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as MovementRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    quantity: row.quantity,
    previousStock: row.previous_stock,
    newStock: row.new_stock,
    reason: row.reason,
    orderNumber: row.orders?.order_number ?? null,
    createdAt: row.created_at,
  }));
}

type RegisterMovementRow = {
  id: string;
  type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  created_at: string;
};

/** Entrada de stock o ajuste manual (positivo o negativo) -- vía la
 * función de Postgres `register_stock_movement` (Sprint 6.0), nunca un
 * `update` directo a `products.stock`: es la única forma de garantizar
 * que el stock y su historial se muevan juntos y que nunca quede
 * negativo. Devuelve el movimiento ya creado (la función de Postgres lo
 * retorna directamente) para que el hook pueda actualizar el estado local
 * de forma optimista, sin un refetch completo -- mismo criterio que
 * useOrder.ts/useOrders.ts (CLAUDE.md, sección 11). `orderNumber` siempre
 * es null acá: esta función nunca genera movimientos ligados a un pedido,
 * esos los crea únicamente el trigger `apply_order_stock_movement`. */
export async function registerStockMovement(input: StockAdjustmentInput): Promise<AdminStockMovement> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("register_stock_movement", {
    p_product_id: input.productId,
    p_type: input.type,
    p_quantity: input.quantity,
    p_reason: input.reason,
  });

  if (error) throw new Error(error.message);

  const row = data as RegisterMovementRow;
  return {
    id: row.id,
    type: row.type,
    quantity: row.quantity,
    previousStock: row.previous_stock,
    newStock: row.new_stock,
    reason: row.reason,
    orderNumber: null,
    createdAt: row.created_at,
  };
}

/** SKU y stock mínimo son campos de `products`, pero se editan
 * exclusivamente acá -- ProductForm.tsx/services/products.ts (Productos,
 * protegido este sprint) no ganan ningún campo nuevo. */
export async function updateInventorySettings(
  productId: string,
  input: InventorySettingsInput
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      sku: input.sku && input.sku.trim() ? input.sku.trim() : null,
      low_stock_threshold: input.lowStockThreshold,
    })
    .eq("id", productId)
    .select("id");

  if (error) throw new Error(error.message);
  assertRowAffected(
    data,
    "No se pudo guardar el SKU/stock mínimo: no tenés permisos de administrador o el producto ya no existe."
  );
}
