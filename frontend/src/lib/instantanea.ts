import copia from '@/data/instantanea.json'

/**
 * La copia del catalogo que viaja dentro de la tienda.
 *
 * El servidor gratuito se duerme cuando nadie entra y tarda casi un minuto en
 * despertar. Sin esto, quien llegara en ese momento veria la tienda en
 * blanco. Con esto la ve completa desde el primer instante, y en cuanto la API
 * responde se cambia por la version en vivo.
 *
 * La copia se renueva en cada `npm run build` (ver scripts/instantanea.mjs).
 * Puede estar algo atrasada respecto a lo ultimo que Maira cambio en el panel,
 * pero solo se ve los segundos que tarda en llegar la version en vivo, y los
 * pedidos se cierran por WhatsApp, donde el precio se confirma de todos modos.
 *
 * Solo se usa en produccion. En local el servidor esta siempre despierto, y
 * si la copia tapara un fallo de la API local no te enterarias.
 */
const RUTAS: Record<string, unknown> = {
  '/bootstrap/': copia.bootstrap,
  '/catalog/products/': copia.productos,
  '/builder/bundle/': copia.armador,
}

/** Lo que hay guardado para esa ruta, o null si no hay copia. */
export function instantanea<T>(ruta: string): T | null {
  if (!import.meta.env.PROD) return null
  return (RUTAS[ruta] as T | undefined) ?? null
}
