// Fix #6: Panel de Call Center — ruta protegida para roles 'agente_cc' y 'admin'.
// Lista TODAS las citas con datos de contacto del paciente, usando las políticas
// RLS existentes "Admin y agente_cc pueden ver y modificar todas las citas" y
// "Admin y agente_cc acceso total a pacientes".
//
// Los filtros por estado y fecha se controlan via query params (searchParams),
// actualizados por el Client Component FiltrosCitas.tsx con router.push.

import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FiltrosCitas from './FiltrosCitas'
import { marcarHistorialClinicoRegistrado } from './actions'

// Forzar renderizado dinámico: página autenticada con filtros dinámicos (searchParams).
export const dynamic = 'force-dynamic'

// Tipo de respuesta de la query de citas con joins
type CitaCC = {
  id: string
  fecha_hora: string
  estado: string
  motivo_consulta: string
  canal_origen: string
  pacientes: {
    id: string
    nombre_completo: string
    correo: string
    telefono: string | null
    historial_clinico_veris: boolean
  } | null
  especialidades: { nombre: string } | null
  medicos: { nombre_completo: string } | null
}

// Colores por estado (patrón consistente con mis-citas y panel-medico)
function badgeEstado(estado: string) {
  switch (estado) {
    case 'confirmada':     return 'bg-green-100 text-green-700'
    case 'pendiente_pago': return 'bg-yellow-100 text-yellow-700'
    case 'cancelada':      return 'bg-red-100 text-red-600'
    case 'en_curso':       return 'bg-blue-100 text-blue-700'
    case 'finalizada':     return 'bg-gray-100 text-gray-600'
    case 'agendada':       return 'bg-purple-100 text-purple-700'
    default:               return 'bg-secondary/10 text-secondary'
  }
}

function etiquetaEstado(estado: string) {
  switch (estado) {
    case 'pendiente_pago': return 'Pendiente de Pago'
    case 'confirmada':     return 'Confirmada'
    case 'cancelada':      return 'Cancelada'
    case 'en_curso':       return 'En Curso'
    case 'finalizada':     return 'Finalizada'
    case 'agendada':       return 'Agendada'
    default:               return estado
  }
}

// En Next.js 15+, searchParams es una Promise y debe ser awaited
type SearchParams = Promise<{
  estado?: string
  desde?: string
  hasta?: string
}>

export default async function PanelCCPage({ searchParams }: { searchParams: SearchParams }) {
  // Solo agente_cc y admin pueden acceder
  const { error, status } = await verificarUsuario(['agente_cc', 'admin'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">
          Esta sección es exclusiva para agentes de Call Center y administradores.
        </p>
      </main>
    )
  }

  // Leer filtros desde query params
  const { estado, desde, hasta } = await searchParams

  const supabase = await createClient()

  // Construir query con filtros opcionales.
  // RLS "Admin y agente_cc pueden ver y modificar todas las citas" permite ver todo.
  // Los datos de pacientes (correo, teléfono) son accesibles por la política
  // "Admin y agente_cc acceso total a pacientes".
  let query = supabase
    .from('citas')
    .select(`
      id,
      fecha_hora,
      estado,
      motivo_consulta,
      canal_origen,
      pacientes(id, nombre_completo, correo, telefono, historial_clinico_veris),
      especialidades(nombre),
      medicos(nombre_completo)
    `)
    .order('fecha_hora', { ascending: false })

  if (estado) {
    query = query.eq('estado', estado)
  }
  if (desde) {
    query = query.gte('fecha_hora', desde + 'T00:00:00')
  }
  if (hasta) {
    query = query.lte('fecha_hora', hasta + 'T23:59:59')
  }

  const { data, error: citasError } = await query

  const citas = data as unknown as CitaCC[] | null

  return (
    <main className="flex flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Panel Call Center</h1>
        <p className="text-foreground/70 mt-1">
          Gestión de citas y datos de contacto de pacientes
        </p>
      </div>

      {/* Filtros (client component) — se pasan los valores actuales para inicializar los selects */}
      <FiltrosCitas
        estadoActual={estado}
        fechaDesdeActual={desde}
        fechaHastaActual={hasta}
      />

      {/* Resultado */}
      {citasError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Error al cargar las citas: {citasError.message}
        </div>
      ) : !citas || citas.length === 0 ? (
        <div className="bg-surface border border-foreground/10 p-8 rounded-xl text-center text-foreground/60">
          No hay citas que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground/50 mb-4">{citas.length} citas encontradas</p>

          <div className="grid gap-4">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="bg-white dark:bg-black/20 p-5 rounded-xl shadow-sm border border-foreground/10 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4"
              >
                {/* Información de la cita */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {/* Paciente */}
                  <div>
                    <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Paciente</p>
                    <p className="font-semibold">{cita.pacientes?.nombre_completo ?? '—'}</p>
                    <p className="text-sm text-foreground/60">{cita.pacientes?.correo ?? '—'}</p>
                    {cita.pacientes?.telefono && (
                      <p className="text-sm text-foreground/60">{cita.pacientes.telefono}</p>
                    )}
                    {cita.pacientes && !cita.pacientes.historial_clinico_veris && (
                      <form action={async () => {
                        'use server';
                        await marcarHistorialClinicoRegistrado(cita.pacientes!.id);
                      }} className="mt-2">
                        <button type="submit" className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-1 rounded hover:bg-yellow-200">
                          Marcar Historial Registrado
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Médico y especialidad */}
                  <div>
                    <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Médico</p>
                    <p className="font-semibold">
                      {cita.medicos?.nombre_completo ?? 'No asignado'}
                    </p>
                    <p className="text-sm text-foreground/60">{cita.especialidades?.nombre ?? '—'}</p>
                  </div>

                  {/* Fecha y motivo */}
                  <div>
                    <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Fecha y hora</p>
                    <p className="text-sm">
                      {new Date(cita.fecha_hora).toLocaleString('es-EC', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Motivo</p>
                    <p className="text-sm text-foreground/70 italic">{cita.motivo_consulta}</p>
                  </div>
                </div>

                {/* Estado */}
                <div className="flex sm:flex-col items-start sm:items-end gap-2">
                  <span
                    className={`font-semibold px-3 py-1 rounded-md uppercase text-xs tracking-wider ${badgeEstado(cita.estado)}`}
                  >
                    {etiquetaEstado(cita.estado)}
                  </span>
                  <span className="text-xs text-foreground/40">{cita.canal_origen}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
