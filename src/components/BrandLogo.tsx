import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  compact?: boolean
  className?: string
}

function Mark() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-sm">
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 16.4L12.3 22L25 8.8"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 10.5C10.7 7.8 13.2 6.5 16.1 6.5C21.4 6.5 25.5 10.6 25.5 16C25.5 21.4 21.4 25.5 16.1 25.5C10.7 25.5 6.5 21.4 6.5 16C6.5 15 6.7 14.1 7 13.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.72"
        />
      </svg>
    </span>
  )
}

export default function BrandLogo({ href, compact = false, className = '' }: BrandLogoProps) {
  const content = (
    <>
      <Mark />
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-lg font-extrabold text-primary">Veris</span>
          <span className="text-sm font-bold text-secondary">Online</span>
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
