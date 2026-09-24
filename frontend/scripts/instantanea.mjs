/**
 * Guarda una copia del catalogo publico dentro de la tienda.
 *
 * Corre solo antes de cada `npm run build`. Pide a la API en produccion lo
 * mismo que pide la tienda al abrirse (el inicio, los productos y el armador)
 * y lo deja en src/data/instantanea.json, que entra en el javascript.
 *
 * Existe porque el servidor gratuito se duerme: mientras despierta, la tienda
 * se pinta con esta copia en vez de quedarse en blanco, y en cuanto la API
 * responde se cambia por la version en vivo.
 *
 * Si la API no responde, o responde con el catalogo vacio, se conserva la
 * copia anterior y la compilacion sigue. Una tienda con la copia de ayer es
 * mucho mejor que una compilacion rota, o que una copia vacia que dejaria la
 * tienda en blanco justo cuando mas falta hace.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const destino = join(raiz, 'src', 'data', 'instantanea.json')

// Mismas rutas que usa la tienda. Si se agrega una pantalla publica nueva que
// lea de la API, va aqui tambien.
const RUTAS = {
  bootstrap: '/bootstrap/',
  productos: '/catalog/products/',
  armador: '/builder/bundle/',
}

// El servidor dormido tarda casi un minuto en despertar.
const ESPERA_MS = 100_000

async function direccionApi() {
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL
  const texto = await readFile(join(raiz, '.env.production'), 'utf8')
  const linea = texto.split(/\r?\n/).find((l) => l.startsWith('VITE_API_URL='))
  if (!linea) throw new Error('no hay VITE_API_URL en .env.production')
  return linea.slice('VITE_API_URL='.length).trim()
}

async function pedir(base, ruta) {
  const respuesta = await fetch(base + ruta, {
    signal: AbortSignal.timeout(ESPERA_MS),
    headers: { Accept: 'application/json' },
  })
  if (!respuesta.ok) throw new Error(`${ruta} respondio ${respuesta.status}`)
  return respuesta.json()
}

/** Lo minimo para que la copia sirva: si falta algo de esto, no se guarda. */
function vacia(datos) {
  const productos = Array.isArray(datos.productos)
    ? datos.productos
    : (datos.productos?.results ?? [])
  if (!datos.bootstrap?.categories?.length) return 'no trae categorias'
  if (!productos.length) return 'no trae productos'
  if (!datos.armador?.flowers?.length) return 'no trae flores'
  if (!datos.armador?.wrappers?.length) return 'no trae envolturas'
  return null
}

async function main() {
  let base
  try {
    base = await direccionApi()
  } catch (fallo) {
    console.warn(`instantanea: se conserva la anterior (${fallo.message})`)
    return
  }

  console.log(`instantanea: pidiendo el catalogo a ${base} ...`)
  const inicio = Date.now()
  try {
    const entradas = await Promise.all(
      Object.entries(RUTAS).map(async ([nombre, ruta]) => [nombre, await pedir(base, ruta)]),
    )
    const datos = Object.fromEntries(entradas)

    const motivo = vacia(datos)
    if (motivo) {
      console.warn(`instantanea: la API ${motivo}; se conserva la anterior`)
      return
    }

    const copia = { generada: new Date().toISOString(), ...datos }
    await writeFile(destino, JSON.stringify(copia) + '\n', 'utf8')
    const segundos = ((Date.now() - inicio) / 1000).toFixed(1)
    console.log(`instantanea: guardada (${segundos} s)`)
  } catch (fallo) {
    console.warn(`instantanea: la API no respondio (${fallo.message}); se conserva la anterior`)
  }
}

await main()
