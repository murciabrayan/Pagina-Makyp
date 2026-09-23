import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FondoFloral } from '@/components/admin/Adornos'
import { SeccionCrud } from '@/components/admin/SeccionCrud'
import { Button } from '@/components/ui/Button'
import { EstadoCarga } from '@/components/ui/EstadoCarga'
import { ApiError, api } from '@/lib/api'
import { useContent } from '@/context/ContentContext'
import type { Campo } from '@/components/admin/campos'
import type { Ficha } from '@/components/admin/Rejilla'

interface DatosNegocio {
  id: number
  whatsapp: string
  whatsapp_visible: string
  email: string
  instagram: string
  tiktok: string
  facebook: string
  ubicacion: string
}

interface FotoAdmin {
  id: number
  imagen_url: string
  imagen_ruta: string
  alt: string
  visible: boolean
}

interface PreguntaAdmin {
  id: number
  slug: string
  pregunta: string
  respuesta: string
  visible: boolean
}

interface MotivoAdmin {
  id: number
  icono: string
  titulo: string
  descripcion: string
  visible: boolean
}

const camposFoto: Campo[] = [
  { nombre: 'imagen', etiqueta: 'Foto', tipo: 'imagen', campoRuta: 'imagen_ruta' },
  {
    nombre: 'alt',
    etiqueta: 'Qué se ve en la foto',
    tipo: 'texto',
    ayuda: 'Lo leen los lectores de pantalla y los buscadores. Describe la foto en pocas palabras.',
  },
  { nombre: 'orden', etiqueta: 'Orden', tipo: 'numero', ancho: 'medio' },
  { nombre: 'visible', etiqueta: 'Visible', tipo: 'booleano', ancho: 'medio' },
]

const camposPregunta: Campo[] = [
  { nombre: 'pregunta', etiqueta: 'Pregunta', tipo: 'texto', requerido: true },
  {
    nombre: 'slug',
    etiqueta: 'Ancla',
    tipo: 'texto',
    requerido: true,
    ayuda: 'Va en la dirección: /ayuda#envios. Los enlaces del pie apuntan aquí, cambiarlo los rompe.',
  },
  {
    nombre: 'respuesta',
    etiqueta: 'Respuesta',
    tipo: 'area',
    requerido: true,
    ayuda: 'Un párrafo por línea.',
  },
  {
    nombre: 'puntos',
    etiqueta: 'Lista de puntos',
    tipo: 'area',
    ayuda: 'Opcional. Un punto por línea, cuando la respuesta se lee mejor como lista.',
  },
  { nombre: 'nota', etiqueta: 'Nota al pie', tipo: 'texto', ayuda: 'Opcional. Una aclaración corta.' },
  { nombre: 'orden', etiqueta: 'Orden', tipo: 'numero', ancho: 'medio' },
  { nombre: 'visible', etiqueta: 'Visible', tipo: 'booleano', ancho: 'medio' },
]

