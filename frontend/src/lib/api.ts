/**
 * Cliente de la API.
 *
 * El token de acceso vive **solo en memoria**, en la variable de abajo. No se
 * guarda en localStorage a propósito: cualquier script que se cuele en la
 * página puede leer localStorage, y con el token robado se clona la sesión
 * entera. En memoria muere al cerrar la pestaña.
 *
 * Eso deja una pregunta obvia: si el token muere al recargar, ¿cómo sigue la
 * sesión iniciada? Con la cookie del refresh, que el navegador guarda y manda
 * sola, y que JavaScript no puede leer porque es httpOnly. Al arrancar, el
 * frontend llama a `/auth/refresh/` y cambia esa cookie por un token nuevo.
 *
 * Cuando una petición vuelve con 401 por token vencido, se pide uno nuevo y se
 * reintenta una sola vez. Si varias peticiones fallan a la vez, comparten el
 * mismo refresco en curso en lugar de disparar uno cada una.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

let accessToken: string | null = null
let refrescoEnCurso: Promise<string | null> | null = null

/** Avisa a la app de que la sesión se cayó, para que el panel mande al login. */
type Oyente = () => void
const oyentesSesionCaida = new Set<Oyente>()

export function alPerderSesion(oyente: Oyente): () => void {
  oyentesSesionCaida.add(oyente)
  return () => oyentesSesionCaida.delete(oyente)
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export class ApiError extends Error {
  status: number
  /** Errores por campo, tal como los devuelve el backend. */
  campos: Record<string, string[]>

  constructor(status: number, mensaje: string, campos: Record<string, string[]> = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.campos = campos
  }
}

function mensajeDe(datos: unknown, status: number): string {
  if (typeof datos === 'string' && datos) return datos
  if (datos && typeof datos === 'object') {
    const obj = datos as Record<string, unknown>
    if (typeof obj.detail === 'string') return obj.detail
    // primer error de campo que aparezca, para no dejar al usuario sin pista
    for (const valor of Object.values(obj)) {
      if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0]
    }
  }
  if (status === 401) return 'Tu sesión expiró. Vuelve a entrar.'
  if (status === 403) return 'No tienes permiso para hacer eso.'
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo.'
  return 'No se pudo completar la operación.'
}

function camposDe(datos: unknown): Record<string, string[]> {
  if (!datos || typeof datos !== 'object') return {}
  const salida: Record<string, string[]> = {}
  for (const [clave, valor] of Object.entries(datos as Record<string, unknown>)) {
    if (clave === 'detail') continue
    if (Array.isArray(valor)) salida[clave] = valor.map(String)
    else if (typeof valor === 'string') salida[clave] = [valor]
  }
  return salida
}

/** Pide un token nuevo con la cookie. Varias llamadas a la vez comparten una. */
async function refrescar(): Promise<string | null> {
  if (refrescoEnCurso) return refrescoEnCurso

  refrescoEnCurso = (async () => {
    try {
      const respuesta = await fetch(`${BASE}/auth/refresh/`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!respuesta.ok) {
        accessToken = null
        return null
      }
      const datos = (await respuesta.json()) as { access: string }
      accessToken = datos.access
      return datos.access
    } catch {
      accessToken = null
      return null
    } finally {
      refrescoEnCurso = null
    }
  })()

  return refrescoEnCurso
}

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  cuerpo?: unknown
  /** Peticiones que no deben intentar refrescar la sesión (el propio login). */
  sinReintento?: boolean
  signal?: AbortSignal
}

async function peticion<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, sinReintento = false, signal } = opciones

  const lanzar = async (token: string | null): Promise<Response> => {
    const cabeceras: Record<string, string> = {}
    if (token) cabeceras.Authorization = `Bearer ${token}`

    let payload: BodyInit | undefined
    if (cuerpo instanceof FormData) {
      // con FormData el navegador pone el Content-Type con su separador:
      // ponerlo a mano rompe la subida de archivos
      payload = cuerpo
    } else if (cuerpo !== undefined) {
      cabeceras['Content-Type'] = 'application/json'
      payload = JSON.stringify(cuerpo)
    }

    return fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: payload,
      credentials: 'include',
      signal,
    })
  }

  let respuesta = await lanzar(accessToken)

  if (respuesta.status === 401 && !sinReintento) {
    const nuevo = await refrescar()
    if (nuevo) {
      respuesta = await lanzar(nuevo)
    } else {
      oyentesSesionCaida.forEach((oyente) => oyente())
    }
  }

  if (respuesta.status === 204) return undefined as T

  const texto = await respuesta.text()
  const datos = texto ? JSON.parse(texto) : null

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, mensajeDe(datos, respuesta.status), camposDe(datos))
  }

  return datos as T
}

export const api = {
  get: <T,>(ruta: string, signal?: AbortSignal) => peticion<T>(ruta, { signal }),
  post: <T,>(ruta: string, cuerpo?: unknown, sinReintento = false) =>
    peticion<T>(ruta, { metodo: 'POST', cuerpo, sinReintento }),
  patch: <T,>(ruta: string, cuerpo?: unknown) => peticion<T>(ruta, { metodo: 'PATCH', cuerpo }),
  put: <T,>(ruta: string, cuerpo?: unknown) => peticion<T>(ruta, { metodo: 'PUT', cuerpo }),
  delete: <T,>(ruta: string) => peticion<T>(ruta, { metodo: 'DELETE' }),
  refrescar,
}
