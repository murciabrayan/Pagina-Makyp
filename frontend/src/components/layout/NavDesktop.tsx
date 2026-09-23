import { Link } from 'react-router-dom'
import { Flower2 } from 'lucide-react'
import { useGoToContact } from '@/lib/useGoToContact'
import { useViewTransition } from '@/lib/useViewTransition'
import type { NavDesktopProps } from '@/types'

export function NavDesktop({ links, activeHref }: NavDesktopProps) {
  const goToContact = useGoToContact()
  const navegarConTransicion = useViewTransition()

  return (
    <nav className="hidden lg:flex items-center gap-8">
      {links.map((link) => {
        const isActive = link.href === activeHref
        const isAnchor = link.href.startsWith('#')
        const linkClassName = `relative flex items-center gap-1.5 text-[16px] leading-none font-semibold transition-colors duration-150 ${
          isActive ? 'text-brand-700' : 'text-ink hover:text-brand-700'
        }`

        const linkContent = (
          <>
            {link.icon === 'flower' && <Flower2 size={15} className="text-peri-500" aria-hidden="true" />}
            {link.label}
            {isActive && (
              <span
                className="absolute left-0 -bottom-2 h-0.5 w-full rounded-full bg-brand-700"
                aria-hidden="true"
              />
            )}
          </>
        )

        if (isAnchor) {
          return (
            <a key={link.href} href={link.href} onClick={goToContact} className={linkClassName}>
              {linkContent}
            </a>
          )
        }

        return (
          // sigue siendo un enlace de verdad (se puede abrir en otra pestaña),
          // pero al hacer clic normal el navegador funde entre páginas
          <Link
            key={link.href}
            to={link.href}
            onClick={navegarConTransicion(link.href)}
            className={linkClassName}
          >
            {linkContent}
          </Link>
        )
      })}
    </nav>
  )
}
