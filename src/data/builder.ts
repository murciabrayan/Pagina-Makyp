import type { FlowerAsset, RibbonAsset, WrapperAsset } from '@/types'

/**
 * `w`, `h` y `anchor` NO son valores a ojo: salen de medir cada PNG
 * (recorte al contenido real, corte del tallo sobrante y detección de la
 * cabeza de la flor). `w` está a escala real entre flores: un lirio (300)
 * es de verdad casi 3 veces más ancho que una margarita pequeña (110).
 *
 * `role` define cómo participa la flor en el armado; ver `lib/bouquet.ts`.
 */
export const flowerAssets: FlowerAsset[] = [
  {
    "id": "lirio-rosa",
    "label": "Lirio rosado",
    "image": "/builder/flores/lirio-rosa.webp",
    "role": "face",
    "w": 300,
    "h": 292.3,
    "anchor": {
      "x": 0.4984,
      "y": 0.5262
    }
  },
  {
    "id": "lirio-fucsia",
    "label": "Lirio fucsia",
    "image": "/builder/flores/lirio-fucsia.webp",
    "role": "face",
    "w": 285,
    "h": 286,
    "anchor": {
      "x": 0.4983,
      "y": 0.4138
    }
  },
  {
    "id": "girasol",
    "label": "Girasol",
    "image": "/builder/flores/girasol.webp",
    "role": "face",
    "w": 285,
    "h": 288.7,
    "anchor": {
      "x": 0.4984,
      "y": 0.5063
    }
  },
  {
    "id": "gerbera",
    "label": "Gerbera",
    "image": "/builder/flores/gerbera.webp",
    "role": "face",
    "w": 235,
    "h": 227.4,
    "anchor": {
      "x": 0.4984,
      "y": 0.4983
    }
  },
  {
    "id": "margarita-g",
    "label": "Margarita grande",
    "image": "/builder/flores/margarita-g.webp",
    "role": "face",
    "w": 200.7,
    "h": 204.3,
    "anchor": {
      "x": 0.5,
      "y": 0.4983
    }
  },
  {
    "id": "clavel",
    "label": "Clavel",
    "image": "/builder/flores/clavel.webp",
    "role": "stem",
    "w": 215.9,
    "h": 227,
    "anchor": {
      "x": 0.4957,
      "y": 0.437
    },
    "stem": {
      "image": "/builder/flores/clavel-tallo.webp",
      "w": 215.9,
      "h": 447.5,
      "anchor": {
        "x": 0.4957,
        "y": 0.2216
      }
    }
  },
  {
    "id": "tulipan",
    "label": "Tulipán",
    "image": "/builder/flores/tulipan.webp",
    "role": "stem",
    "w": 180,
    "h": 216.8,
    "anchor": {
      "x": 0.4981,
      "y": 0.4503
    },
    "stem": {
      "image": "/builder/flores/tulipan-tallo.webp",
      "w": 180,
      "h": 360.7,
      "anchor": {
        "x": 0.4981,
        "y": 0.2707
      }
    }
  },
  {
    "id": "rosa",
    "label": "Rosa",
    "image": "/builder/flores/rosa.webp",
    "role": "stem",
    "w": 151.2,
    "h": 162.4,
    "anchor": {
      "x": 0.5,
      "y": 0.4582
    },
    "stem": {
      "image": "/builder/flores/rosa-tallo.webp",
      "w": 151.2,
      "h": 221.5,
      "anchor": {
        "x": 0.5,
        "y": 0.3361
      }
    }
  },
  {
    "id": "lavanda",
    "label": "Lavanda",
    "image": "/builder/flores/lavanda.webp",
    "role": "spike",
    "w": 95.8,
    "h": 341.5,
    "anchor": {
      "x": 0.492,
      "y": 0.4913
    },
    "stem": {
      "image": "/builder/flores/lavanda-tallo.webp",
      "w": 95.8,
      "h": 372.3,
      "anchor": {
        "x": 0.492,
        "y": 0.4507
      }
    }
  },
  {
    "id": "margarita-p",
    "label": "Margarita pequeña",
    // Sin tallo: es la que se mete en las junturas entre flores grandes,
    // apoyada encima de la costura. Es el caso normal.
    "image": "/builder/flores/margarita-p-sola.webp",
    "role": "filler",
    "w": 110.6,
    "h": 99.5,
    "anchor": {
      "x": 0.5,
      "y": 0.4912
    },
    // Con tallo: solo cuando el ramo está vacío o casi, para que no quede
    // una cabeza suelta flotando sin nada donde apoyarse.
    "stem": {
      "image": "/builder/flores/margarita-p-tallo.webp",
      "w": 110,
      "h": 158.8,
      "anchor": {
        "x": 0.4953,
        "y": 0.3007
      }
    }
  },
  {
    "id": "hojas",
    "label": "Hojas y ramitas",
    "image": "/builder/flores/hojas.webp",
    "role": "green",
    "w": 255.8,
    "h": 269.7,
    "anchor": {
      "x": 0.4864,
      "y": 0.4077
    }
  }
]

