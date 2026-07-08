// Panel Médico — ruta protegida exclusivamente para el rol 'medico'.
// Muestra las citas asignadas al médico autenticado, aprovechando la política
// RLS existente "Médicos pueden ver sus citas asignadas".
//
// TODO-PRODUCTO: Las mutaciones sobre citas (marcar como 'en_curso', 'finalizada')
// y la subida de documentos clínicos (documentos_clinicos) deben implementarse
// en un PR posterior. Sin ellas, el campo estado permanecerá huérfano para el rol médico.
// Ver RF-04 y RF-05 en el SRS para los requisitos de ese flujo.

import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AccionesCitaMedico from './AccionesCitaMedico'
import Link from 'next/link'

// Forzar renderizado dinámico: esta página requiere cookies de sesión en cada request.
// Sin esto, Next.js intentaría pre-renderizar estáticamente y fallaría sin env vars.
export const dynamic = 'force-dynamic'

// Tipo para la respuesta de citas del médico
type CitaMedico = {
  id: string
  fecha_hora: string
  estado: string
  motivo_consulta: string
  pacientes: { nombre_completo: string; correo: string } | null
  especialidades: { nombre: string } | null
}

// Colores por estado (mismo patrón que mis-citas/page.tsx para consistencia)
function badgeEstado(estado: string) {
  switch (estado) {
    case 'confirmada':    return 'bg-green-100 text-green-700'
    case 'pendiente_pago': return 'bg-yellow-100 text-yellow-700'
    case 'cancelada':     return 'bg-red-100 text-red-600'
    case 'en_curso':      return 'bg-blue-100 text-blue-700'
    case 'finalizada':    return 'bg-gray-100 text-gray-600'
    case 'agendada':      return 'bg-purple-100 text-purple-700'
    default:              return 'bg-secondary/10 text-secondary'
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

export default async function PanelMedicoPage() {
  // Solo médicos pueden acceder — sin fila en perfiles con rol='medico', retorna 403
  const { error, status, user } = await verificarUsuario(['medico'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">
          Esta sección es exclusiva para médicos. Si crees que es un error, contacta al administrador.
        </p>
      </main>
    )
  }

  const supabase = await createClient()

  // Obtener el perfil del médico vinculado al usuario autenticado.
  // Si no existe fila en medicos con id_auth_user = user.id, el admin aún no
  // ha completado el perfil médico desde el panel de gestión de usuarios.
  const { data: medico } = await supabase
    .from('medicos')
    .select('id, nombre_completo, especialidades(nombre)')
    .eq('id_auth_user', user!.id)
    .maybeSingle()

  if (!medico) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Perfil médico no configurado</h1>
        <p className="text-center text-foreground/70 max-w-md">
          Tu cuenta tiene rol de médico, pero aún no se ha creado tu perfil en el sistema.
          Pide al administrador que complete tu configuración desde el panel de administración.
        </p>
      </main>
    )
  }

  // Obtener citas asignadas a este médico.
  // RLS: "Médicos pueden ver sus citas asignadas" filtra automáticamente por id_auth_user.
  // El filtro explícito por id_medico es redundante pero mejora la legibilidad y rendimiento.
  const { data, error: citasError } = await supabase
    .from('citas')
    .select(`
      id,
      fecha_hora,
      estado,
      motivo_consulta,
      pacientes(nombre_completo, correo),
      especialidades(nombre)
    `)
    .eq('id_medico', medico.id)
    .order('fecha_hora', { ascending: false })

  const citas = data as unknown as CitaMedico[] | null

  // Supabase tipea las relaciones join como array, pero medicos→especialidades es many-to-one
  // (un médico tiene exactamente una especialidad), por lo que el join retorna un objeto, no un array.
  // Casteamos a unknown primero para satisfacer al compilador TS.
  const especialidadMedico = (medico.especialidades as unknown as { nombre: string } | null)?.nombre

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full">
      {/* Encabezado con datos del médico */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Panel Médico</h1>
        <p className="text-foreground/70 mt-1">
          Bienvenido/a, <strong>{medico.nombre_completo}</strong>
          {especialidadMedico ? ` — ${especialidadMedico}` : ''}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4">Mis citas asignadas</h2>

      {citasError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Error al cargar las citas: {citasError.message}
        </div>
      ) : !citas || citas.length === 0 ? (
        <div className="bg-surface border border-foreground/10 p-8 rounded-xl text-center text-foreground/60">
          No tienes citas asignadas por el momento.
        </div>
      ) : (
        <div className="grid gap-4">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {cita.pacientes?.nombre_completo ?? 'Paciente desconocido'}
                </h3>
                <p className="text-foreground/60 text-sm">{cita.pacientes?.correo}</p>
                <p className="text-foreground/70 mt-1">
                  {new Date(cita.fecha_hora).toLocaleString('es-EC', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="text-sm text-foreground/60 mt-1 italic">{cita.motivo_consulta}</p>
                <div className="mt-2">
                  <span
                    className={`font-semibold px-2 py-1 rounded-md uppercase text-xs tracking-wider ${badgeEstado(cita.estado)}`}
                  >
                    {etiquetaEstado(cita.estado)}
                  </span>
                </div>
              </div>

              {/* Acceso a la videoconsulta si la cita está confirmada o en curso */}
              {(cita.estado === 'confirmada' || cita.estado === 'en_curso') && (
                <Link
                  href={`/videoconsulta?cita=${cita.id}`}
                  className="bg-primary text-white px-5 py-2 rounded-md font-bold hover:bg-primary/90 transition-colors text-sm shrink-0"
                >
                  Unirse a Zoom
                </Link>
              )}
              
              {/* Acciones del Médico: en curso, finalizar, documentos */}
              <div className="w-full sm:w-auto">
                <AccionesCitaMedico idCita={cita.id} estado={cita.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
