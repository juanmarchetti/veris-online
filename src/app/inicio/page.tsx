import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  Activity,
  AlertCircle,
  Calendar,
  CalendarPlus,
  Clock,
  Download,
  FileSearch,
  FileText,
  User,
} from 'lucide-react'
import EmptyState from '@/components/EmptyState'

type Relation<T> = T | T[] | null

type ProximaCita = {
  id: string
  fecha_hora: string
  estado: string
  motivo_consulta: string | null
  medicos: Relation<{ nombre_completo: string }>
  especialidades: Relation<{ nombre: string }>
}

type Diagnostico = {
  id: string
  fecha: string
  diagnostico: string | null
  citas?: Relation<{ especialidades?: Relation<{ nombre: string }> }>
}

function one<T>(value: Relation<T> | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function DashboardInicioPage() {
  const { error, status, user } = await verificarUsuario(['paciente'])

  if (error || !user) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso denegado</h1>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nombre_completo')
    .eq('id_auth_user', user.id)
    .single()

  if (!paciente) {
    return (
      <main className="page-shell">
        <EmptyState
          icon={User}
          title="Perfil de paciente no encontrado"
          description="No se pudo encontrar un perfil asociado a tu usuario."
        />
      </main>
    )
  }

  const ahora = new Date().toISOString()
  const { data: proximasCitas } = await supabase
    .from('citas')
    .select('id, fecha_hora, estado, motivo_consulta, medicos(nombre_completo), especialidades(nombre)')
    .eq('id_paciente', paciente.id)
    .in('estado', ['agendada', 'confirmada', 'pendiente_pago', 'en_curso'])
    .gte('fecha_hora', ahora)
    .order('fecha_hora', { ascending: true })
    .limit(1)

  const { data: ultimosDiagnosticos } = await supabase
    .from('historial_clinico')
    .select('id, fecha, diagnostico, requiere_valoracion_presencial, medicos(nombre_completo), citas(especialidades(nombre))')
    .eq('id_paciente', paciente.id)
    .not('diagnostico', 'is', null)
    .order('fecha', { ascending: false })
    .limit(3)

  const { count: totalConsultas } = await supabase
    .from('historial_clinico')
    .select('*', { count: 'exact', head: true })
    .eq('id_paciente', paciente.id)

  const { data: alertasValoracion } = await supabase
    .from('historial_clinico')
    .select('id, fecha')
    .eq('id_paciente', paciente.id)
    .eq('requiere_valoracion_presencial', true)
    .order('fecha', { ascending: false })
    .limit(1)

  const proximaCita = proximasCitas?.[0] as ProximaCita | undefined
  const diagnosticos = (ultimosDiagnosticos ?? []) as unknown as Diagnostico[]
  const tieneAlerta = Boolean(alertasValoracion?.length)
  const primerNombre = paciente.nombre_completo.split(' ')[0]

  return (
    <main className="page-shell grid gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="grid gap-2">
          <span className="section-kicker">Panel del paciente</span>
          <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">Hola, {primerNombre}</h1>
          <p className="text-on-surface-variant">Gestiona tus citas, accesos a Zoom e historial clínico.</p>
        </div>
        <Link href="/agendar-cita" className="btn-primary w-full sm:w-auto">
          <CalendarPlus className="h-5 w-5" />
          Agendar cita
        </Link>
      </div>

      {tieneAlerta && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <h2 className="font-bold">Valoración presencial requerida</h2>
            <p className="text-sm leading-relaxed">
              En una consulta anterior se indicó atención presencial. Acude a un centro médico si los síntomas continúan.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="grid gap-6">
          <section className="relative overflow-hidden rounded-lg bg-primary p-5 text-white shadow-sm sm:p-6">
            <Calendar className="absolute -bottom-8 -right-8 h-32 w-32 text-white opacity-10" />
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5" /> Próxima videoconsulta
            </h2>

            {proximaCita ? (
              <div className="rounded-lg border border-white/20 bg-white/10 p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-2xl font-extrabold capitalize">
                      {new Date(proximaCita.fecha_hora).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-lg opacity-90">
                      a las {new Date(proximaCita.fecha_hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-3 font-semibold">Dr(a). {one(proximaCita.medicos)?.nombre_completo ?? 'No asignado'}</p>
                    <p className="text-sm opacity-85">
                      {one(proximaCita.especialidades)?.nombre ?? 'Especialidad'} · {proximaCita.motivo_consulta ?? 'Consulta médica'}
                    </p>
                  </div>

                  {(proximaCita.estado === 'confirmada' || proximaCita.estado === 'en_curso') ? (
                    <Link
                      href={`/videoconsulta?cita=${proximaCita.id}`}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-primary transition-colors hover:bg-white/90"
                    >
                      Ingresar a Zoom
                    </Link>
                  ) : (
                    <span className="status-pill bg-white/20 text-white">
                      {proximaCita.estado.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/20 bg-white/10 p-5">
                <p className="mb-4 text-base font-semibold">No tienes citas próximas agendadas.</p>
                <Link href="/agendar-cita" className="inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-extrabold text-primary hover:bg-white/90">
                  Agendar nueva cita
                </Link>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-on-surface">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickLink href="/agendar-cita" icon={Calendar} label="Agendar cita" />
              <QuickLink href="/mis-citas" icon={Clock} label="Mis citas" />
              <QuickLink href="/mis-citas/historial" icon={FileText} label="Historial clínico" />
              <QuickLink href="/perfil" icon={User} label="Mi perfil" />
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
              <Activity className="h-5 w-5 text-primary" /> Mi actividad
            </h2>
            <div className="grid gap-3">
              <Metric label="Total consultas" value={String(totalConsultas || 0)} />
              <Metric
                label="Última atención"
                value={
                  diagnosticos[0]?.fecha
                    ? new Date(diagnosticos[0].fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Sin registros'
                }
              />
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-on-surface">Últimos diagnósticos</h2>
              <Link href="/mis-citas/historial" className="text-xs font-extrabold text-primary hover:underline">
                Ver todos
              </Link>
            </div>

            {diagnosticos.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="Sin diagnósticos recientes"
                description="Cuando un médico finalice una consulta, el diagnóstico aparecerá aquí."
              />
            ) : (
              <div className="grid gap-3">
                {diagnosticos.map((diag) => {
                  const cita = one(diag.citas)
                  const especialidad = one(cita?.especialidades)?.nombre

                  return (
                    <article key={diag.id} className="relative rounded-lg border border-outline-variant p-3 pr-12">
                      <p className="mb-1 text-xs text-on-surface-variant">
                        {new Date(diag.fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                        {especialidad ? ` · ${especialidad}` : ''}
                      </p>
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface">
                        {diag.diagnostico}
                      </p>
                      <a
                        href={`/api/diagnostico/${diag.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white"
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link href={href} className="card grid min-h-28 place-items-center gap-2 p-4 text-center transition-colors hover:border-primary">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-bold text-on-surface">{label}</span>
    </Link>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-right text-sm font-extrabold text-on-surface">{value}</span>
    </div>
  )
}