/**
 * `aspect` viene de medir la imagen. `cluster`, `clusterR`, `knot`,
 * `flowerScale` y `capacity` describen cómo se arma el ramo dentro de
 * cada envoltura: dónde va el centro, qué tan grande se ve, dónde
 * amarra el listón y cuántas flores caben de verdad.
 */
export const wrapperAssets: WrapperAsset[] = [
  {
    id: 'rosada-grande',
    label: 'Abrazo Rosa',
    size: 'Grande',
    image: '/builder/envolturas/rosada-grande.webp',
    aspect: 0.8954,
    cluster: { x: 0.5, y: 0.45 },
    clusterR: 0.42,
    flowerScale: 1,
    knot: { x: 0.5, y: 0.78, w: 0.38 },
    capacity: 20,
  },
  {
    id: 'blanca-grande',
    label: 'Nube Blanca',
    size: 'Grande',
    image: '/builder/envolturas/blanca-grande.webp',
    aspect: 0.8821,
    cluster: { x: 0.5, y: 0.44 },
    clusterR: 0.41,
    flowerScale: 1,
    knot: { x: 0.5, y: 0.79, w: 0.36 },
    capacity: 20,
  },
  {
    id: 'blanca',
    label: 'Velo de Novia',
    size: 'Grande',
    image: '/builder/envolturas/blanca.webp',
    aspect: 0.9301,
    cluster: { x: 0.5, y: 0.38 },
    clusterR: 0.43,
    flowerScale: 1,
    knot: { x: 0.5, y: 0.76, w: 0.36 },
    capacity: 20,
  },
  {
    id: 'azul',
    label: 'Noche Azul',
    size: 'Grande',
    image: '/builder/envolturas/azul.webp',
    aspect: 0.7724,
    cluster: { x: 0.5, y: 0.4 },
    clusterR: 0.38,
    flowerScale: 0.95,
    knot: { x: 0.5, y: 0.72, w: 0.34 },
    capacity: 18,
  },
  {
    id: 'mediana',
    label: 'Dulce Aurora',
    size: 'Mediana',
    image: '/builder/envolturas/mediana.webp',
    aspect: 0.6429,
    cluster: { x: 0.5, y: 0.43 },
    clusterR: 0.36,
    flowerScale: 1.15,
    knot: { x: 0.5, y: 0.74, w: 0.34 },
    capacity: 12,
  },
  {
    id: 'blanca-pequena',
    label: 'Pequeño Tesoro',
    size: 'Pequeña',
    image: '/builder/envolturas/blanca-pequena.webp',
    aspect: 0.4493,
    cluster: { x: 0.5, y: 0.3 },
    // Radio amplio para que las 3 o 4 flores se abran y se distingan; si el
    // racimo es más chico que las flores terminan una encima de otra.
    clusterR: 0.42,
    // Es una caja chica: van pocas flores pero grandes, si no se ven perdidas
    // dentro del celofán.
    flowerScale: 2,
    knot: { x: 0.5, y: 0.56, w: 0.4 },
    capacity: 4,
  },
]

export const ribbonAssets: RibbonAsset[] = [
  { id: 'rosado', label: 'Rosado', image: '/builder/listones/rosado.webp', aspect: 0.97 },
  { id: 'azul', label: 'Azul', image: '/builder/listones/azul.webp', aspect: 0.97 },
  { id: 'amarillo', label: 'Amarillo', image: '/builder/listones/amarillo.webp', aspect: 0.9676 },
  { id: 'rojo', label: 'Rojo', image: '/builder/listones/rojo.webp', aspect: 0.97 },
]


/**
 * Colores disponibles para cada flor.
 *
 * No son fotos distintas: cada variante sale de recolorear la MISMA foto
 * real, cambiando solo el tono de los pétalos. Los tallos verdes, los centros
 * amarillos y el corazón café del girasol quedan intactos, porque el
 * recoloreo se limita a la banda de tono de los pétalos de cada flor.
 *
 * `base` es el color de la foto original, que se usa sin retocar.
 */
export const flowerColorVariants: Record<
  string,
  { base: string; variants: Record<string, { image: string; stem?: string }> }
