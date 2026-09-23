import { Link } from 'react-router-dom'
import type { ButtonProps } from '@/types'

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden font-body font-bold transition-all duration-300 ease-out active:scale-[0.96]'

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'h-[52px] px-7 rounded-sm bg-brand-700 text-white shadow-card hover:bg-brand-900 hover:-translate-y-0.5 hover:shadow-hover hover:ring-4 hover:ring-brand-700/20',
  outline:
    'h-[52px] px-7 rounded-sm bg-white border-[1.5px] border-brand-700 text-brand-700 hover:bg-brand-700 hover:text-white hover:-translate-y-0.5 hover:shadow-hover',
  ghost: 'h-10 w-10 rounded-full text-ink hover:bg-brand-50 hover:scale-110 active:scale-95',
  whatsapp:
    'h-11 px-[22px] rounded-full bg-grad-cta text-white hover:brightness-110 hover:-translate-y-0.5 hover:shadow-hover hover:ring-4 hover:ring-wa/25',
}

const shineVariants: Array<NonNullable<ButtonProps['variant']>> = ['primary', 'whatsapp']

export function Button({
  children,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  href,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  ariaLabel,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`
  const showShine = shineVariants.includes(variant)

  const iconSpan = icon ? (
    <span
      className={`inline-flex shrink-0 transition-transform duration-300 ease-out ${
        iconPosition === 'right' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'
      }`}
    >
      {icon}
    </span>
  ) : null

  const content = (
    <>
      {showShine && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
      )}
      {iconPosition === 'left' ? iconSpan : null}
      <span className="relative">{children}</span>
      {iconPosition === 'right' ? iconSpan : null}
    </>
  )

  if (href) {
    if (href.startsWith('#')) {
      return (
        <a href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
          {content}
        </a>
      )
    }
    if (href.startsWith('/')) {
      return (
        <Link to={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
          {content}
        </Link>
      )
    }
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} className={classes} aria-label={ariaLabel}>
      {content}
    </button>
  )
}
