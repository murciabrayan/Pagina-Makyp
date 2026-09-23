import type {
  AjustePieza,
  FlowerAsset,
  FlowerRole,
  PlacedPiece,
  PosicionFija,
  WrapperAsset,
} from '@/types'

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

/**
 * Cuenta ejemplares por flor, para darle a cada pieza una clave estable.
 *
 * La clave importa mas de lo que parece: es lo que ata un retoque del cliente
 * —haber movido esa flor, haberla traido al frente— a la pieza concreta que
 * retoco. Antes llevaba el indice dentro del ramo entero, asi que agregar una
 * flor corria todos los indices y los retoques saltaban a piezas ajenas.
 * Numerando por flor, la tercera rosa sigue siendo la tercera rosa aunque
 * despues se agreguen girasoles.
 */
function contador(): (id: string) => number {
  const vistos = new Map<string, number>()
  return (id) => {
    const n = vistos.get(id) ?? 0
    vistos.set(id, n + 1)
    return n
  }
}

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
  spike: { ideal: -0.62, min: -1, max: -0.05, weight: 1.1 },
  // casi libre: se meten donde haya hueco, pero dentro del cuerpo del ramo
  filler: { ideal: 0.1, min: -0.6, max: 0.8, weight: 0.25 },
  green: { ideal: -0.3, min: -1, max: 0.6, weight: 0.6 },
}

const ROLE_Z: Record<FlowerRole, number> = { green: 20, spike: 60, stem: 150, face: 300, filler: 600 }

/**
 * Cuanto puede inclinarse como mucho cada tipo de flor, en grados.
 *
 * Hace falta un tope porque la apertura crece con lo alargada que sea la
 * pieza, y eso se penso mirando flores redondas. La lavanda mide 3,5 de alto
 * por 1 de ancho —tres veces mas alargada que cualquier otra— y acababa
 * ladeada hasta 20 grados: una espiga asi de larga inclinada tanto se ve
 * chueca y se sale del ramo por arriba.
 *
 * La espiga es justo la que menos margen necesita: su gracia es subir recta
 * marcando la silueta. El follaje, al contrario, se abre en abanico y por eso
 * tiene el tope mas alto.
 */
const TOPE_INCLINACION: Record<FlowerRole, number> = {
  face: 9,
  stem: 15,
  spike: 9,
  filler: 18,
  green: 45,
}

/** Escala fija para medir profundidad, para que no dependa de qué flores haya. */
const Z_RANGE = ROLE_Z.filler

