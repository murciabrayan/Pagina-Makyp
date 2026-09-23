import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { FondoFloral } from '@/components/admin/Adornos'
import { SeccionCrud } from '@/components/admin/SeccionCrud'
import { FormularioFlor } from '@/components/admin/FormularioFlor'
import { FormularioEnvoltura } from '@/components/admin/FormularioEnvoltura'
import { FormularioListon } from '@/components/admin/FormularioListon'
import type { Campo } from '@/components/admin/campos'
import type { Ficha } from '@/components/admin/Rejilla'

interface FlorAdmin {
  id: number
  slug: string
  label: string
  rol: string
  imagen_url: string
  imagen_ruta: string
  ancho: number
  alto: number
  visible: boolean
  variantes: { id: number; color_slug: string }[]
}

interface EnvolturaAdmin {
  id: number
  slug: string
  label: string
  tamano: string
  imagen_url: string
  capacidad: number
  visible: boolean
}

interface ListonAdmin {
  id: number
  slug: string
  label: string
  imagen_url: string
  visible: boolean
}

interface ColorAdmin {
  id: number
  slug: string
  label: string
  swatch: string
  visible: boolean
}

const ROLES = [
  { valor: 'face', etiqueta: 'Al frente' },
  { valor: 'stem', etiqueta: 'Arriba, con tallo' },
  { valor: 'spike', etiqueta: 'Espiga alta' },
  { valor: 'filler', etiqueta: 'De relleno' },
  { valor: 'green', etiqueta: 'Follaje' },
]

