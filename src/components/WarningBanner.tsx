'use client'

import { AlertTriangle } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function WarningBanner() {
  const pathname = usePathname()

  if (pathname?.startsWith('/panel-medico') || pathname?.startsWith('/panel-cc') || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className="sticky top-0 z-50 flex min-h-8 items-center justify-center gap-2 bg-error px-3 py-2 text-center text-xs font-bold text-on-error sm:text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Este servicio no debe usarse en caso de urgencias o emergencias</span>
    </div>
  )
}
