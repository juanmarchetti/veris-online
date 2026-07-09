import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { expirarPagosPendientes } from '@/utils/expirarPagos'
import Link from 'next/link'
import { AlertTriangle, CalendarPlus, ClipboardList, FileText, Video } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

type CitaRespuesta = {
  id: string
  fecha_hora: string
  estado: string
  requiere_valoracion_presencial: boolean
  especialidades: { nombre: string } | null
  medicos: { nombre_completo: string } | null
}

function badgeEstado(estado: string) {
  switch (estado) {
    case 'confirmada':
      return 'bg-green-100 text-green-700'
    case 'pendiente_pago':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelada':
      return 'bg-red-100 text-red-700'
    case 'en_curso':
      return 'bg-blue-100 text-blue-700'
    case 'finalizada':
      return 'bg-gray-100 text-gray-700'
    case 'agendada':
      return 'bg-primary/10 text-primary'
    default:
      return 'bg-secondary/10 text-secondary'
  }
}

function etiquetaEstado(estado: string) {
  switch (estado) {
    case 'pendiente_pago': return 'Pendiente de pago'
    case 'confirmada': return 'Confirmada'
    case 'cancelada': return 'Cancelada'
    case 'en_curso': return 'En curso'
    case 'finalizada': return 'Finalizada'
    case 'agendada': return 'Agendada'
    default: return estado
  }
}

export default async function MisCitasPage() {
  const { error, status, user } = await verificarUsuario(['paciente'])

  if (error || !user) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso denegado</h1>
        <p className="mt-4 text-center">Solo los pacientes pueden ver sus citas.</p>
      </main>
    )
  }

  await expirarPagosPendientes()

  const supabase = await createClient()

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id')
    .eq('id_auth_user', user.id)
    .single()

  if (!paciente) {
    return (
      <main className="page-shell">
        <EmptyState
          icon={ClipboardList}
          title="Perfil de paciente no encontrado"
          description="No se pudo encontrar un perfil asociado a tu usuario."
        />
      </main>
    )
  }

  const { data, error: dbError } = await supabase
    .from('citas')
    .select(`
      id,
      fecha_hora,
      estado,
      requiere_valoracion_presencial,
      especialidades(nombre),
      medicos(nombre_completo)
    `)
    .eq('id_paciente', paciente.id)
    .order('fecha_hora', { ascending: false })

  const citas = data as unknown as CitaRespuesta[] | null

  return (
    <main className="page-shell grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <span className="section-kicker">Seguimiento</span>
          <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">Mis videoconsultas</h1>
          <p className="text-sm text-on-surface-variant">Consulta tus próximas citas, pagos pendientes y accesos a Zoom.</p>
        </div>
        <div className="grid gap-2 sm:flex sm:items-center">
          <Link href="/agendar-cita" className="btn-primary w-full sm:w-auto">
            <CalendarPlus className="h-5 w-5" />
            Agendar cita
          </Link>
          <Link href="/mis-citas/historial" className="btn-outline w-full sm:w-auto">
            <FileText className="h-5 w-5" />
            Historial
          </Link>
        </div>
      </div>

      {dbError ? (
        <div className="alert-error">Error al cargar las citas: {dbError.message}</div>
      ) : !citas || citas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aún no tienes citas"
          description="Agenda tu primera videoconsulta y el sistema la mostrará aquí con su estado actualizado."
          actionHref="/agendar-cita"
          actionLabel="Agendar cita"
        />
      ) : (
        <div className="grid gap-4">
          {citas.map((cita) => (
            <article key={cita.id} className="card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`status-pill ${badgeEstado(cita.estado)}`}>
                    {etiquetaEstado(cita.estado)}
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {new Date(cita.fecha_hora).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold text-on-surface">
                  {cita.especialidades?.nombre || 'Especialidad médica'}
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Dr(a). {cita.medicos?.nombre_completo || 'No asignado'}
                </p>

                {cita.requiere_valoracion_presencial && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      <strong>Atención:</strong> Tus síntomas requieren valoración presencial. Acude a la clínica más cercana.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:min-w-40">
                {cita.estado === 'pendiente_pago' && (
                  <Link
                    href={`/pago?cita=${cita.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-yellow-600"
                  >
                    Confirmar pago
                  </Link>
                )}
                {(cita.estado === 'confirmada' || cita.estado === 'en_curso') && (
                  <Link
                    href={`/videoconsulta?cita=${cita.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-primary/90"
                  >
                    <Video className="h-4 w-4" />
                    Conectarse
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
