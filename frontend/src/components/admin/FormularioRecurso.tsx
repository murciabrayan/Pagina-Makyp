import { useEffect, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { Ventana } from './Ventana'
import { prepararEnvio, valoresVacios, type Campo } from './campos'

interface Props {
  titulo: string
  subtitulo?: string
  campos: Campo[]
  /** Fila que se está editando. Sin ella, el formulario crea una nueva. */
  inicial?: Record<string, unknown> | null
  guardando: boolean
  onGuardar: (datos: FormData | Record<string, unknown>) => Promise<unknown>
  onCerrar: () => void
}

/**
 * El aspecto de un campo donde se escribe.
 *
 * Lleva un fondo levemente mas oscuro que la tarjeta y una sombra interior
 * de un pixel. Eso es lo que lo hace leer como un hueco donde meter algo, en
 * vez de un rectangulo dibujado encima: un campo blanco sobre una tarjeta
 * blanca solo se distingue por su borde, y el borde se pierde en pantallas
 * con poco contraste.
 */
const CONTROL =
  'w-full rounded-[12px] border border-line bg-grad-campo px-4 py-3 text-[14px] text-ink ' +
  'shadow-[inset_0_1px_2px_rgba(63,49,112,0.06)] transition-all duration-200 ' +
  'placeholder:text-muted/70 hover:border-brand-300 focus:border-brand-500 focus:bg-white ' +
  'focus:outline-none focus:ring-4 focus:ring-brand-700/10'

/**
 * La ventana donde se crea o se edita algo.
 *
 * Está armada en tres franjas —cabecera, cuerpo y pie— y el **scroll vive en
 * el cuerpo**, no en la ventana entera. Esa es la diferencia que importa: un
 * formulario largo como el de una flor tiene quince campos, y si la ventana
 * crece entera, los botones de guardar quedan empujados fuera de la pantalla
 * y hay que adivinar que existen. Así, el pie con "Guardar" está siempre a la
 * vista por muy largo que sea el formulario.
 */
export function FormularioRecurso({
  titulo,
  subtitulo,
  campos,
  inicial,
  guardando,
  onGuardar,
  onCerrar,
}: Props) {
  const [valores, setValores] = useState<Record<string, unknown>>(() => ({
    ...valoresVacios(campos),
    ...(inicial ?? {}),
  }))
  const [errores, setErrores] = useState<Record<string, string[]>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const cambiar = (nombre: string, valor: unknown) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }))
    // el error deja de tener sentido en cuanto se toca el campo
    setErrores((prev) => (prev[nombre] ? { ...prev, [nombre]: [] } : prev))
  }

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setErrores({})
    setErrorGeneral(null)
    try {
      await onGuardar(prepararEnvio(campos, valores))
      onCerrar()
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        setErrores(fallo.campos)
        const tieneCampos = Object.keys(fallo.campos).length > 0
        if (!tieneCampos) setErrorGeneral(fallo.message)
        else {
          // El primer campo con error puede estar fuera de la vista en un
          // formulario largo: sin esto parece que el guardado no hizo nada.
          const primero = Object.keys(fallo.campos)[0]
          requestAnimationFrame(() => {
            document.getElementById(`campo-${primero}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            })
          })
        }
      } else {
        setErrorGeneral('No se pudo guardar. Revisa la conexión e inténtalo otra vez.')
      }
    }
  }

  const pie = (
    <div className="flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onCerrar}
        className="rounded-full px-5 py-2.5 text-[13.5px] font-bold text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="formulario-recurso"
        disabled={guardando}
        className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-grad-boton px-6 py-3 text-[13.5px] font-bold text-white shadow-boton transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 disabled:opacity-60"
      >
        {guardando ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Guardando…
          </>
        ) : (
          'Guardar'
        )}
      </button>
    </div>
  )

  return (
    <Ventana titulo={titulo} subtitulo={subtitulo} pie={pie} onCerrar={onCerrar}>
      {errorGeneral && (
        <p
          role="alert"
          className="mb-5 rounded-[13px] border border-blush-300 bg-blush-100/70 px-4 py-3 text-[13px] text-ink"
        >
          {errorGeneral}
        </p>
      )}

      <form id="formulario-recurso" onSubmit={enviar} className="flex flex-col gap-4">
        {campos.map((campo) => {
          const error = errores[campo.nombre]?.[0]
          const id = `campo-${campo.nombre}`

          return (
            <div key={campo.nombre} className="rounded-[16px] border border-line/70 bg-white p-4">
              <label htmlFor={id} className="block text-[13px] font-bold text-ink">
                {campo.etiqueta}
                {campo.requerido && <span className="text-brand-700"> *</span>}
              </label>

              {campo.ayuda && (
                <p className="mt-0.5 text-[12px] leading-[1.5] text-muted">{campo.ayuda}</p>
              )}

              <div className="mt-2">
                <Control
                  id={id}
                  campo={campo}
                  valor={valores[campo.nombre]}
                  rutaActual={campo.campoRuta ? String(valores[campo.campoRuta] ?? '') : ''}
                  onCambiar={cambiar}
                  invalido={Boolean(error)}
                />
              </div>

              {error && (
                <p role="alert" className="mt-1.5 text-[12px] font-semibold text-brand-700">
                  {error}
                </p>
              )}
            </div>
          )
        })}
      </form>
    </Ventana>
  )
}

function Control({
  id,
  campo,
  valor,
  rutaActual,
  onCambiar,
  invalido,
}: {
  id: string
  campo: Campo
  valor: unknown
  rutaActual: string
  onCambiar: (nombre: string, valor: unknown) => void
  invalido: boolean
}) {
  const borde = invalido ? ' !border-brand-700 ring-4 ring-brand-700/10' : ''

  switch (campo.tipo) {
    case 'area':
      return (
        <textarea
          id={id}
          rows={4}
          value={String(valor ?? '')}
          required={campo.requerido}
          onChange={(e) => onCambiar(campo.nombre, e.target.value)}
          className={CONTROL + ' resize-y leading-[1.6]' + borde}
        />
      )

    case 'booleano':
      return (
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={Boolean(valor)}
          onClick={() => onCambiar(campo.nombre, !valor)}
          className={`inline-flex items-center gap-2.5 rounded-full border px-3 py-2 text-[13px] font-bold transition-colors ${
            valor
              ? 'border-brand-700 bg-brand-50 text-brand-900'
              : 'border-line bg-white text-muted'
          }`}
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              valor ? 'bg-brand-700' : 'bg-brand-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                valor ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
          {valor ? 'Sí' : 'No'}
        </button>
      )

    case 'seleccion':
      return (
        <select
          id={id}
          value={String(valor ?? '')}
          required={campo.requerido}
          onChange={(e) => onCambiar(campo.nombre, e.target.value)}
          className={CONTROL + ' cursor-pointer' + borde}
        >
          <option value="">— Elige una opción —</option>
          {campo.opciones?.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      )

    case 'color':
      return (
        <div className="flex items-center gap-2.5">
          <input
            id={id}
            type="color"
            value={String(valor || '#cccccc')}
            onChange={(e) => onCambiar(campo.nombre, e.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-[10px] border border-line bg-white p-1"
          />
          <input
            type="text"
            value={String(valor ?? '')}
            onChange={(e) => onCambiar(campo.nombre, e.target.value)}
            aria-label={`${campo.etiqueta} en hexadecimal`}
            className={CONTROL + ' font-mono' + borde}
          />
        </div>
      )

    case 'numero':
    case 'decimal':
      return (
        <input
          id={id}
          type="number"
          step={campo.tipo === 'decimal' ? 'any' : '1'}
          value={String(valor ?? '')}
          required={campo.requerido}
          onChange={(e) =>
            onCambiar(campo.nombre, e.target.value === '' ? '' : Number(e.target.value))
          }
          className={CONTROL + borde}
        />
      )

    case 'imagen':
      return (
        <ControlImagen
          id={id}
          campo={campo}
          archivo={valor instanceof File ? valor : null}
          rutaActual={rutaActual}
          onCambiar={onCambiar}
          invalido={invalido}
        />
      )

    default:
      return (
        <input
          id={id}
          type="text"
          value={String(valor ?? '')}
          required={campo.requerido}
          onChange={(e) => onCambiar(campo.nombre, e.target.value)}
          className={CONTROL + borde}
        />
      )
  }
}

/**
 * Subir una foto, o dejar la que ya está.
 *
 * Muestra las dos vías porque las dos existen de verdad: las fotos que ya
 * venían con el sitio viven en el frontend y se referencian por su ruta,
 * mientras que las nuevas se suben. Quien administra no tiene por qué saber
 * esa diferencia, así que ve una vista previa igual en ambos casos.
 */
function ControlImagen({
  id,
  campo,
  archivo,
  rutaActual,
  onCambiar,
  invalido,
}: {
  id: string
  campo: Campo
  archivo: File | null
  rutaActual: string
  onCambiar: (nombre: string, valor: unknown) => void
  invalido: boolean
}) {
  const [vistaPrevia, setVistaPrevia] = useState<string>('')

  useEffect(() => {
    if (!archivo) {
      setVistaPrevia('')
      return
    }
    const url = URL.createObjectURL(archivo)
    setVistaPrevia(url)
    // sin esto el navegador se queda con la imagen en memoria por cada
    // archivo que se elija, y en una sesión larga de carga son muchos
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  const aMostrar = vistaPrevia || rutaActual

  return (
    <div
      className={`flex items-start gap-4 rounded-[12px] border border-dashed p-3 transition-colors ${
        invalido ? 'border-brand-700 bg-blush-100/40' : 'border-brand-300 bg-brand-50/50'
      }`}
    >
      <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-line bg-white">
        {aMostrar ? (
          <img src={aMostrar} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="px-1 text-center text-[10.5px] leading-tight text-muted">Sin foto</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-300 bg-white px-4 py-2 text-[13px] font-bold text-brand-700 transition-colors hover:border-brand-700 hover:bg-brand-50"
        >
          <Upload size={15} />
          {archivo ? 'Cambiar foto' : 'Elegir una foto'}
        </label>

        {archivo && (
          <p className="mt-1.5 truncate text-[12px] text-muted" title={archivo.name}>
            {archivo.name}
          </p>
        )}

        <input
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onCambiar(campo.nombre, e.target.files?.[0] ?? null)}
        />

        {campo.campoRuta && (
          <input
            type="text"
            value={rutaActual}
            onChange={(e) => onCambiar(campo.campoRuta!, e.target.value)}
            placeholder="o la ruta de una foto del sitio: /products/3.webp"
            aria-label="Ruta de una foto que ya está en el sitio"
            className="mt-2 w-full rounded-[10px] border border-line bg-white px-3 py-2 text-[12.5px] text-ink focus:border-brand-500 focus:outline-none"
          />
        )}

        {archivo && (
          <button
            type="button"
            onClick={() => onCambiar(campo.nombre, null)}
            className="mt-2 text-[12px] font-bold text-muted hover:text-brand-700"
          >
            Quitar la foto elegida
          </button>
        )}
      </div>
    </div>
  )
}