> = {
  "lirio-rosa": {
    "base": "rosa",
    "variants": {
      "morado": {
        "image": "/builder/flores/lirio-rosa--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/lirio-rosa--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/lirio-rosa--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/lirio-rosa--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/lirio-rosa--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/lirio-rosa--blanco.webp"
      }
    }
  },
  "lirio-fucsia": {
    "base": "rosa",
    "variants": {
      "morado": {
        "image": "/builder/flores/lirio-fucsia--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/lirio-fucsia--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/lirio-fucsia--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/lirio-fucsia--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/lirio-fucsia--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/lirio-fucsia--blanco.webp"
      }
    }
  },
  "girasol": {
    "base": "amarillo",
    "variants": {
      "rosa": {
        "image": "/builder/flores/girasol--rosa.webp"
      },
      "morado": {
        "image": "/builder/flores/girasol--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/girasol--azul.webp"
      },
      "naranja": {
        "image": "/builder/flores/girasol--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/girasol--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/girasol--blanco.webp"
      }
    }
  },
  "gerbera": {
    "base": "rosa",
    "variants": {
      "morado": {
        "image": "/builder/flores/gerbera--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/gerbera--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/gerbera--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/gerbera--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/gerbera--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/gerbera--blanco.webp"
      }
    }
  },
  "margarita-g": {
    "base": "azul",
    "variants": {
      "rosa": {
        "image": "/builder/flores/margarita-g--rosa.webp"
      },
      "morado": {
        "image": "/builder/flores/margarita-g--morado.webp"
      },
      "amarillo": {
        "image": "/builder/flores/margarita-g--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/margarita-g--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/margarita-g--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/margarita-g--blanco.webp"
      }
    }
  },
  "clavel": {
    "base": "rojo",
    "variants": {
      "rosa": {
        "image": "/builder/flores/clavel--rosa.webp",
        "stem": "/builder/flores/clavel-tallo--rosa.webp"
      },
      "morado": {
        "image": "/builder/flores/clavel--morado.webp",
        "stem": "/builder/flores/clavel-tallo--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/clavel--azul.webp",
        "stem": "/builder/flores/clavel-tallo--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/clavel--amarillo.webp",
        "stem": "/builder/flores/clavel-tallo--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/clavel--naranja.webp",
        "stem": "/builder/flores/clavel-tallo--naranja.webp"
      },
      "blanco": {
        "image": "/builder/flores/clavel--blanco.webp",
        "stem": "/builder/flores/clavel-tallo--blanco.webp"
      }
    }
  },
  "tulipan": {
    "base": "rosa",
    "variants": {
      "morado": {
        "image": "/builder/flores/tulipan--morado.webp",
        "stem": "/builder/flores/tulipan-tallo--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/tulipan--azul.webp",
        "stem": "/builder/flores/tulipan-tallo--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/tulipan--amarillo.webp",
        "stem": "/builder/flores/tulipan-tallo--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/tulipan--naranja.webp",
        "stem": "/builder/flores/tulipan-tallo--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/tulipan--rojo.webp",
        "stem": "/builder/flores/tulipan-tallo--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/tulipan--blanco.webp",
        "stem": "/builder/flores/tulipan-tallo--blanco.webp"
      }
    }
  },
  "rosa": {
    "base": "rojo",
    "variants": {
      "rosa": {
        "image": "/builder/flores/rosa--rosa.webp",
        "stem": "/builder/flores/rosa-tallo--rosa.webp"
      },
      "morado": {
        "image": "/builder/flores/rosa--morado.webp",
        "stem": "/builder/flores/rosa-tallo--morado.webp"
      },
      "azul": {
        "image": "/builder/flores/rosa--azul.webp",
        "stem": "/builder/flores/rosa-tallo--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/rosa--amarillo.webp",
        "stem": "/builder/flores/rosa-tallo--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/rosa--naranja.webp",
        "stem": "/builder/flores/rosa-tallo--naranja.webp"
      },
      "blanco": {
        "image": "/builder/flores/rosa--blanco.webp",
        "stem": "/builder/flores/rosa-tallo--blanco.webp"
      }
    }
  },
  "lavanda": {
    "base": "morado",
    "variants": {
      "rosa": {
        "image": "/builder/flores/lavanda--rosa.webp",
        "stem": "/builder/flores/lavanda-tallo--rosa.webp"
      },
      "azul": {
        "image": "/builder/flores/lavanda--azul.webp",
        "stem": "/builder/flores/lavanda-tallo--azul.webp"
      },
      "amarillo": {
        "image": "/builder/flores/lavanda--amarillo.webp",
        "stem": "/builder/flores/lavanda-tallo--amarillo.webp"
      },
      "naranja": {
        "image": "/builder/flores/lavanda--naranja.webp",
        "stem": "/builder/flores/lavanda-tallo--naranja.webp"
      },
      "rojo": {
        "image": "/builder/flores/lavanda--rojo.webp",
        "stem": "/builder/flores/lavanda-tallo--rojo.webp"
      },
      "blanco": {
        "image": "/builder/flores/lavanda--blanco.webp",
        "stem": "/builder/flores/lavanda-tallo--blanco.webp"
      }
    }
  }
}

/** Paleta que se ofrece en el armador. */
export const flowerColors: { id: string; label: string; swatch: string }[] = [
  { id: 'rosa', label: 'Rosa', swatch: '#f2789f' },
  { id: 'morado', label: 'Morado', swatch: '#a259d9' },
  { id: 'azul', label: 'Azul', swatch: '#3d8ee0' },
  { id: 'amarillo', label: 'Amarillo', swatch: '#f2c230' },
  { id: 'naranja', label: 'Naranja', swatch: '#ef8b3c' },
  { id: 'rojo', label: 'Rojo', swatch: '#e03a3a' },
  { id: 'blanco', label: 'Blanco', swatch: '#ffffff' },
]
/** Arranca vacío: el cliente elige todo desde cero. "Reiniciar" vuelve aquí. */
export const defaultBuilderState = {
  wrapperId: 'rosada-grande',
  ribbonId: 'rosado',
  quantities: {} as Record<string, number>,
  paletteColor: 'rosa',
  flowerColors: {} as Record<string, string>,
}
