/**
 * La descripcion de un formulario del panel.
 *
 * Cada entidad (producto, flor, envoltura…) se declara como una lista de
 * campos y el resto lo hace `FormularioRecurso`: pinta los controles, arma el
 * envio y coloca los errores que devuelve el backend junto al campo que los
 * causo. Declararlo asi, y no escribir diez formularios a mano, es lo que
 * mantiene el panel consistente: todos validan, avisan y guardan igual.
 */

export type TipoCampo =
  | 'texto'
  | 'area'
  | 'numero'
  | 'decimal'
  | 'imagen'
  | 'seleccion'
  | 'booleano'
  | 'color'
  | 'slug'

export interface Campo {
  nombre: string
  etiqueta: string
  tipo: TipoCampo
  ayuda?: string
  requerido?: boolean
  opciones?: { valor: string; etiqueta: string }[]
  /** Solo para imagen: el campo hermano donde va la ruta de la foto ya existente. */
  campoRuta?: string
  /** Ancho dentro de la rejilla del formulario. */
  ancho?: 'completo' | 'medio'
}

export interface Columna<T> {
  clave: string
  etiqueta: string
  /** Cómo se pinta la celda. Por defecto, el valor tal cual. */
  render?: (fila: T) => React.ReactNode
}

/**
 * Convierte los valores del formulario en lo que se manda a la API.
 *
 * Si hay algun archivo se manda `FormData`, porque un archivo no cabe en
 * JSON. Si no, se manda JSON, que es mas facil de leer al depurar. Los campos
 * de imagen vacios se omiten: mandarlos en blanco le diria al backend que
 * borre la foto que ya tenia.
 */
export function prepararEnvio(
  campos: Campo[],
  valores: Record<string, unknown>,
): FormData | Record<string, unknown> {
  const hayArchivos = campos.some(
    (campo) => campo.tipo === 'imagen' && valores[campo.nombre] instanceof File,
  )

  if (!hayArchivos) {
    const salida: Record<string, unknown> = {}
    for (const campo of campos) {
      const valor = valores[campo.nombre]
      if (campo.tipo === 'imagen') continue
      if (valor === undefined) continue
      salida[campo.nombre] = valor
    }
    // las rutas de imagen sí viajan: son texto
    for (const campo of campos) {
      if (campo.tipo === 'imagen' && campo.campoRuta && valores[campo.campoRuta] !== undefined) {
        salida[campo.campoRuta] = valores[campo.campoRuta]
      }
    }
    return salida
  }

  const datos = new FormData()
  for (const campo of campos) {
    const valor = valores[campo.nombre]
    if (campo.tipo === 'imagen') {
      if (valor instanceof File) datos.append(campo.nombre, valor)
      if (campo.campoRuta && typeof valores[campo.campoRuta] === 'string') {
        datos.append(campo.campoRuta, valores[campo.campoRuta] as string)
      }
      continue
    }
    if (valor === undefined || valor === null) continue
    if (typeof valor === 'boolean') datos.append(campo.nombre, valor ? 'true' : 'false')
    else datos.append(campo.nombre, String(valor))
  }
  return datos
}

/** Valores iniciales de un formulario vacío, según el tipo de cada campo. */
export function valoresVacios(campos: Campo[]): Record<string, unknown> {
  const salida: Record<string, unknown> = {}
  for (const campo of campos) {
    switch (campo.tipo) {
      case 'booleano':
        salida[campo.nombre] = true
        break
      case 'numero':
      case 'decimal':
        salida[campo.nombre] = ''
        break
      case 'imagen':
        salida[campo.nombre] = null
        if (campo.campoRuta) salida[campo.campoRuta] = ''
        break
      default:
        salida[campo.nombre] = campo.opciones?.[0]?.valor ?? ''
    }
  }
  return salida
}
