import { useCallback, useMemo } from 'react'
import { SeccionCrud } from '@/components/admin/SeccionCrud'
import { useRecurso } from '@/hooks/useRecurso'
import { formatCOP } from '@/lib/format'
import type { Campo } from '@/components/admin/campos'
import type { Ficha } from '@/components/admin/Rejilla'
import type { CategoriaAdmin } from '@/types'

interface ProductoAdmin {
  id: number
  nombre: string
  precio: number
  categoria: number
  categoria_nombre: string
  imagen_url: string
  imagen_ruta: string
  etiqueta: string
  descripcion: string
  incluye: string
  disponible: boolean
  orden: number
}

export function AdminProductos() {
  // Las categorías se piden aparte porque el formulario necesita ofrecerlas
  // como lista desplegable, y esa lista cambia cuando el equipo crea una.
  // Se pide en modo administración para incluir también las ocultas: un
  // producto puede pertenecer a una categoría que todavía no se publica.
  const { datos: categorias } = useRecurso<CategoriaAdmin[]>('/catalog/categories/?admin=1')

  const campos: Campo[] = useMemo(
    () => [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true },
      {
        nombre: 'imagen',
        etiqueta: 'Foto',
        tipo: 'imagen',
        campoRuta: 'imagen_ruta',
        ayuda: 'Sube una foto nueva, o escribe la ruta de una que ya esté en el sitio.',
      },
      {
        nombre: 'precio',
        etiqueta: 'Precio',
        tipo: 'numero',
        requerido: true,
        ayuda: 'En pesos, sin puntos ni decimales. Ejemplo: 45000',
      },
      {
        nombre: 'categoria',
        etiqueta: 'Categoría',
        tipo: 'seleccion',
        requerido: true,
        opciones: (categorias ?? []).map((categoria) => ({
          valor: String(categoria.id),
          // `titulo`, no `title`: la API de administración devuelve los campos
          // del modelo. Leer el nombre equivocado dejaba la lista en blanco.
          etiqueta: categoria.visible ? categoria.titulo : `${categoria.titulo} (oculta)`,
        })),
      },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'area' },
      {
        nombre: 'incluye',
        etiqueta: 'Qué incluye',
        tipo: 'area',
        ayuda: 'Opcional. Se muestra en el detalle del producto.',
      },
      {
        nombre: 'etiqueta',
        etiqueta: 'Distintivo',
        tipo: 'texto',
        ayuda: 'Opcional. Se pinta sobre la foto: "Nuevo", "Más vendido"…',
      },
      {
        nombre: 'disponible',
        etiqueta: 'Visible en la tienda',
        tipo: 'booleano',
        ayuda: 'Si lo desmarcas, deja de aparecer sin tener que borrarlo.',
      },
    ],
    [categorias],
  )

  const aFicha = useCallback(
    (fila: ProductoAdmin): Ficha => ({
      id: fila.id,
      imagen: fila.imagen_url,
      titulo: fila.nombre,
      detalle: fila.categoria_nombre,
      visible: fila.disponible,
      destacado: formatCOP(fila.precio),
    }),
    [],
  )

  return (
    <SeccionCrud<ProductoAdmin>
      titulo="Productos"
      descripcion="Lo que se ve en la tienda. Un producto oculto deja de aparecer, pero no se borra."
      ruta="/catalog/products/"
      singular="producto"
      campos={campos}
      aFicha={aFicha}
    />
  )
}
