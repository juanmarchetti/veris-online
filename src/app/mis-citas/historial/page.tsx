import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { FileText, Download } from 'lucide-react'

export default async function HistorialClinicoPage() {
  const { error, status, user } = await verificarUsuario(['paciente'])

  if (error || !user) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
      </main>
    )
  }

  const supabase = await createClient()

  // Obtener el ID del paciente
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, historial_clinico_veris')
    .eq('id_auth_user', user.id)
    .single()

  if (!paciente) {
    return <main className="p-6 text-center">Perfil de paciente no encontrado.</main>
  }

  // Obtener el historial clínico del paciente
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
  medicos?: { nombre_completo: string } | null
  citas?: { 
    fecha_hora: string,
    especialidades?: { nombre: string } | null
  } | null
  documentos_clinicos?: {
    id: string
    tipo_documento: string
    url_archivo: string
    citas?: {
      id: string
      fecha_hora: string
      medicos?: { nombre_completo: string }
      especialidades?: { nombre: string }
    } | null
  } | null
}

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Mi Historial Clínico</h1>
        <Link href="/mis-citas" className="text-primary hover:underline text-sm font-semibold">
          &larr; Volver a Mis Citas
        </Link>
      </div>

      {!paciente.historial_clinico_veris && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-6 text-sm border border-yellow-200">
          Nota: Aún no has vinculado tu historial clínico presencial de Veris. Solo se mostrarán los registros de tus videoconsultas.
        </div>
      )}

      {dbError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">Error al cargar historial: {dbError.message}</div>
      ) : !historial || historial.length === 0 ? (
        <div className="bg-surface border border-foreground/10 p-8 rounded-xl text-center text-foreground/60">
          No tienes registros en tu historial clínico.
        </div>
      ) : (
        <div className="relative border-l border-foreground/20 ml-3 md:ml-6 space-y-8">
          {(historial as unknown as HistorialRegistro[]).map((registro) => {
            const doc = registro.documentos_clinicos
            const citaVieja = doc?.citas
            
            // Usar la relación directa nueva si existe, o caer a la antigua mediante documentos
            const nombreMedico = registro.medicos?.nombre_completo || citaVieja?.medicos?.nombre_completo
            const fechaCita = registro.citas?.fecha_hora || citaVieja?.fecha_hora
            const especialidad = registro.citas?.especialidades?.nombre || citaVieja?.especialidades?.nombre

            return (
              <div key={registro.id} className="pl-6 relative">
                {/* Timeline dot */}
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                
                <div className="bg-white dark:bg-black/20 p-5 rounded-xl shadow-sm border border-foreground/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{registro.tipo_registro}</h3>
                      <span className="text-sm text-foreground/50">
                        {new Date(registro.fecha).toLocaleDateString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}
                      </span>
                    </div>
                    {registro.diagnostico && (
                      <a
                        href={`/api/diagnostico/${registro.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-md text-sm font-bold hover:bg-secondary/90 transition-colors shadow-sm"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </a>
                    )}
                  </div>
                  
                  {fechaCita && (
                    <div className="text-sm text-foreground/80 mb-4 bg-surface p-3 rounded-lg border border-outline-variant flex flex-col sm:flex-row gap-2 sm:gap-6">
                      <p><strong>Cita:</strong> {new Date(fechaCita).toLocaleString('es-EC')}</p>
                      {nombreMedico && <p><strong>Médico:</strong> Dr(a). {nombreMedico}</p>}
                      {especialidad && <p><strong>Especialidad:</strong> {especialidad}</p>}
                    </div>
                  )}

                  {registro.diagnostico && (
                    <div className="grid gap-3 text-sm">
                      {registro.sintomas_reportados && (
                        <div>
                          <h4 className="font-semibold text-foreground/60 uppercase text-xs">Síntomas</h4>
                          <p>{registro.sintomas_reportados}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-error uppercase text-xs">Diagnóstico</h4>
                        <p className="font-medium">{registro.diagnostico}</p>
                      </div>
                      {registro.tratamiento_indicado && (
                        <div>
                          <h4 className="font-semibold text-foreground/60 uppercase text-xs">Tratamiento</h4>
                          <p className="whitespace-pre-wrap">{registro.tratamiento_indicado}</p>
                        </div>
                      )}
                      {registro.observaciones && (
                        <div>
                          <h4 className="font-semibold text-foreground/60 uppercase text-xs">Observaciones</h4>
                          <p className="whitespace-pre-wrap">{registro.observaciones}</p>
                        </div>
                      )}
                      {registro.requiere_valoracion_presencial && (
                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-xs font-bold inline-block mt-2">
                          ⚠️ Requiere valoración médica presencial
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
                        className="inline-flex items-center gap-2 bg-foreground/5 text-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-foreground/10 transition-colors"
                      >
                        <FileText className="w-4 h-4" /> Ver Documento Adjunto ({doc.tipo_documento.replace('_', ' ')})
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
