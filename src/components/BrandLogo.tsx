import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  compact?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: {
    mark: 'h-9 w-9',
    icon: 'h-6 w-6',
    name: 'text-base',
    suffix: 'text-xs',
  },
  md: {
    mark: 'h-11 w-11',
    icon: 'h-7 w-7',
    name: 'text-lg',
    suffix: 'text-sm',
  },
  lg: {
    mark: 'h-14 w-14',
    icon: 'h-9 w-9',
    name: 'text-2xl',
    suffix: 'text-base',
  },
}

function Mark({ size = 'md' }: { size?: BrandLogoProps['size'] }) {
  const s = sizes[size ?? 'md']

  return (
    <span className={`relative grid ${s.mark} shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-white shadow-sm`}>
      <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0)_58%)]" />
      <svg
        aria-hidden="true"
        className={`${s.icon} relative`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 34C20 34 8 27.2 8 16.6C8 11.8 11.5 8 16 8C18.2 8 19.4 9 20 9.8C20.6 9 21.8 8 24 8C28.5 8 32 11.8 32 16.6C32 27.2 20 34 20 34Z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M8 20H14.2L17.2 13L22.5 28L25.6 20H32"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28.5 10.8C30.7 12.2 32 14.5 32 17.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.72"
        />
      </svg>
    </span>
  )
}

export default function BrandLogo({ href, compact = false, className = '', size = 'md' }: BrandLogoProps) {
  const s = sizes[size]
  const content = (
    <>
      <Mark size={size} />
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={`${s.name} font-extrabold text-primary`}>Veris</span>
          <span className={`${s.suffix} font-extrabold text-secondary`}>Online</span>
        </span>
      )}
    </>
  )

  const classes = `inline-flex items-center gap-3 text-left no-underline ${className}`

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="Veris Online">
        {content}
      </Link>
    )
  }

  return (
    <span className={classes} aria-label="Veris Online">
      {content}
    </span>
  )
}
