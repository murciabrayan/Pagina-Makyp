import type { IconBadgeProps } from '@/types'

export function IconBadge({ icon, size = 20, className = '' }: IconBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center text-brand-700 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}
