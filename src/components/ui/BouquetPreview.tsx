import { useMemo } from 'react'
import { layoutBouquet } from '@/lib/bouquet'
import { applyFlowerColors } from '@/lib/flowerColors'
import { flowerAssets, ribbonAssets } from '@/data/builder'
import type { BouquetPreviewProps } from '@/types'

export function BouquetPreview({ state, wrapper, className = '' }: BouquetPreviewProps) {
  const pieces = useMemo(
    () =>
      layoutBouquet(
        applyFlowerColors(flowerAssets, state.paletteColor, state.flowerColors),
        state.quantities,
        wrapper,
      ),
    [state.quantities, state.paletteColor, state.flowerColors, wrapper],
  )
  const ribbon = ribbonAssets.find((r) => r.id === state.ribbonId) ?? ribbonAssets[0]
  const isEmpty = pieces.length === 0

  return (
    <div
      className={`relative w-full aspect-[4/5] rounded-lg bg-gradient-to-b from-brand-50 via-white to-blush-100/50 border border-line overflow-hidden ${className}`}
    >
      {/*
        La caja de la envoltura es el sistema de coordenadas de todo lo demás.
        Va al 92% y algo más abajo para dejar aire arriba: las flores altas
        sobresalen del papel, igual que en un ramo real.
      */}
      <div
        className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[92%]"
        style={{ aspectRatio: String(wrapper.aspect) }}
      >
        <img
          src={wrapper.image}
          alt={`Envoltura ${wrapper.label}`}
          className="absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: 1 }}
          loading="eager"
        />

        {pieces.map((piece) => (
          <img
            key={piece.key}
            src={piece.image}
            alt={piece.alt}
            loading="lazy"
            decoding="async"
            className="absolute"
            style={{
              left: `${piece.left}%`,
              top: `${piece.top}%`,
              width: `${piece.width}%`,
              height: 'auto',
              zIndex: piece.zIndex,
              transformOrigin: `${piece.origin.x * 100}% ${piece.origin.y * 100}%`,
              transform: `translate(${-piece.anchor.x * 100}%, ${-piece.anchor.y * 100}%) rotate(${piece.rotate}deg)`,
            }}
          />
        ))}

        <img
          src={ribbon.image}
          alt={`Listón ${ribbon.label}`}
          className="absolute"
          style={{
            left: `${wrapper.knot.x * 100}%`,
            top: `${wrapper.knot.y * 100}%`,
            width: `${wrapper.knot.w * 100}%`,
            height: 'auto',
            zIndex: 600,
            transform: 'translate(-50%, -34%)',
          }}
        />
      </div>

      {isEmpty && (
        <p className="absolute inset-x-8 top-[30%] text-center text-[13px] text-muted" style={{ zIndex: 700 }}>
          Agrega flores para ver tu ramo aquí
        </p>
      )}
    </div>
  )
}