// Las flores y las envolturas usan formularios propios, que miden la foto y
// dejan marcar sobre ella. Estas listas quedan como respaldo del generico.
const camposFlor: Campo[] = [
  { nombre: 'label', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  { nombre: 'rol', etiqueta: 'Dónde va', tipo: 'seleccion', requerido: true, opciones: ROLES },
  { nombre: 'imagen', etiqueta: 'Foto', tipo: 'imagen', campoRuta: 'imagen_ruta' },
  { nombre: 'visible', etiqueta: 'Visible', tipo: 'booleano', ancho: 'medio' },
]

const camposEnvoltura: Campo[] = [
  { nombre: 'label', etiqueta: 'Nombre', tipo: 'texto', requerido: true, ancho: 'medio' },
  { nombre: 'tamano', etiqueta: 'Tamaño', tipo: 'texto', ancho: 'medio' },
  { nombre: 'capacidad', etiqueta: 'Cuántas flores caben', tipo: 'numero', requerido: true },
  { nombre: 'imagen', etiqueta: 'Foto', tipo: 'imagen', campoRuta: 'imagen_ruta' },
  { nombre: 'visible', etiqueta: 'Visible', tipo: 'booleano', ancho: 'medio' },
]

/**
 * Los listones y los colores si caben en el formulario generico, porque lo
 * unico que necesitan de verdad es un nombre y una imagen (o un color). La
 * proporcion del liston la mide el servidor al guardarlo, y el nombre interno
 * sale del visible, asi que ninguno de los dos aparece aqui.
 */
const camposListon: Campo[] = [
  {
    nombre: 'label',
    etiqueta: 'Nombre',
    tipo: 'texto',
    requerido: true,
    ayuda: 'Como lo ve el cliente al elegir: Rosado, Azul…',
  },
  {
    nombre: 'imagen',
    etiqueta: 'Foto del listón',
    tipo: 'imagen',
    campoRuta: 'imagen_ruta',
    ayuda: 'PNG o WebP con fondo transparente. Medimos su proporción solos.',
  },
  { nombre: 'visible', etiqueta: 'Disponible para el cliente', tipo: 'booleano' },
]

const camposColor: Campo[] = [
  {
    nombre: 'label',
    etiqueta: 'Nombre',
    tipo: 'texto',
    requerido: true,
    ayuda: 'Como lo ve el cliente: Rosa, Morado, Azul…',
  },
  {
    nombre: 'swatch',
    etiqueta: 'El color',
    tipo: 'color',
    requerido: true,
    ayuda: 'El círculo que se muestra al elegir.',
  },
  { nombre: 'visible', etiqueta: 'Disponible para el cliente', tipo: 'booleano' },
]

/**
 * Como se ve cada pieza dentro de la rejilla.
 *
 * Son cuatro cosas distintas —flores, envolturas, listones y colores— y las
 * cuatro se reconocen por la imagen, no por el texto. Lo que cambia entre
 * ellas es que dato merece el hueco destacado: el papel que cumple la flor,
 * cuantas caben en la envoltura, nada en el liston.
 */
const florAFicha = (f: FlorAdmin): Ficha => ({
  id: f.id,
  imagen: f.imagen_url,
  titulo: f.label,
  detalle: `${f.variantes?.length ?? 0} colores disponibles`,
  visible: f.visible,
  destacado: ROLES.find((r) => r.valor === f.rol)?.etiqueta ?? f.rol,
})

const envolturaAFicha = (f: EnvolturaAdmin): Ficha => ({
  id: f.id,
  imagen: f.imagen_url,
  titulo: f.label,
  detalle: f.tamano,
  visible: f.visible,
  destacado: `Caben ${f.capacidad}`,
})

const listonAFicha = (f: ListonAdmin): Ficha => ({
  id: f.id,
  imagen: f.imagen_url,
  titulo: f.label,
  visible: f.visible,
})

const colorAFicha = (f: ColorAdmin): Ficha => ({
  id: f.id,
  color: f.swatch,
  titulo: f.label,
  visible: f.visible,
})

const PESTANAS = ['Flores', 'Envolturas', 'Listones', 'Colores'] as const
type Pestana = (typeof PESTANAS)[number]

export function AdminArmador() {
  const [pestana, setPestana] = useState<Pestana>('Flores')

  return (
    <div>
      <header className="relative overflow-hidden rounded-[26px] bg-grad-cta p-7 shadow-lift animate-entrar md:p-8">
        <FondoFloral />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent"
        />
        <div className="relative">
          <p className="font-script text-[24px] leading-none text-white/90">Tu taller</p>
          <h1 className="mt-1 font-display text-[30px] font-extrabold leading-none text-white md:text-[38px]">
            Armador de ramos
          </h1>
          <p className="mt-3 max-w-prose text-[14px] leading-[1.65] text-white/85">
            Las piezas con las que el cliente arma su ramo.
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-[16px] border border-white/30 bg-white/15 p-3.5 backdrop-blur-sm">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-white" aria-hidden="true" />
            <p className="text-[12.5px] leading-[1.6] text-white/90">
              <strong className="text-white">Tú subes la foto, nosotros hacemos el resto.</strong>{' '}
              Las medidas de cada flor y la proporción de cada envoltura se calculan solas al subir
              la imagen. De las envolturas solo marcas, tocando la foto, dónde se apoya el ramo y
              dónde va el lazo.
            </p>
          </div>
        </div>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {PESTANAS.map((nombre) => (
          <button
            key={nombre}
            type="button"
            onClick={() => setPestana(nombre)}
            aria-pressed={pestana === nombre}
            className={`flex-none rounded-full px-4 py-2.5 text-[13.5px] font-bold transition-all duration-200 ${
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
        {pestana === 'Flores' && (
          <SeccionCrud<FlorAdmin>
            titulo="Flores"
            descripcion="Cada flor que se puede meter en un ramo. Sube la foto y nosotros la medimos."
            ruta="/builder/flowers/"
            singular="flor"
            campos={camposFlor}
            aFicha={florAFicha}
            formulario={(props) => (
              <FormularioFlor
                inicial={props.inicial}
                guardando={props.guardando}
                onGuardar={(datos) => props.onGuardar(datos)}
                onCerrar={props.onCerrar}
              />
            )}
          />
        )}
        {pestana === 'Envolturas' && (
          <SeccionCrud<EnvolturaAdmin>
            titulo="Envolturas"
            descripcion="El papel que envuelve el ramo. Define su tamaño y cuántas flores caben."
            ruta="/builder/wrappers/"
            singular="envoltura"
            campos={camposEnvoltura}
            aFicha={envolturaAFicha}
            columnas="estrecha"
            formulario={(props) => (
              <FormularioEnvoltura
                inicial={props.inicial}
                guardando={props.guardando}
                onGuardar={(datos) => props.onGuardar(datos)}
                onCerrar={props.onCerrar}
              />
            )}
          />
        )}
        {pestana === 'Listones' && (
          <SeccionCrud<ListonAdmin>
            titulo="Listones"
            descripcion="El lazo con el que se amarra el ramo."
            ruta="/builder/ribbons/"
            singular="listón"
            campos={camposListon}
            aFicha={listonAFicha}
            formulario={(props) => (
              <FormularioListon
                inicial={props.inicial}
                guardando={props.guardando}
                onGuardar={(datos) => props.onGuardar(datos)}
                onCerrar={props.onCerrar}
              />
            )}
          />
        )}
        {pestana === 'Colores' && (
          <SeccionCrud<ColorAdmin>
            titulo="Paleta de colores"
            descripcion="Los colores que puede elegir el cliente. Para que una flor salga en un color, esa flor necesita su foto en ese color."
            ruta="/builder/colors/"
            singular="color"
            campos={camposColor}
            aFicha={colorAFicha}
          />
        )}
      </div>
    </div>
  )
}
