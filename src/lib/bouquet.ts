import type { FlowerAsset, FlowerRole, PlacedPiece, WrapperAsset } from '@/types'

/**
 * Motor de armado del ramo.
 *
 * Está sacado de mirar los ramos reales de Makyp (Quinteto de Sol, Gala de
 * Primavera, Bouquet Sulli, Jardín de Lavanda). Ahí se ve que un ramo NO es
 * una cuadrícula de filas: es una masa redonda donde cada flor se acomoda en
 * el hueco que dejan las de al lado, escalonadas, nunca una encima de otra
 * en columna. Las flores chiquitas se meten justo en los huecos que quedan
 * entre las grandes.
 *
 * Por eso el motor no coloca en posiciones fijas: para cada flor prueba
 * muchas posiciones posibles y elige la que mejor calza contra las que ya
 * están puestas (ni encimada ni con hueco). Así funciona igual con 3 flores
 * que con 20, y con cualquier mezcla.
 *
 * Cada pieza ocupa el espacio que ocupa de verdad: no un círculo, sino la
 * elipse de su propia foto. Casi todas las flores son redondas y ahí da
 * igual, pero las que no lo son (la lavanda es una espiga cuatro veces más
 * alta que ancha) tienen que medirse por su cuerpo real, o el motor las trata
 * como si fueran chiquitas y las manda a volar por encima del ramo.
 */

const CANDIDATES = 160

/** Qué tan pegada va cada tipo de flor a sus vecinas (1 = se tocan sin traslape). */
const SNUG: Record<FlowerRole, number> = {
  face: 0.74, // las grandes se traslapan bastante: forman la masa
  stem: 0.82,
  spike: 0.9,
  filler: 0.72, // se montan sobre la costura entre dos grandes, como en el ramo real
  green: 1,
}

/** Zona vertical preferida dentro del ramo (-1 arriba .. +1 abajo). */
const ZONE: Record<FlowerRole, { ideal: number; min: number; max: number; weight: number }> = {
  // pesos bajos a propósito: mandan las vecinas, no una altura fija.
  // Así las flores se escalonan solas en vez de alinearse en fila.
  face: { ideal: 0.34, min: -0.25, max: 1, weight: 0.42 },
  stem: { ideal: -0.5, min: -1, max: 0.2, weight: 0.55 },
  // La espiga ya sale por encima sola: su cuerpo es largo y crece hacia
  // arriba desde donde se apoya. Lo que se coloca aquí es ese apoyo, que va
  // dentro de la masa; si se subiera el apoyo, la espiga quedaría flotando.
  spike: { ideal: -0.3, min: -0.85, max: 0.15, weight: 0.7 },
  // casi libre: se meten donde haya hueco, pero dentro del cuerpo del ramo
  filler: { ideal: 0.1, min: -0.6, max: 0.8, weight: 0.25 },
  green: { ideal: -0.3, min: -1, max: 0.6, weight: 0.6 },
}

const ROLE_Z: Record<FlowerRole, number> = { green: 20, spike: 60, stem: 150, face: 300, filler: 600 }

/** Aleatorio determinista: el mismo ramo se ve siempre igual. */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Reparte los tipos para que no queden todos los de una clase juntos. */
function interleave(items: FlowerAsset[]): FlowerAsset[] {
  const groups = new Map<string, FlowerAsset[]>()
  for (const item of items) {
    const list = groups.get(item.id)
    if (list) list.push(item)
    else groups.set(item.id, [item])
  }
  const lists = [...groups.values()].sort((a, b) => b.length - a.length)
  const out: FlowerAsset[] = []
  for (let i = 0; out.length < items.length; i++) {
    for (const list of lists) if (list[i]) out.push(list[i])
  }
  return out
}

/** Una pieza ya puesta, con el espacio que ocupa de verdad: la elipse de su foto. */
interface Spot {
  /** centro de la elipse (no el anclaje: el anclaje puede estar descentrado). */
  x: number
  y: number
  rx: number
  ry: number
}

