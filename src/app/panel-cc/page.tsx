import { verificarUsuario } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { validarHistorialPaciente } from './actions'
import { CheckCircle2, ClipboardCheck, Phone, ShieldCheck, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PacientePendiente = {
  id: string
  tipo_identificacion: string
  numero_identificacion: string
  nombre_completo: string
  correo: string
  telefono: string | null
  cuenta_registrada_portal: boolean
  creado_en?: string
}

type ValidacionReciente = {
  id: string
  created_at: string
  observacion: string | null
  pacientes: { nombre_completo: string; numero_identificacion: string } | null
}

export default async function PanelContactCenterPage() {
  const { error, status } = await verificarUsuario(['agente_cc', 'admin'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso denegado</h1>
        <p className="mt-4 text-center">Esta seccion es exclusiva para Contact Center y administradores.</p>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: pacientesPendientes, error: pacientesError } = await supabase
    .from('pacientes')
    .select('id, tipo_identificacion, numero_identificacion, nombre_completo, correo, telefono, cuenta_registrada_portal')
    .eq('historial_clinico_veris', false)
    .order('nombre_completo', { ascending: true })

  const { count: totalPendientes } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .eq('historial_clinico_veris', false)

  const { data: validacionesRecientes, error: validacionesError } = await supabase
    .from('contact_center_validaciones')
    .select('id, created_at, observacion, pacientes(nombre_completo, numero_identificacion)')
    .order('created_at', { ascending: false })
    .limit(6)

  const pacientes = (pacientesPendientes ?? []) as PacientePendiente[]
  const validaciones = (validacionesRecientes ?? []) as unknown as ValidacionReciente[]

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Panel Contact Center</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Valida pacientes sin historial clinico Veris antes de que puedan agendar una videoconsulta.
          </p>
        </div>
        <div className="card flex items-center gap-3 px-5 py-4">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Pendientes</p>
            <p className="text-2xl font-extrabold text-primary">{totalPendientes ?? pacientes.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-start gap-3 border-b border-outline-variant p-4 text-sm text-on-surface-variant">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <p>
            Al validar, el paciente queda habilitado para agendar. Esta accion debe hacerse solo despues de confirmar
            identidad y registro administrativo segun el proceso interno.
          </p>
        </div>

        {pacientesError ? (
          <div className="p-6 text-sm text-error">Error al cargar pacientes: {pacientesError.message}</div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-secondary" />
            <div>
              <h2 className="text-lg font-bold text-primary">No hay pacientes pendientes</h2>
              <p className="text-sm text-on-surface-variant">Todos los pacientes registrados tienen historial validado.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {pacientes.map((paciente) => (
              <article key={paciente.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-on-surface">{paciente.nombre_completo}</h2>
                    <span className="badge badge-agente">Historial pendiente</span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-on-surface-variant sm:grid-cols-2">
                    <p>
                      <strong>ID:</strong> {paciente.tipo_identificacion} {paciente.numero_identificacion}
                    </p>
                    <p>
                      <strong>Correo:</strong> {paciente.correo}
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {paciente.telefono || 'Sin telefono registrado'}
                    </p>
                    <p>
                      <strong>Cuenta portal:</strong> {paciente.cuenta_registrada_portal ? 'Registrada' : 'No registrada'}
                    </p>
                  </div>
                </div>

                <form action={validarHistorialPaciente}>
                  <input type="hidden" name="pacienteId" value={paciente.id} />
                  <label className="sr-only" htmlFor={`observacion-${paciente.id}`}>
                    Observacion de validacion
                  </label>
                  <input
                    id={`observacion-${paciente.id}`}
                    name="observacion"
                    className="input-field mb-3 text-sm"
                    placeholder="Observacion interna opcional"
                    maxLength={180}
                  />
                  <button type="submit" className="btn-primary w-full md:w-auto">
                    <CheckCircle2 className="h-4 w-4" />
                    Validar historial
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-3 border-b border-outline-variant p-4">
          <div className="rounded-full bg-secondary/10 p-2 text-secondary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">Validaciones recientes</h2>
            <p className="text-sm text-on-surface-variant">Auditoria operativa de cambios realizados por Contact Center.</p>
          </div>
        </div>

        {validacionesError ? (
          <div className="p-5 text-sm text-on-surface-variant">
            No se pudo cargar la auditoria. Verifica que la migracion 0022 este aplicada.
          </div>
        ) : validaciones.length === 0 ? (
          <div className="p-6 text-sm text-on-surface-variant">Aun no hay validaciones registradas.</div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {validaciones.map((validacion) => (
              <article key={validacion.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-on-surface">
                    {validacion.pacientes?.nombre_completo ?? 'Paciente no disponible'}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    ID {validacion.pacientes?.numero_identificacion ?? 'N/A'}
                    {validacion.observacion ? ` - ${validacion.observacion}` : ''}
                  </p>
                </div>
                <time className="text-sm text-on-surface-variant" dateTime={validacion.created_at}>
                  {new Date(validacion.created_at).toLocaleString('es-EC', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'America/Guayaquil',
                  })}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
