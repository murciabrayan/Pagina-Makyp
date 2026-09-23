import type { FlowerAsset, FlowerColorConfig } from '@/types'

type Variantes = Record<string, FlowerColorConfig>

/**
 * Devuelve las flores apuntando a la foto del color elegido.
 *
 * Cada flor toma el color general del ramo, salvo que tenga uno propio. Si el
 * color pedido es el de la foto original, se usa esa foto sin retocar; si la
 * flor no admite color (las margaritas de relleno y las hojas), se deja igual.
 *
 * El mapa de variantes llega como parámetro, no importado: ahora lo administra
 * el equipo desde el panel y viene con el resto del armador en una sola
 * petición. El motor de armado sigue sin saber nada de colores.
 */
export function applyFlowerColors(
  flowers: FlowerAsset[],
  variantes: Variantes,
  paletteColor: string,
  overrides: Record<string, string>,
): FlowerAsset[] {
  return flowers.map((flower) => {
    const config = variantes[flower.id]
    if (!config) return flower

    const wanted = overrides[flower.id] ?? paletteColor
    if (!wanted || wanted === config.base) return flower

    const variant = config.variants[wanted]
    if (!variant) return flower

    return {
      ...flower,
      image: variant.image,
      stem: flower.stem && variant.stem ? { ...flower.stem, image: variant.stem } : flower.stem,
    }
  })
}

/** Color con el que se está mostrando una flor. */
export function colorOf(
  flowerId: string,
  variantes: Variantes,
  paletteColor: string,
  overrides: Record<string, string>,
): string | null {
  const config = variantes[flowerId]
  if (!config) return null
  const wanted = overrides[flowerId] ?? paletteColor
  return wanted === config.base || config.variants[wanted] ? wanted : config.base
}