/**
 * Qué tanto se traslapan dos piezas. 1 = se tocan justo, <1 = encimadas.
 * Con dos círculos es la distancia partida por la suma de radios, que es lo
 * que hacía antes; con elipses se mide igual pero por eje.
 */
function overlapRatio(a: Spot, b: Spot): number {
  return Math.hypot((a.x - b.x) / (a.rx + b.rx), (a.y - b.y) / (a.ry + b.ry))
}

export function layoutBouquet(
  flowers: FlowerAsset[],
  quantities: Record<string, number>,
  wrapper: WrapperAsset,
): PlacedPiece[] {
  const byId = new Map(flowers.map((f) => [f.id, f]))
  const A = wrapper.aspect

  // Todo el cálculo se hace en "% del ancho de la envoltura" para los dos
  // ejes, si no las distancias saldrían deformadas al ser la caja rectangular.
  const cx = wrapper.cluster.x * 100
  // el cuerpo del ramo se apoya un poco por encima del punto de amarre,
  // nunca sobre el moño
  const cy = (wrapper.cluster.y * 100) / A

  const pick = (role: FlowerRole) => {
    const out: FlowerAsset[] = []
    for (const [id, qty] of Object.entries(quantities)) {
      const flower = byId.get(id)
      if (!flower || flower.role !== role) continue
      for (let n = 0; n < qty; n++) out.push(flower)
    }
    return interleave(out)
  }

  // grandes primero: ellas arman la masa. El relleno va aparte, al final,
  // porque no busca un lugar libre sino las junturas que dejan las grandes.
  const order: FlowerAsset[] = [
    ...pick('face').sort((a, b) => b.w - a.w),
    ...pick('stem'),
    ...pick('spike'),
  ]
  const fillers = pick('filler')
  const greens = pick('green')

  if (order.length === 0 && fillers.length === 0 && greens.length === 0) return []

  /**
   * Con pocas flores el ramo se ve grande y suelto; a medida que se agregan,
   * van achicando y apretándose. Se mide contra el cupo de cada envoltura,
   * no contra un número fijo: 3 flores llenan una envoltura pequeña pero
   * quedan sueltas en una grande.
   */
  const fullness = (order.length + fillers.length) / Math.max(1, wrapper.capacity * 0.6)
  const sparseBoost = 1 + 0.45 * Math.max(0, 1 - fullness)
  const sizeOf = (f: FlowerAsset) => (f.w / 1000) * wrapper.flowerScale * sparseBoost * 100

  /**
   * El espacio que pide una flor: la elipse de su propia foto.
   *
   * Antes se asumía un círculo de ancho/2, que sirve para las flores redondas
   * (que son casi todas) pero no para una espiga como la lavanda: el motor la
   * medía chiquita y por eso la encimaba con sus vecinas y la sacaba del ramo.
   *
   * Se devuelve también el corrimiento entre el anclaje (el centro de la
   * cabeza, que es lo que el motor coloca) y el centro de esa elipse.
   */
  const footprintOf = (f: FlowerAsset) => {
    const w = sizeOf(f)
    const h = w * (f.h / f.w)
    return { rx: w / 2, ry: h / 2, ox: (0.5 - f.anchor.x) * w, oy: (0.5 - f.anchor.y) * h }
  }

  // El ramo crece según cuánta flor hay, como uno de verdad: nunca se
  // apila hacia arriba, se ensancha.
  const areaSum = [...order, ...fillers].reduce((sum, f) => {
    const fp = footprintOf(f)
    return sum + fp.rx * fp.ry
  }, 0)
  const heightRatio = 0.88
  const maxR = wrapper.clusterR * 100
  const Rx = Math.max(
    maxR * 0.42,
    Math.min(maxR, Math.sqrt(areaSum / 0.55 / heightRatio) || maxR * 0.42),
  )
  const Ry = Rx * heightRatio

  const placed: Spot[] = []
  const pieces: PlacedPiece[] = []

  order.forEach((flower, index) => {
    const role = flower.role
    const zone = ZONE[role]
    const snug = SNUG[role]
    const w = sizeOf(flower)
    const { rx, ry, ox, oy } = footprintOf(flower)
    const random = rng(index * 7919 + 13)
    // Lo que la pieza tiene de más alto que ancho. En una flor redonda es
    // cero y todo se comporta como siempre.
    const bodyY = Math.max(0, ry - rx)
    // Cuanto más alargada es la pieza, más se abre: en el ramo real las
    // espigas abanican desde el amarre y las flores redondas casi no giran.
    const splay = Math.max(1, Math.min(2.2, ry / rx))
    const leanAt = (x: number) => (((x - cx) / Rx) * (role === 'face' ? 7 : 12) * splay * Math.PI) / 180

    let best: { x: number; y: number } | null = null
    let bestScore = -Infinity

    for (let k = 0; k < CANDIDATES; k++) {
      // punto al azar dentro de la elipse del ramo, dentro de la zona del rol
      const t = random() * Math.PI * 2
      const rad = Math.sqrt(random())
      // El centro se mantiene hacia adentro para que la flor no se salga de
      // la envoltura, pero siempre queda algo de área donde repartir: si la
      // flor es más grande que el racimo (envoltura pequeña con flores
      // grandes) esto llegaría a cero y todas caerían en el mismo punto.
      const px = cx + Math.cos(t) * rad * Math.max(Rx * 0.45, Rx - rx * 0.9)
      const yNorm = Math.max(zone.min, Math.min(zone.max, Math.sin(t) * rad))
      const py = cy - Ry * 0.14 + yNorm * Ry
      // dónde cae el cuerpo de la pieza, que no es lo mismo que su anclaje
      const cand: Spot = { x: px + ox, y: py + oy, rx, ry }

      let score = 0
      // 1. respetar la zona del rol (las grandes abajo, las de tallo arriba).
      // La zona no es una línea plana: un ramo es una cúpula, y hacia los
      // bordes todo baja. Sin esto las flores de un mismo tipo terminan
      // alineadas en fila a la misma altura, que es lo que no pasa en un ramo.
      const off = (px - cx) / Rx
      const ideal = zone.ideal + off * off * 0.55
      score -= Math.abs(yNorm - ideal) * 34 * zone.weight
      // 2. no salirse del ramo. Una flor redonda puede asomar por el contorno
      // como siempre; una pieza alargada tiene que meter su cuerpo dentro,
      // porque si se coloca solo por el anclaje se dispara fuera del ramo.
      // Y como gira sobre su base, al inclinarse barre hacia el lado: una
      // espiga larga cerca del borde ocupa mucho más ancho del que mide.
      const lean = leanAt(px)
      const bodyX = Math.max(0, Math.abs(rx * Math.cos(lean)) + Math.abs(ry * Math.sin(lean)) - rx)
      const out = Math.hypot(
        (Math.abs(cand.x - cx) + bodyX) / Rx,
        (Math.abs(cand.y - cy) + bodyY) / Ry,
      )
      if (out > 1) score -= (out - 1) * 160

      // 3. calzar con las vecinas: ni encimada ni dejando hueco
      let minRatio = Infinity
      for (const spot of placed) {
        minRatio = Math.min(minRatio, overlapRatio(cand, spot))
      }
      if (minRatio !== Infinity) {
        // Castigo fuerte a quedar encimada, pero sin descartar la posición:
        // si se descartaran todas (caso de flores grandes en envoltura
        // pequeña) no quedaría ninguna opción y todas terminarían apiladas
        // en el mismo punto. Así siempre elige la menos mala.
        if (minRatio < 0.42) score -= (0.42 - minRatio) * 900
        score -= Math.pow(minRatio - snug, 2) * 190
      }

      if (score > bestScore) {
        bestScore = score
        best = { x: px, y: py }
      }
    }

    if (!best) best = { x: cx, y: cy + zone.ideal * Ry }

    placed.push({ x: best.x + ox, y: best.y + oy, rx, ry })

    // Tallo según dónde quedó: las de arriba muestran tallo (baja y las
    // conecta al ramo); las de abajo no, para que no asome por la envoltura.
    const high = (best.y - cy) / Ry < 0.02
    const art = high && flower.stem ? flower.stem : flower
    const tilt = (leanAt(best.x) * 180) / Math.PI

    pieces.push({
      key: `${flower.id}-${index}`,
      image: art.image,
      left: best.x,
      top: best.y * A,
      width: w,
      rotate: tilt,
      // dentro de cada capa, lo que está más abajo va más al frente
      zIndex: ROLE_Z[role] + Math.round(((best.y - cy) / Ry) * 40),
      anchor: art.anchor,
      origin: { x: art.anchor.x, y: 1 },
      alt: flower.label,
    })
  })

  /**
   * Recentrado del ramo.
   *
   * Las posiciones salen de probar puntos al azar y quedarse con el que mejor
   * calza. Con muchas flores eso llena la elipse y queda centrado solo, pero
   * con pocas el conjunto puede quedar cargado a un lado, dejando vacío el
   * lado opuesto. Aquí se mide el borde real de la masa y se corre entera
   * hasta el centro. En un ramo lleno la corrección es casi cero, así que no
   * altera lo que ya funciona.
   */
  if (placed.length > 0) {
    const minX = Math.min(...placed.map((p) => p.x - p.rx))
    const maxX = Math.max(...placed.map((p) => p.x + p.rx))
    const minY = Math.min(...placed.map((p) => p.y - p.ry))
    const maxY = Math.max(...placed.map((p) => p.y + p.ry))
    const dx = cx - (minX + maxX) / 2
    const dy = cy - Ry * 0.14 - (minY + maxY) / 2
    for (const spot of placed) {
      spot.x += dx
      spot.y += dy
    }
    for (const piece of pieces) {
      piece.left += dx
      piece.top += dy * A
    }
  }

  // ---------- relleno: margaritas pequeñas en las junturas ----------
  //
  // En los ramos reales (Quinteto de Sol es el ejemplo más claro) las
  // margaritas nunca están sueltas ni por encima del ramo: van metidas justo
  // donde se tocan dos flores grandes, apoyadas sobre la costura. Así que en
  // vez de buscarles un lugar libre, se calculan esas junturas y se reparten
  // entre ellas.
  const seams: { x: number; y: number; fit: number }[] = []
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i]
      const b = placed[j]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      // A qué distancia se tocarían estas dos por el lado en que se miran.
      // Con dos flores redondas es la suma de radios de siempre.
      const ux = (b.x - a.x) / (d || 1)
      const uy = (b.y - a.y) / (d || 1)
      const reach = Math.hypot(ux * (a.rx + b.rx), uy * (a.ry + b.ry))
      // solo cuentan las que de verdad se tocan
      if (d > reach * 1.02 || d < reach * 0.2) continue
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const fit = d / reach
      // La costura es una línea, no un punto: se ofrecen varios sitios a lo
      // largo de ella. Si solo se usara el punto medio, en un racimo apretado
      // todos los puntos quedan juntos y las margaritas se amontonan.
      const px = -(b.y - a.y) / (d || 1)
      const py = (b.x - a.x) / (d || 1)
      for (const t of [0, 0.32, -0.32]) {
        const sx = mx + px * reach * t
        const sy = my + py * reach * t
        // sin salirse de la masa del ramo
        if (Math.hypot((sx - cx) / Rx, (sy - cy) / Ry) > 1.02) continue
        seams.push({ x: sx, y: sy, fit })
      }
    }
  }

  const fillerSpots: { x: number; y: number }[] = []
  fillers.forEach((flower, i) => {
    const w = sizeOf(flower)
    const r = w / 2
    const random = rng(i * 6151 + 29)
    let best: { x: number; y: number } | null = null

    if (seams.length > 0) {
      let bestScore = -Infinity
      for (const seam of seams) {
        // repartirlas: se premia estar lejos de las margaritas ya puestas
        let nearest = Infinity
        for (const spot of fillerSpots) {
          nearest = Math.min(nearest, Math.hypot(seam.x - spot.x, seam.y - spot.y))
        }
        // pesa mucho la separación: si no, todas se amontonan en la zona
        // donde hay más junturas y dejan el resto del ramo vacío
        const spread = nearest === Infinity ? r * 8 : Math.min(nearest, r * 8)
        // y entre junturas parejas, primero las bien cerradas
        let score = spread * 1.6 - Math.abs(seam.fit - 0.8) * 8
        // dos margaritas no se montan entre sí: se ven como una mancha
        if (nearest < r * 2.3) score -= (r * 2.3 - nearest) * 9
        if (score > bestScore) {
          bestScore = score
          best = { x: seam.x, y: seam.y }
        }
      }
      // pequeño corrimiento para que dos en la misma juntura no se calquen
      if (best) {
        best = { x: best.x + (random() - 0.5) * r * 0.7, y: best.y + (random() - 0.5) * r * 0.7 }
      }
    }

    // Sin junturas (ramo vacío o con una sola flor) no hay dónde apoyarla:
    // ahí sí va la versión con tallo, para que no quede una cabeza flotando.
    const alone = best === null
    const angle = random() * Math.PI * 2
    const rad = Math.sqrt(random()) * Rx * 0.5
    const spot = best ?? { x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad * 0.9 }

    fillerSpots.push(spot)
    const art = alone && flower.stem ? flower.stem : flower
    pieces.push({
      key: `filler-${flower.id}-${i}`,
      image: art.image,
      left: spot.x,
      top: spot.y * A,
      width: w,
      rotate: (random() - 0.5) * 26,
      zIndex: ROLE_Z.filler + i,
      anchor: art.anchor,
      origin: { x: art.anchor.x, y: 1 },
      alt: flower.label,
    })
  })

  // ---------- hojas: asomando por detrás de la masa ----------
  //
  // Se anclan al borde real del ramo, no a un radio fijo: si se calculara
  // sobre el radio teórico quedarían flotando lejos cuando el ramo es chico.
  // Se toma el radio corto de cada pieza: una espiga alta no debe empujar las
  // hojas hacia afuera, porque lo que enmarcan es la masa de flores.
  const massR = placed.length
    ? Math.max(...placed.map((p) => Math.hypot(p.x - cx, p.y - cy) + Math.min(p.rx, p.ry)))
    : Rx
  greens.forEach((flower, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const step = Math.floor(i / 2)
    const elevation = (12 + step * 26) * (Math.PI / 180)
    const w = sizeOf(flower) * 0.92
    // la base queda dentro de la masa: por eso el 0.72, para que la hoja
    // nazca detrás de las flores y no despegada
    const reach = massR * 0.72
    pieces.push({
      key: `green-${flower.id}-${i}`,
      image: flower.image,
      left: cx + side * Math.cos(elevation) * reach,
      top: (cy - Math.sin(elevation) * reach * heightRatio) * A,
      width: w,
      rotate: side * (56 - elevation * (180 / Math.PI) * 0.8),
      zIndex: ROLE_Z.green + i,
      anchor: flower.anchor,
      origin: { x: flower.anchor.x, y: 1 },
      alt: flower.label,
    })
  })

  return pieces
}

export function countFlowers(quantities: Record<string, number>): number {
  return Object.values(quantities).reduce((sum, n) => sum + n, 0)
}
