import { flowerColorVariants } from '@/data/builder'
import type { FlowerAsset } from '@/types'

/**
 * Devuelve las flores apuntando a la foto del color elegido.
 *
 * Cada flor toma el color general del ramo, salvo que tenga uno propio. Si el
 * color pedido es el de la foto original, se usa esa foto sin retocar; si la
 * flor no admite color (las margaritas de relleno y las hojas), se deja igual.
 *
 * Se resuelve aquí, antes de armar el ramo, para que el motor de armado no
 * tenga que saber nada de colores.
 */
export function applyFlowerColors(
  flowers: FlowerAsset[],
  paletteColor: string,
  overrides: Record<string, string>,
): FlowerAsset[] {
  return flowers.map((flower) => {
    const config = flowerColorVariants[flower.id]
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
  paletteColor: string,
  overrides: Record<string, string>,
): string | null {
  const config = flowerColorVariants[flowerId]
  if (!config) return null
  const wanted = overrides[flowerId] ?? paletteColor
  return wanted === config.base || config.variants[wanted] ? wanted : config.base
}

export function isColorable(flowerId: string): boolean {
  return Boolean(flowerColorVariants[flowerId])
}
