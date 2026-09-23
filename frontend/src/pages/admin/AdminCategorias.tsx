import { SeccionCrud } from '@/components/admin/SeccionCrud'
import type { Campo } from '@/components/admin/campos'
import type { Ficha } from '@/components/admin/Rejilla'
import type { CategoriaAdmin } from '@/types'

const campos: Campo[] = [
  { nombre: 'titulo', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
  {
    nombre: 'subtitulo',
    etiqueta: 'Subtítulo',
    tipo: 'texto',
    ayuda: 'La línea pequeña bajo el nombre, en el inicio.',
  },
  { nombre: 'imagen', etiqueta: 'Foto', tipo: 'imagen', campoRuta: 'imagen_ruta' },
  {
    nombre: 'slug',
    etiqueta: 'Dirección',
    tipo: 'texto',
    requerido: true,
    ayuda: 'Va en el enlace: /tienda?categoria=ramos. Cambiarlo rompe los enlaces que ya circulan.',
  },
  {
    nombre: 'visible',
    etiqueta: 'Visible',
    tipo: 'booleano',
    ayuda: 'Si la escondes, desaparece del menú, del inicio y del pie.',
  },
]

const aFicha = (fila: CategoriaAdmin): Ficha => ({
  id: fila.id,
  imagen: fila.imagen_url,
  titulo: fila.titulo,
  detalle: fila.subtitulo,
  visible: fila.visible,
  destacado:
    fila.productos_count === 0 ? 'Sin productos' : `${fila.productos_count} productos`,
})

export function AdminCategorias() {
  return (
    <SeccionCrud<CategoriaAdmin>
      titulo="Categorías"
      descripcion="Los grupos del menú y del inicio. Una categoría sin productos lleva al cliente a una pantalla vacía: agrégale productos o escóndela."
      ruta="/catalog/categories/"
      singular="categoría"
      campos={campos}
      aFicha={aFicha}
      columnas="estrecha"
    />
  )
}
