import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-on-surface">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{description}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary mx-auto mt-1 max-w-xs">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
