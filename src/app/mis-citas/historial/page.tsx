import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Download, FileSearch, FileText } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

type Relation<T> = T | T[] | null

type HistorialRegistro = {
  id: string
  tipo_registro: string
  fecha: string
  motivo_consulta?: string
  sintomas_reportados?: string
  diagnostico?: string
  tratamiento_indicado?: string
  observaciones?: string
  requiere_valoracion_presencial?: boolean
  medicos?: Relation<{ nombre_completo: string }>
  citas?: Relation<{
    fecha_hora: string
    especialidades?: Relation<{ nombre: string }>
  }>
  documentos_clinicos?: Relation<{
    id: string
    tipo_documento: string
    url_archivo: string
    citas?: Relation<{
      id: string
      fecha_hora: string
      medicos?: Relation<{ nombre_completo: string }>
      especialidades?: Relation<{ nombre: string }>
    }>
  }>
}

function one<T>(value: Relation<T> | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function HistorialClinicoPage() {
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
    .select('id, historial_clinico_veris')
    .eq('id_auth_user', user.id)
    .single()

  if (!paciente) {
    return (
      <main className="page-shell">
        <EmptyState
          icon={FileSearch}
          title="Perfil de paciente no encontrado"
          description="No se pudo encontrar un perfil asociado a tu usuario."
        />
      </main>
    )
  }

  const { data: historial, error: dbError } = await supabase
    .from('historial_clinico')
    .select(`
      id,
      tipo_registro,
      fecha,
      motivo_consulta,
      sintomas_reportados,
      diagnostico,
      tratamiento_indicado,
      observaciones,
      requiere_valoracion_presencial,
      medicos (nombre_completo),
      citas (fecha_hora, especialidades (nombre)),
      documentos_clinicos (
        id,
        tipo_documento,
        url_archivo,
        citas (
          id,
          fecha_hora,
          medicos (nombre_completo),
          especialidades (nombre)
        )
      )
    `)
    .eq('id_paciente', paciente.id)
    .order('fecha', { ascending: false })

  const registros = (historial ?? []) as unknown as HistorialRegistro[]

  return (
    <main className="page-shell grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <span className="section-kicker">Historial médico</span>
          <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">Mi historial clínico</h1>
          <p className="text-sm text-on-surface-variant">Consulta diagnósticos, tratamientos y documentos emitidos por tus médicos.</p>
        </div>
        <Link href="/mis-citas" className="btn-outline w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4" />
          Volver a mis citas
        </Link>
      </div>

      {dbError ? (
        <div className="alert-error">Error al cargar historial: {dbError.message}</div>
      ) : registros.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Aún no hay registros clínicos"
          description="Cuando finalice una videoconsulta, el diagnóstico y sus documentos aparecerán en esta sección."
          actionHref="/agendar-cita"
          actionLabel="Agendar videoconsulta"
        />
      ) : (
        <div className="relative grid gap-5 border-l border-outline-variant pl-5 sm:ml-3 sm:pl-7">
          {registros.map((registro) => {
            const doc = one(registro.documentos_clinicos)
            const citaVieja = one(doc?.citas)
            const citaActual = one(registro.citas)
            const medico = one(registro.medicos)?.nombre_completo || one(citaVieja?.medicos)?.nombre_completo
            const fechaCita = citaActual?.fecha_hora || citaVieja?.fecha_hora
            const especialidad = one(citaActual?.especialidades)?.nombre || one(citaVieja?.especialidades)?.nombre

            return (
              <article key={registro.id} className="relative">
                <span className="absolute -left-[1.9rem] top-5 h-3 w-3 rounded-full bg-primary ring-4 ring-background sm:-left-[2.35rem]" />

                <div className="card p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-primary">{registro.tipo_registro}</h2>
                      <p className="text-sm text-on-surface-variant">
                        {new Date(registro.fecha).toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                    </div>

                    {registro.diagnostico && (
                      <a
                        href={`/api/diagnostico/${registro.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-extrabold text-on-secondary transition-colors hover:bg-secondary/90"
                      >
                        <Download className="h-4 w-4" /> PDF
                      </a>
                    )}
                  </div>

                  {fechaCita && (
                    <div className="mb-4 grid gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant sm:grid-cols-3">
                      <p><strong className="text-on-surface">Cita:</strong> {new Date(fechaCita).toLocaleString('es-EC')}</p>
                      {medico && <p><strong className="text-on-surface">Médico:</strong> Dr(a). {medico}</p>}
                      {especialidad && <p><strong className="text-on-surface">Especialidad:</strong> {especialidad}</p>}
                    </div>
                  )}

                  {registro.diagnostico && (
                    <div className="grid gap-4 text-sm">
                      {registro.sintomas_reportados && (
                        <Field label="Síntomas" value={registro.sintomas_reportados} />
                      )}
                      <Field label="Diagnóstico" value={registro.diagnostico} important />
                      {registro.tratamiento_indicado && (
                        <Field label="Tratamiento" value={registro.tratamiento_indicado} />
                      )}
                      {registro.observaciones && (
                        <Field label="Observaciones" value={registro.observaciones} />
                      )}
                      {registro.requiere_valoracion_presencial && (
                        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs font-bold text-yellow-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          Requiere valoración médica presencial.
                        </div>
                      )}
                    </div>
                  )}

                  {doc?.url_archivo && (
                    <div className="mt-4">
                      <a
                        href={doc.url_archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-foreground/5 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10"
                      >
                        <FileText className="h-4 w-4" /> Ver documento adjunto ({doc.tipo_documento.replace('_', ' ')})
                      </a>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

function Field({ label, value, important = false }: { label: string; value: string; important?: boolean }) {
  return (
    <div>
      <h3 className={`mb-1 text-xs font-extrabold uppercase ${important ? 'text-error' : 'text-on-surface-variant'}`}>
        {label}
      </h3>
      <p className="whitespace-pre-wrap leading-relaxed text-on-surface">{value}</p>
    </div>
  )
}
