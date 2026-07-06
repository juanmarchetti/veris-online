'use client'

// Fix #6: Client Component de filtros para el Panel de Call Center.
// Controla los query params de URL (estado, desde, hasta) que la Server Page
// panel-cc/page.tsx lee para filtrar las citas desde Supabase.
// Al cambiar filtros se usa router.push, forzando una re-renderización del Server Component.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ESTADOS_CITA = [
  { value: '', label: 'Todos los estados' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'pendiente_pago', label: 'Pendiente de Pago' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' },
]

type Props = {
  estadoActual?: string
  fechaDesdeActual?: string
  fechaHastaActual?: string
}

export default function FiltrosCitas({ estadoActual, fechaDesdeActual, fechaHastaActual }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState(estadoActual ?? '')
  const [fechaDesde, setFechaDesde] = useState(fechaDesdeActual ?? '')
  const [fechaHasta, setFechaHasta] = useState(fechaHastaActual ?? '')

  const aplicarFiltros = () => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    if (fechaDesde) params.set('desde', fechaDesde)
    if (fechaHasta) params.set('hasta', fechaHasta)
    const qs = params.toString()
    router.push(`/panel-cc${qs ? '?' + qs : ''}`)
  }

  const limpiarFiltros = () => {
    setEstado('')
    setFechaDesde('')
    setFechaHasta('')
    router.push('/panel-cc')
  }

  return (
    <div className="bg-white dark:bg-black/20 p-5 rounded-xl border border-foreground/10 mb-8">
      <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-4">Filtros</p>

      <div className="flex flex-wrap gap-4 items-end">
        {/* Filtro por estado */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-estado" className="text-sm font-medium">
            Estado
          </label>
          <select
            id="filtro-estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-black text-sm min-w-[180px]"
          >
            {ESTADOS_CITA.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro fecha desde */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-desde" className="text-sm font-medium">
            Desde
          </label>
          <input
            id="filtro-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-black text-sm"
          />
        </div>

        {/* Filtro fecha hasta */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-hasta" className="text-sm font-medium">
            Hasta
          </label>
          <input
            id="filtro-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-black text-sm"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button
            onClick={aplicarFiltros}
            className="bg-primary text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Filtrar
          </button>
          <button
            onClick={limpiarFiltros}
            className="bg-foreground/10 text-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-foreground/20 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}
