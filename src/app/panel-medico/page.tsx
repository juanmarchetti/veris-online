import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { ComponentType } from 'react'
import { CalendarDays, ClipboardList, Clock, Stethoscope, Video } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import AccionesCitaMedico from './AccionesCitaMedico'
import ConfiguracionHorario from './ConfiguracionHorario'
import HistorialConsultas from './HistorialConsultas'
import SolicitudesUrgentes from './SolicitudesUrgentes'

export const dynamic = 'force-dynamic'

type CitaMedico = {
  id: string
  fecha_hora: string
  estado: string
  motivo_consulta: string
  pacientes: { nombre_completo: string; correo: string } | null
  especialidades: { nombre: string } | null
  es_urgente: boolean
}

function badgeEstado(estado: string) {
  switch (estado) {
    case 'confirmada': return 'bg-green-100 text-green-700'
    case 'pendiente_pago': return 'bg-yellow-100 text-yellow-800'
    case 'cancelada': return 'bg-red-100 text-red-700'
    case 'en_curso': return 'bg-blue-100 text-blue-700'
    case 'finalizada': return 'bg-gray-100 text-gray-700'
    case 'agendada': return 'bg-primary/10 text-primary'
    default: return 'bg-secondary/10 text-secondary'
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

export default async function PanelMedicoPage() {
  const { error, status, user } = await verificarUsuario(['medico'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="page-shell">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-2xl font-extrabold text-error">Acceso denegado</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Esta sección es exclusiva para médicos.
          </p>
        </div>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: medico } = await supabase
    .from('medicos')
    .select('id, nombre_completo, hora_entrada, hora_salida, dias_laborables, especialidades(nombre)')
    .eq('id_auth_user', user!.id)
    .maybeSingle()

  if (!medico) {
    return (
      <main className="page-shell">
        <EmptyState
          icon={Stethoscope}
          title="Perfil médico no configurado"
          description="Tu cuenta tiene rol de médico, pero aún no se ha creado tu perfil clínico en el sistema."
        />
      </main>
    )
  }

  const { data, error: citasError } = await supabase
    .from('citas')
    .select(`
      id,
      fecha_hora,
      estado,
      motivo_consulta,
      es_urgente,
      pacientes(nombre_completo, correo),
      especialidades(nombre)
    `)
    .eq('id_medico', medico.id)
    .order('fecha_hora', { ascending: false })

  const especialidadMedico = (medico.especialidades as unknown as { nombre: string } | null)?.nombre
  const citas = data as unknown as CitaMedico[] | null
  const citasList = citas ?? []
  
  const solicitudesUrgentes = citasList.filter(c => c.estado === 'pendiente_aceptacion_medico' && c.es_urgente)
  const citasNormales = citasList.filter(c => c.estado !== 'pendiente_aceptacion_medico' || !c.es_urgente)

  const hoy = new Date().toISOString().slice(0, 10)
  const citasHoy = citasNormales.filter(cita => cita.fecha_hora.slice(0, 10) === hoy).length
  const citasActivas = citasNormales.filter(cita => ['confirmada', 'en_curso', 'agendada'].includes(cita.estado)).length
  const citasFinalizadas = citasNormales.filter(cita => cita.estado === 'finalizada').length

  const { data: historialData } = await supabase
    .from('historial_clinico')
    .select(`
      id,
      fecha,
      motivo_consulta,
      sintomas_reportados,
      diagnostico,
      tratamiento_indicado,
      observaciones,
      requiere_valoracion_presencial,
      pacientes(nombre_completo)
    `)
    .eq('id_medico', medico.id)
    .order('fecha', { ascending: false })

  const historial = ((historialData || []) as Array<{
    id: string
    fecha: string
    motivo_consulta: string
    sintomas_reportados: string
    diagnostico: string
    tratamiento_indicado: string
    observaciones: string
    requiere_valoracion_presencial: boolean
    pacientes?: { nombre_completo?: string } | null
  }>).map((h) => ({
    ...h,
    paciente_nombre: h.pacientes?.nombre_completo || 'Paciente desconocido'
  }))

  return (
    <main className="page-shell grid gap-8">
      <section className="grid gap-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="grid gap-2">
            <span className="section-kicker">
              <Stethoscope className="h-4 w-4" />
              Panel médico
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">{medico.nombre_completo}</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                {especialidadMedico ?? 'Especialidad no asignada'} · Gestión de citas, Zoom y diagnósticos.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <PanelMetric icon={CalendarDays} label="Hoy" value={citasHoy} />
            <PanelMetric icon={Clock} label="Activas" value={citasActivas} />
            <PanelMetric icon={ClipboardList} label="Finalizadas" value={citasFinalizadas} />
          </div>
        </div>
      </section>

      <ConfiguracionHorario
        horarioInicial={{
          hora_entrada: medico.hora_entrada || '08:00',
          hora_salida: medico.hora_salida || '17:00',
          dias_laborables: medico.dias_laborables || [1, 2, 3, 4, 5],
        }}
      />

      <SolicitudesUrgentes citas={solicitudesUrgentes} />

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface">Mis citas asignadas</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Ordenadas de la más reciente a la más antigua.</p>
        </div>

        {citasError ? (
          <div className="alert-error">Error al cargar las citas: {citasError.message}</div>
        ) : citasNormales.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin citas asignadas"
            description="Cuando un paciente agende con este médico, la cita aparecerá aquí con sus acciones clínicas."
          />
        ) : (
          <div className="grid gap-4">
            {citasNormales.map((cita) => (
              <article key={cita.id} className="card grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`status-pill ${badgeEstado(cita.estado)}`}>
                      {etiquetaEstado(cita.estado)}
                    </span>
                    <span className="text-xs font-semibold text-on-surface-variant">
                      {new Date(cita.fecha_hora).toLocaleString('es-EC', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'America/Guayaquil',
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-on-surface">
                    {cita.pacientes?.nombre_completo ?? 'Paciente desconocido'}
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{cita.pacientes?.correo ?? 'Sin correo registrado'}</p>
                  <p className="mt-3 text-sm leading-relaxed text-on-surface">{cita.motivo_consulta}</p>
                </div>

                <div className="grid gap-3 lg:min-w-56">
                  {(cita.estado === 'confirmada' || cita.estado === 'en_curso') && (
                    <Link
                      href={`/videoconsulta?cita=${cita.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-primary/90"
                    >
                      <Video className="h-4 w-4" />
                      Unirse a Zoom
                    </Link>
                  )}
                  <AccionesCitaMedico idCita={cita.id} estado={cita.estado} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <HistorialConsultas historial={historial} />
    </main>
  )
}

function PanelMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
          <p className="text-2xl font-extrabold text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}
