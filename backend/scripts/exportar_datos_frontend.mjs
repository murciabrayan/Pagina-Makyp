/**
 * Saca a JSON los datos que hoy viven escritos dentro del frontend.
 *
 * Se ejecuta una sola vez, para llenar la base de datos con lo que ya existe:
 * los 17 productos, las 6 categorias, las 9 flores con sus 54 variantes de
 * color, las 6 envolturas, los 4 listones y los textos de la pagina.
 *
 * Como los archivos son TypeScript pero solo contienen objetos literales, se
 * les quitan los tipos (que no existen en tiempo de ejecucion) y se evaluan.
 * Es mas fiable que analizarlos con expresiones regulares y mucho mas corto
 * que montar un compilador para algo que se corre una vez.
 *
 *   node scripts/exportar_datos_frontend.mjs > datos_iniciales.json
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DATA = join(AQUI, '..', '..', 'frontend', 'src')

/**
 * Evalua un modulo TS de puros literales y devuelve las constantes pedidas.
 *
 * `cortarEn` recorta el archivo antes de evaluarlo. Hace falta porque algun
 * modulo mezcla los datos con funciones tipadas (`site.ts` trae los textos de
 * WhatsApp como funciones), y una anotacion en los parametros no se puede
 * quitar con las reglas de arriba sin romper otra cosa. Como esas funciones no
 * se necesitan aqui, sale mas barato cortar por lo sano.
 */
function leerModulo(rutaRelativa, nombres, cortarEn = null) {
  let codigo = readFileSync(join(DATA, rutaRelativa), 'utf8')
  if (cortarEn) {
    const corte = codigo.indexOf(cortarEn)
    if (corte === -1) throw new Error(`No se encontro el corte ${cortarEn} en ${rutaRelativa}`)
    codigo = codigo.slice(0, corte)
  }

  // 1. fuera los imports: solo traian tipos, que ya no hacen falta
  codigo = codigo.replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, '')
  // 2. fuera las declaraciones de tipos e interfaces
  codigo = codigo.replace(/^export\s+interface\s+\w+\s*\{[\s\S]*?^\}/gm, '')
  codigo = codigo.replace(/^export\s+type\s+[\s\S]*?$/gm, '')
  // 3. la anotacion de tipo de cada constante: "export const x: T[] =" -> "const x ="
  codigo = codigo.replace(/^export\s+const\s+(\w+)\s*:[^=]+=/gm, 'const $1 =')
  codigo = codigo.replace(/^export\s+const\s+(\w+)\s*=/gm, 'const $1 =')
  // 4. aserciones sueltas dentro de los literales
  codigo = codigo.replace(/\s+as\s+Record<[^>]*>/g, '')
  codigo = codigo.replace(/\s+satisfies\s+\w+/g, '')

  const fabrica = new Function(`${codigo}\n;return { ${nombres.join(', ')} };`)
  return fabrica()
}

/** PascalCase de lucide-react al nombre en guiones que usa el modelo. */
const aKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// ------------------------------------------------------------------ catalogo

const { categories } = leerModulo('data/categories.ts', ['categories'])
const { products } = leerModulo('data/products.ts', ['products'])

// ------------------------------------------------------------------ armador

const { flowerAssets, wrapperAssets, ribbonAssets, flowerColorVariants, flowerColors } =
  leerModulo('data/builder.ts', [
    'flowerAssets',
    'wrapperAssets',
    'ribbonAssets',
    'flowerColorVariants',
    'flowerColors',
  ])

// ------------------------------------------------------------------ contenido

const { site } = leerModulo('data/site.ts', ['site'], 'export const whatsappMessages')
const { ayudaItems } = leerModulo('data/ayuda.ts', ['ayudaItems'])
const { heroBouquets } = leerModulo('data/hero.ts', ['heroBouquets'])

// La galeria del inicio es una lista suelta dentro de App.tsx.
const appTsx = readFileSync(join(DATA, 'App.tsx'), 'utf8')
const bloqueGaleria = appTsx.match(/const galleryImages = \[([\s\S]*?)\]/)
const galeria = bloqueGaleria
  ? [...bloqueGaleria[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : []

// Los motivos para comprar llevan JSX (el icono es un componente), asi que
// este no se puede evaluar: se leen los tres campos con una expresion.
const valuePropsTsx = readFileSync(join(DATA, 'components/sections/ValueProps.tsx'), 'utf8')
const valueProps = [
  ...valuePropsTsx.matchAll(
    /\{\s*icon:\s*<(\w+)[^>]*\/>,\s*title:\s*'([^']+)',\s*description:\s*'([^']+)'\s*\}/g,
  ),
].map((m) => ({ icon: aKebab(m[1]), title: m[2], description: m[3] }))

const salida = {
  categories,
  products,
  flowers: flowerAssets,
  wrappers: wrapperAssets,
  ribbons: ribbonAssets,
  colorVariants: flowerColorVariants,
  colors: flowerColors,
  site,
  help: ayudaItems,
  hero: heroBouquets,
  gallery: galeria,
  valueProps,
}

const destino = join(AQUI, 'datos_iniciales.json')
writeFileSync(destino, JSON.stringify(salida, null, 2), 'utf8')

console.error('Exportado a', destino)
for (const [clave, valor] of Object.entries(salida)) {
  const cuantos = Array.isArray(valor) ? valor.length : Object.keys(valor).length
  console.error(`  ${clave.padEnd(14)} ${cuantos}`)
}
