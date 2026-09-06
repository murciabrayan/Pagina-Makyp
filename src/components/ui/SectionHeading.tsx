import type { SectionHeadingProps } from '@/types'

export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        align === 'center' ? 'flex-col items-center text-center' : 'flex-col sm:flex-row sm:items-center items-start'
      } ${className}`}
    >
      <h2
        id={id}
        className="font-display text-[24px] md:text-[30px] font-bold leading-[1.2] tracking-[-0.01em] text-brand-900 flex items-center gap-2.5"
      >
        {eyebrow}
        {title}
      </h2>
      {action}
    </div>
  )
}
