/**
 * Adornos del panel.
 *
 * El panel es la trastienda de una marca de flores hechas a mano, y hasta
 * ahora se veia como cualquier tablero: rectangulos y numeros. Estos trazos
 * —petalos, una ramita, un lazo— lo atan a la tienda que administra, sin
 * robarle sitio al contenido.
 *
 * Van en SVG y no en imagenes porque pesan unos cientos de bytes, se pintan
 * nitidos a cualquier tamano y toman el color del texto donde se coloquen, de
 * modo que combinan solos con la paleta.
 *
 * Todos llevan `aria-hidden`: no dicen nada que un lector de pantalla deba
 * anunciar, y nombrarlos solo alargaria la lectura de cada pantalla.
 */

interface PropsAdorno {
  className?: string
}

/** Flor abierta de cinco pétalos, vista de frente. */
export function Petalos({ className = '' }: PropsAdorno) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      {[0, 72, 144, 216, 288].map((giro) => (
        <ellipse
          key={giro}
          cx="50"
          cy="30"
          rx="14"
          ry="21"
          fill="currentColor"
          transform={`rotate(${giro} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="9" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

/** Ramita con hojas, para las esquinas. */
export function Ramita({ className = '' }: PropsAdorno) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <path
        d="M20 92 C 34 68, 46 44, 62 14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[
        { x: 30, y: 74, g: -34 },
        { x: 39, y: 58, g: 36 },
        { x: 47, y: 43, g: -30 },
        { x: 55, y: 28, g: 34 },
      ].map((hoja) => (
        <ellipse
          key={`${hoja.x}-${hoja.y}`}
          cx={hoja.x}
          cy={hoja.y}
          rx="13"
          ry="6.5"
          fill="currentColor"
          opacity="0.75"
          transform={`rotate(${hoja.g} ${hoja.x} ${hoja.y})`}
        />
      ))}
    </svg>
  )
}

/** Lazo, como el que amarra los ramos. */
export function Lazo({ className = '' }: PropsAdorno) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
      <path
        d="M50 50 C 30 30, 8 34, 12 52 C 15 68, 38 62, 50 50 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M50 50 C 70 30, 92 34, 88 52 C 85 68, 62 62, 50 50 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M47 52 C 42 68, 36 78, 30 88"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M53 52 C 58 68, 64 78, 70 88"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="7" fill="currentColor" />
    </svg>
  )
}

/**
 * El fondo decorativo de una cabecera.
 *
 * Reparte tres adornos muy tenues por las esquinas y los mueve despacio. El
 * movimiento se apaga solo con `motion-safe` cuando el sistema pide menos
 * animacion, que es lo que corresponde: esto es adorno, no informacion.
 */
export function FondoFloral({ className = '' }: PropsAdorno) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <Petalos className="absolute -right-6 -top-10 h-36 w-36 text-brand-300/25 motion-safe:animate-deriva" />
      <Ramita className="absolute -bottom-8 right-24 h-28 w-28 text-brand-500/15 motion-safe:animate-deriva [animation-delay:-5s]" />
      <Lazo className="absolute -left-8 bottom-2 h-24 w-24 text-blush-300/25 motion-safe:animate-deriva [animation-delay:-9s]" />
    </div>
  )
}