const camposMotivo: Campo[] = [
  { nombre: 'titulo', etiqueta: 'Título', tipo: 'texto', requerido: true },
  { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', requerido: true },
  {
    nombre: 'icono',
    etiqueta: 'Icono',
    tipo: 'seleccion',
    requerido: true,
    opciones: [
      { valor: 'hand-heart', etiqueta: 'Mano con corazón' },
      { valor: 'palette', etiqueta: 'Paleta de colores' },
      { valor: 'gift', etiqueta: 'Regalo' },
      { valor: 'messages-square', etiqueta: 'Mensajes' },
      { valor: 'sparkles', etiqueta: 'Destellos' },
      { valor: 'truck', etiqueta: 'Camión' },
      { valor: 'flower', etiqueta: 'Flor' },
      { valor: 'clock', etiqueta: 'Reloj' },
    ],
  },
  { nombre: 'orden', etiqueta: 'Orden', tipo: 'numero', ancho: 'medio' },
  { nombre: 'visible', etiqueta: 'Visible', tipo: 'booleano', ancho: 'medio' },
]

const fotoAFicha = (f: FotoAdmin): Ficha => ({
  id: f.id,
  imagen: f.imagen_url,
  titulo: f.alt || 'Sin descripción',
  visible: f.visible,
})

/**
 * Las preguntas y los motivos no tienen foto, asi que la ficha se apoya en el
 * texto: el titulo es la pregunta y el detalle su respuesta recortada. Es
 * suficiente para reconocerla y entrar a editarla.
 */
const preguntaAFicha = (f: PreguntaAdmin): Ficha => ({
  id: f.id,
  titulo: f.pregunta,
  detalle: f.respuesta.slice(0, 90) + (f.respuesta.length > 90 ? '…' : ''),
  visible: f.visible,
  destacado: `#${f.slug}`,
})

const motivoAFicha = (f: MotivoAdmin): Ficha => ({
  id: f.id,
  titulo: f.titulo,
  detalle: f.descripcion,
  visible: f.visible,
})

const PESTANAS = ['Datos del negocio', 'Inicio', 'Galería', 'Ayuda', 'Motivos'] as const
type Pestana = (typeof PESTANAS)[number]

export function AdminContenido() {
  const [pestana, setPestana] = useState<Pestana>('Datos del negocio')

  return (
    <div>
      <header className="relative overflow-hidden rounded-[26px] bg-grad-cta p-7 shadow-lift animate-entrar md:p-8">
        <FondoFloral />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent"
        />
        <div className="relative">
          <p className="font-script text-[24px] leading-none text-white/90">Tu página</p>
          <h1 className="mt-1 font-display text-[30px] font-extrabold leading-none text-white md:text-[38px]">
            Contenido
          </h1>
          <p className="mt-3 max-w-prose text-[14px] leading-[1.65] text-white/85">
            Los textos y las fotos de la página, y los datos con los que el cliente te escribe.
          </p>
        </div>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {PESTANAS.map((nombre) => (
          <button
            key={nombre}
            type="button"
            onClick={() => setPestana(nombre)}
            aria-pressed={pestana === nombre}
            className={`flex-none rounded-full px-4 py-2.5 text-[13.5px] font-bold transition-all ${
              pestana === nombre
                ? 'bg-grad-boton text-white shadow-boton'
                : 'border border-white/70 bg-grad-card text-ink shadow-soft hover:-translate-y-0.5 hover:text-brand-700 hover:shadow-card'
            }`}
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {pestana === 'Datos del negocio' && <FormularioNegocio />}
        {pestana === 'Inicio' && (
          <SeccionCrud<FotoAdmin>
            titulo="Fotos del inicio"
            descripcion="Los ramos que van rotando en el banner de arriba."
            ruta="/content/hero/"
            singular="foto"
            campos={camposFoto}
            aFicha={fotoAFicha}
          />
        )}
        {pestana === 'Galería' && (
          <SeccionCrud<FotoAdmin>
            titulo="Galería"
            descripcion="Las fotos de la franja que invita a seguirte en Instagram."
            ruta="/content/gallery/"
            singular="foto"
            campos={camposFoto}
            aFicha={fotoAFicha}
          />
        )}
        {pestana === 'Ayuda' && (
          <SeccionCrud<PreguntaAdmin>
            titulo="Preguntas frecuentes"
            descripcion="Lo que se responde en la página de Ayuda."
            ruta="/content/help/"
            singular="pregunta"
            campos={camposPregunta}
            aFicha={preguntaAFicha}
            columnas="estrecha"
          />
        )}
        {pestana === 'Motivos' && (
          <SeccionCrud<MotivoAdmin>
            titulo="Motivos para comprar"
            descripcion="La franja de cuatro razones que aparece en el inicio."
            ruta="/content/value-props/"
            singular="motivo"
            campos={camposMotivo}
            aFicha={motivoAFicha}
            columnas="estrecha"
          />
        )}
      </div>
    </div>
  )
}

/**
 * Los datos del negocio son una sola fila, asi que no llevan tabla: se editan
 * directamente. Al guardar se refresca el contexto, porque el telefono
 * aparece en la cabecera, el pie y todos los botones de WhatsApp: si no, el
 * equipo cambiaria el numero y seguiria viendo el viejo hasta recargar.
 */
function FormularioNegocio() {
  const { recargar } = useContent()
  const [datos, setDatos] = useState<DatosNegocio | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string[]>>({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()
    api
      .get<DatosNegocio>('/content/site/actual/?admin=1', controlador.signal)
      .then((fila) => setDatos(fila))
      .catch((fallo: unknown) => {
        if (controlador.signal.aborted) return
        setError(fallo instanceof Error ? fallo.message : 'No se pudo cargar.')
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })
    return () => controlador.abort()
  }, [])

  const cambiar = (campo: keyof DatosNegocio, valor: string) => {
    setDatos((prev) => (prev ? { ...prev, [campo]: valor } : prev))
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: [] } : prev))
    setGuardado(false)
  }

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    if (!datos) return
    setGuardando(true)
    setErrores({})
    setError(null)
    try {
      const actualizado = await api.patch<DatosNegocio>('/content/site/actual/', datos)
      setDatos(actualizado)
      setGuardado(true)
      recargar()
    } catch (fallo) {
      if (fallo instanceof ApiError) {
        setErrores(fallo.campos)
        if (Object.keys(fallo.campos).length === 0) setError(fallo.message)
      } else {
        setError('No se pudo guardar.')
      }
    } finally {
      setGuardando(false)
    }
  }

  if (cargando || error || !datos) {
    return <EstadoCarga cargando={cargando} error={error} />
  }

  const campos: { clave: keyof DatosNegocio; etiqueta: string; ayuda?: string }[] = [
    {
      clave: 'whatsapp',
      etiqueta: 'WhatsApp',
      ayuda: 'Con indicativo de país, sin espacios ni signos. Ejemplo: 573203684500',
    },
    {
      clave: 'whatsapp_visible',
      etiqueta: 'WhatsApp como se muestra',
      ayuda: 'Como se lee en la página. Ejemplo: +57 320 368 4500',
    },
    { clave: 'email', etiqueta: 'Correo' },
    { clave: 'instagram', etiqueta: 'Instagram', ayuda: 'La dirección completa, o vacío para no mostrarlo.' },
    { clave: 'tiktok', etiqueta: 'TikTok' },
    { clave: 'facebook', etiqueta: 'Facebook' },
    { clave: 'ubicacion', etiqueta: 'Ubicación' },
  ]

  return (
    <form onSubmit={guardar} className="max-w-xl">
      <div className="grid gap-4">
        {campos.map(({ clave, etiqueta, ayuda }) => (
          <div key={clave}>
            <label htmlFor={clave} className="block text-[13px] font-semibold text-ink">
              {etiqueta}
            </label>
            {ayuda && <p className="mt-0.5 text-[12px] text-muted">{ayuda}</p>}
            <input
              id={clave}
              type="text"
              value={String(datos[clave] ?? '')}
              onChange={(e) => cambiar(clave, e.target.value)}
              className={`mt-1.5 w-full rounded-sm border bg-white px-3 py-2 text-[14px] text-ink focus-visible:border-brand-500 ${
                errores[clave]?.[0] ? 'border-brand-700' : 'border-line'
              }`}
            />
            {errores[clave]?.[0] && (
              <p role="alert" className="mt-1 text-[12px] font-semibold text-brand-700">
                {errores[clave][0]}
              </p>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-blush-100 px-3 py-2 text-[13px] text-ink">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" variant="primary">
          {guardando ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Guardando…
            </span>
          ) : (
            'Guardar cambios'
          )}
        </Button>
        {guardado && (
          <span role="status" className="text-[13px] font-semibold text-brand-700">
            Guardado.
          </span>
        )}
      </div>
    </form>
  )
}