/** De 0 (al fondo) a 1 (al frente), a partir del orden de pintado. */
const depthOf = (z: number) => Math.max(0, Math.min(1, z / Z_RANGE))

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
  role: FlowerRole
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
  /**
   * Retoques del cliente sobre lo que armo el motor: cuanto corrio cada
   * pieza y en que capa la dejo. Se aplican al final, encima de la
   * colocacion automatica, para que el ramo siga armandose solo y lo manual
   * sea solo un ajuste.
   */
  ajustes: Record<string, AjustePieza> = {},
  /**
   * Piezas que ya tenian sitio y no deben moverse. Las nuevas se colocan
   * esquivandolas, igual que esquivan a las que se acaban de poner.
   */
  fijadas: Record<string, PosicionFija> = {},
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

  // Grandes primero: ellas arman la masa. Después las espigas, que son flores
  // de línea: marcan la silueta y el alto del ramo, así que si se dejan para
  // el final solo les queda el hueco que sobra y el ramo sale cojo. Al final
  // las de tallo, que se acomodan alrededor de esa silueta. El relleno va
  // aparte porque no busca un lugar libre sino las junturas entre las grandes.
  const order: FlowerAsset[] = [
    ...pick('face').sort((a, b) => b.w - a.w),
    ...pick('spike'),
    ...pick('stem'),
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
  const numerar = contador()

  /**
   * Se numera todo de una vez, antes de colocar nada.
   *
   * Si se numerara sobre la marcha, el numero de cada pieza dependeria del
   * orden en que se colocan, y ese orden cambia en cuanto hay piezas fijas.
   * La clave tiene que ser la misma siempre, porque es lo que ata los
   * retoques del cliente a su flor.
   */
  const conIndice = order.map((flower) => ({ flower, n: numerar(flower.id) }))

  /**
   * Las que ya tenian sitio se colocan primero.
   *
   * No es un detalle de eficiencia: cada flor se acomoda contra las que ya
   * estan puestas, asi que si una nueva se calculara antes que una fija,
   * elegiria un hueco que en realidad esta ocupado y acabarian encimadas.
   *
   * Sin piezas fijas la lista queda exactamente igual que antes, y el ramo
   * sale identico al de siempre.
   */
  const porColocar = [
    ...conIndice.filter(({ flower, n }) => fijadas[`${flower.id}-${n}`]),
    ...conIndice.filter(({ flower, n }) => !fijadas[`${flower.id}-${n}`]),
  ]

  porColocar.forEach(({ flower, n }, index) => {
    const fija = fijadas[`${flower.id}-${n}`]
    if (fija) {
      // Vuelve a su sitio tal cual, y se apunta en el mapa de ocupacion para
      // que las nuevas la esquiven.
      const anchoFijo = fija.width
      const rxFijo = anchoFijo / 2
      const ryFijo = rxFijo * (flower.h / flower.w)
      const oxFijo = (0.5 - flower.anchor.x) * anchoFijo
      const oyFijo = (0.5 - flower.anchor.y) * anchoFijo * (flower.h / flower.w)
      placed.push({
        x: fija.left + oxFijo,
        y: fija.top / A + oyFijo,
        rx: rxFijo,
        ry: ryFijo,
        role: flower.role,
      })
      pieces.push({
        key: `${flower.id}-${n}`,
        flowerId: flower.id,
        indice: n,
        image: flower.image,
        left: fija.left,
        top: fija.top,
        width: anchoFijo,
        rotate: fija.rotate,
        zIndex: fija.zIndex,
        depth: depthOf(fija.zIndex),
        anchor: flower.anchor,
        origin: { x: flower.anchor.x, y: 1 },
        alt: flower.label,
      })
      return
    }

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
    const tope = TOPE_INCLINACION[role]
    const leanAt = (x: number) => {
      const grados = ((x - cx) / Rx) * (role === 'face' ? 7 : 12) * splay
      return (Math.max(-tope, Math.min(tope, grados)) * Math.PI) / 180
    }

    const sameRole = placed.filter((spot) => spot.role === role)

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
      const cand: Spot = { x: px + ox, y: py + oy, rx, ry, role }

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
      // Y no cuesta lo mismo asomar por arriba que por abajo: arriba está la
      // corona del ramo, donde las espigas tienen que sobresalir; abajo está
      // el papel y el amarre, y ahí no puede bajar nada. Para una flor
      // redonda esto no cambia nada, porque no le sobra alto.
      const above = cand.y < cy
      const out = Math.hypot(
        (Math.abs(cand.x - cx) + bodyX) / Rx,
        (Math.abs(cand.y - cy) + bodyY * (above ? 0.4 : 1)) / Ry,
      )
      if (out > 1) score -= (out - 1) * 160

      // 3. calzar con las vecinas: ni encimada ni dejando hueco
      let minRatio = Infinity
      for (const spot of placed) {
        minRatio = Math.min(minRatio, overlapRatio(cand, spot))
      }
      // 4. repartirse a lado y lado. Con muchas flores del mismo tipo el azar
      // se equilibra solo, pero con dos o tres se van todas a un costado y el
      // ramo queda cojo. Se empuja contra el lado que ya está cargado.
      if (sameRole.length > 0) {
        const bias = sameRole.reduce((sum, spot) => sum + (spot.x - cx) / Rx, 0) / sameRole.length
        score -= Math.max(0, bias * ((px - cx) / Rx)) * 170
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

    placed.push({ x: best.x + ox, y: best.y + oy, rx, ry, role })

    // Tallo según dónde quedó. Las de arriba lo muestran, porque baja y las
    // conecta con el resto del ramo. Pero solo si por debajo hay ramo que lo
    // tape: una flor alta pero corrida al borde no tiene nada debajo, y ahí
    // el tallo queda colgando en el aire por fuera del papel.
    const high = (best.y - cy) / Ry < 0.02
    // La espiga es la excepcion: nace del amarre y su tallo baja hacia el
    // centro del ramo, haya o no flores justo debajo. Exigirle estar
    // resguardada hacia que dentro de un mismo ramo unas lavandas salieran
    // con tallo y otras sin el, y la diferencia canta.
    const sheltered = role === 'spike' || Math.abs(best.x - cx) / Rx < 0.72
    const art = high && sheltered && flower.stem ? flower.stem : flower
    const tilt = (leanAt(best.x) * 180) / Math.PI

    pieces.push({
      key: `${flower.id}-${n}`,
      flowerId: flower.id,
      indice: n,
      image: art.image,
      left: best.x,
      top: best.y * A,
      width: w,
      rotate: tilt,
      // dentro de cada capa, lo que está más abajo va más al frente
      zIndex: ROLE_Z[role] + Math.round(((best.y - cy) / Ry) * 40),
      depth: depthOf(ROLE_Z[role] + Math.round(((best.y - cy) / Ry) * 40)),
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
  // Con piezas fijas no se recentra: correr la masa entera moveria justo lo
  // que se quiere dejar quieto, que es todo lo que el cliente ya acomodo.
  if (placed.length > 0 && Object.keys(fijadas).length === 0) {
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
    const n = numerar(flower.id)

    // Si ya tenia sitio, vuelve a el sin recalcular nada.
    const fijaRelleno = fijadas[`filler-${flower.id}-${n}`]
    if (fijaRelleno) {
      pieces.push({
        key: `filler-${flower.id}-${n}`,
        flowerId: flower.id,
        indice: n,
        image: flower.image,
        left: fijaRelleno.left,
        top: fijaRelleno.top,
        width: fijaRelleno.width,
        rotate: fijaRelleno.rotate,
        zIndex: fijaRelleno.zIndex,
        depth: depthOf(fijaRelleno.zIndex),
        anchor: flower.anchor,
        origin: { x: flower.anchor.x, y: 1 },
        alt: flower.label,
      })
      fillerSpots.push({ x: fijaRelleno.left, y: fijaRelleno.top / A })
      return
    }

    const angle = random() * Math.PI * 2
    const rad = Math.sqrt(random()) * Rx * 0.5
    const spot = best ?? { x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad * 0.9 }

    fillerSpots.push(spot)
    const art = alone && flower.stem ? flower.stem : flower
    pieces.push({
      key: `filler-${flower.id}-${n}`,
      flowerId: flower.id,
      indice: n,
      image: art.image,
      left: spot.x,
      top: spot.y * A,
      width: w,
      rotate: (random() - 0.5) * 26,
      zIndex: ROLE_Z.filler + i,
      depth: depthOf(ROLE_Z.filler + i),
      anchor: art.anchor,
      origin: { x: art.anchor.x, y: 1 },
      alt: flower.label,
    })
  })

  // ---------- hojas: asomando por detrás de la masa ----------
  //
  // El follaje no se empaqueta como una flor: nace del amarre y se abre en
  // abanico por detrás, con solo las puntas asomando. Tres cosas lo definen:
  //
  // 1. La foto de la ramita apunta arriba y a la derecha, no hacia arriba. Si
  //    se usa igual en los dos lados, la de la izquierda queda apuntando al
  //    centro del ramo. Por eso las de un lado van espejadas.
  // 2. Se reparten en parejas simétricas y se abren de menos a más, así dos
  //    nunca caen encimadas del mismo lado aunque el número sea impar.
  // 3. Se sujetan por la base del tallo, que es donde de verdad se agarran, y
  //    esa base va metida dentro de la masa para que la hoja nazca detrás de
  //    las flores en vez de flotar al lado.
  const massR = placed.length
    ? Math.max(...placed.map((p) => Math.hypot(p.x - cx, p.y - cy) + Math.min(p.rx, p.ry)))
    : Rx * 0.6
  // Hacia dónde mira la ramita en su propia foto, medido desde la vertical.
  const ART_AIM = 37
  const pairs = Math.ceil(greens.length / 2)
  greens.forEach((flower, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const step = Math.floor(i / 2)
    // 0 = la pareja más abierta, 1 = la más erguida
    const t = pairs <= 1 ? 0 : step / (pairs - 1)
    // La primera pareja enmarca los costados casi tumbada; las siguientes
    // van subiendo y enderezándose hasta asomar por arriba.
    const aim = 72 - t * 38
    const w = sizeOf(flower) * 0.66
    // la base entra en la masa; la hoja sale sola hacia afuera desde ahí
    const baseAngle = ((t * 50) * Math.PI) / 180
    const baseR = massR * (0.62 - t * 0.2)
    const n = numerar(flower.id)

    const fijaVerde = fijadas[`green-${flower.id}-${n}`]
    if (fijaVerde) {
      pieces.push({
        key: `green-${flower.id}-${n}`,
        flowerId: flower.id,
        indice: n,
        image: flower.image,
        left: fijaVerde.left,
        top: fijaVerde.top,
        width: fijaVerde.width,
        rotate: fijaVerde.rotate,
        zIndex: fijaVerde.zIndex,
        depth: depthOf(fijaVerde.zIndex),
        anchor: { x: flower.anchor.x, y: 1 },
        origin: { x: flower.anchor.x, y: 1 },
        flip: side < 0,
        alt: flower.label,
      })
      return
    }

    pieces.push({
      key: `green-${flower.id}-${n}`,
      flowerId: flower.id,
      indice: n,
      image: flower.image,
      left: cx + side * Math.cos(baseAngle) * baseR,
      top: (cy - Math.sin(baseAngle) * baseR * heightRatio) * A,
      width: w,
      rotate: side * (aim - ART_AIM),
      zIndex: ROLE_Z.green + i,
      depth: depthOf(ROLE_Z.green + i),
      // se ancla y gira por la base del tallo: es el punto por donde se sujeta
      anchor: { x: flower.anchor.x, y: 1 },
      origin: { x: flower.anchor.x, y: 1 },
      flip: side < 0,
      alt: flower.label,
    })
  })

  // ---------- retoques del cliente ----------
  //
  // Se aplican aqui, al final, y no dentro del calculo: el motor arma el ramo
  // como si nadie lo hubiera tocado, y lo manual se suma encima. Asi, quitar
  // un retoque devuelve exactamente lo que habia, y cambiar las flores no
  // pelea con lo que el cliente movio.
  if (Object.keys(ajustes).length > 0) {
    for (const piece of pieces) {
      const ajuste = ajustes[piece.key]
      if (!ajuste) continue
      piece.left += ajuste.dx ?? 0
      piece.top += ajuste.dy ?? 0
      // La pieza crece alrededor de su anclaje, no de su esquina, porque es
      // por ahi por donde la sostiene el ramo: asi se agranda quedandose
      // donde estaba en vez de escaparse hacia un lado.
      if (ajuste.escala && ajuste.escala !== 1) piece.width *= ajuste.escala
      if (ajuste.z !== undefined) {
        piece.zIndex = ajuste.z
        piece.depth = depthOf(ajuste.z)
      }
      piece.movida = true
    }
  }

  return pieces
}

/**
 * Lee de una clave de pieza a que flor pertenece y que ejemplar es.
 *
 * Hace falta porque no basta con mirar si la clave "contiene" el nombre de la
 * flor: al quitar una rosa, "lirio-rosa-1" tambien lo contiene, y se acababa
 * tocando los retoques del lirio. Aqui se compara el nombre entero, y se
 * tienen en cuenta los prefijos que el motor pone al relleno y al follaje.
 *
 * Devuelve null si la clave no es de esa flor.
 */
export function leerClave(clave: string, flowerId: string): number | null {
  const partes = clave.split('-')
  const indice = Number(partes.pop())
  if (Number.isNaN(indice)) return null
  const resto = partes.join('-')
  const coincide =
    resto === flowerId || resto === `filler-${flowerId}` || resto === `green-${flowerId}`
  return coincide ? indice : null
}

export function countFlowers(quantities: Record<string, number>): number {
  return Object.values(quantities).reduce((sum, n) => sum + n, 0)
}
