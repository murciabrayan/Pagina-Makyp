import { useEffect, useRef } from 'react'

const FOCUSABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Deja el foco encerrado dentro de una capa abierta (menú o ventana).
 *
 * Sin esto, tabular desde un modal abierto pasea por los enlaces de la página
 * que quedó detrás: para quien navega con teclado o con lector de pantalla el
 * foco desaparece bajo la cortina y no hay forma de saber dónde está.
 *
 * Hace tres cosas:
 * 1. Al abrir, recuerda quién tenía el foco y lo lleva al primer elemento de
 *    la capa (o a la capa misma, si no tiene ninguno).
 * 2. Mientras está abierta, el Tab da la vuelta dentro de ella.
 * 3. Al cerrar, devuelve el foco a donde estaba, que suele ser el botón que
 *    la abrió. Así no se vuelve a empezar desde el principio de la página.
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!isOpen) return
    const contenedor = ref.current
    if (!contenedor) return

    const previo = document.activeElement as HTMLElement | null

    const enfocables = () =>
      Array.from(contenedor.querySelectorAll<HTMLElement>(FOCUSABLES)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )

    const primero = enfocables()[0]
    if (primero) primero.focus()
    else contenedor.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const lista = enfocables()
      if (lista.length === 0) {
        e.preventDefault()
        return
      }
      const inicio = lista[0]
      const fin = lista[lista.length - 1]
      // Con Shift se va hacia atrás: desde el primero se salta al último.
      if (e.shiftKey && document.activeElement === inicio) {
        e.preventDefault()
        fin.focus()
      } else if (!e.shiftKey && document.activeElement === fin) {
        e.preventDefault()
        inicio.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // solo si el foco sigue dentro: si el usuario ya lo movió a otra parte
      // a propósito, devolverlo sería quitárselo de las manos
      if (previo && contenedor.contains(document.activeElement)) previo.focus()
    }
  }, [isOpen])

  return ref
}
