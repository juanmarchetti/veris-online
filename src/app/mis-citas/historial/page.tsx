import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { FileText } from 'lucide-react'

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
            const cita = doc?.citas

            return (
              <div key={registro.id} className="pl-6 relative">
                {/* Timeline dot */}
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                
                <div className="bg-white dark:bg-black/20 p-5 rounded-xl shadow-sm border border-foreground/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{registro.tipo_registro}</h3>
                    <span className="text-sm text-foreground/50">
                      {new Date(registro.fecha).toLocaleDateString('es-EC', { dateStyle: 'long' })}
                    </span>
                  </div>
                  
                  {cita && (
                    <div className="text-sm text-foreground/70 mb-3 bg-surface p-3 rounded-md">
                      <p><strong>Cita:</strong> {new Date(cita.fecha_hora).toLocaleString('es-EC')}</p>
                      <p><strong>Médico:</strong> Dr(a). {cita.medicos?.nombre_completo}</p>
                      <p><strong>Especialidad:</strong> {cita.especialidades?.nombre}</p>
                    </div>
                  )}

                  {doc?.url_archivo && (
                    <a
                      href={doc.url_archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/20 transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Ver {doc.tipo_documento.replace('_', ' ')}
                    </a>
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
