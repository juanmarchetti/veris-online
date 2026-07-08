import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { estaEnVentanaDeConexion } from '@/utils/validaciones-videoconsulta'
import { generarEnlaceZoom, ZoomApiError } from '@/utils/zoom'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function VideoconsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ cita?: string }>
}) {
  const { cita: idCita } = await searchParams
  const { error, status, user } = await verificarUsuario(['paciente', 'medico'])
  
  if (error || !user) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p>Solo pacientes y médicos pueden acceder a videoconsultas.</p>
      </main>
    )
  }

  if (!idCita) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Cita no especificada</h1>
        <p>Debes ingresar a través del panel de tus citas.</p>
      </main>
    )
  }

  const supabase = await createClient()

  // 1. Obtener la cita y validar autorización
  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .select(`
      id,
      estado,
      fecha_hora,
      enlace_zoom,
      especialidades ( nombre ),
      pacientes ( id_auth_user ),
      medicos ( id_auth_user )
    `)
    .eq('id', idCita)
    .single()

  if (citaError || !cita) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Cita no encontrada</h1>
        <p>La cita que intentas acceder no existe.</p>
      </main>
    )
  }

  // Verificar que el usuario sea dueño de la cita
  const paciente = cita.pacientes as unknown as { id_auth_user: string } | null
  const medico = cita.medicos as unknown as { id_auth_user: string } | null
  const esParticipante = 
    paciente?.id_auth_user === user.id || 
    medico?.id_auth_user === user.id

  if (!esParticipante) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p>No tienes permiso para unirte a esta consulta.</p>
      </main>
    )
  }

  // Verificar estado
  if (cita.estado !== 'confirmada' && cita.estado !== 'en_curso') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">Consulta no disponible</h1>
        <p>Esta cita está en estado: <strong>{cita.estado}</strong>.</p>
        <Link href={paciente?.id_auth_user === user.id ? '/mis-citas' : '/panel-medico'} className="mt-6 text-primary hover:underline">
          Volver a mis citas
        </Link>
      </main>
    )
  }

  // 2. Validar ventana de tiempo (3 minutos)
  const fechaHora = new Date(cita.fecha_hora)
  if (!estaEnVentanaDeConexion(fechaHora)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface-container-lowest">
        <div className="card max-w-md w-full p-8 text-center border-t-4 border-t-primary-container">
          <h1 className="text-2xl font-bold text-primary mb-4">Sala de Espera</h1>
          <p className="text-on-surface-variant mb-6">
            La videoconsulta estará disponible <strong>3 minutos antes</strong> de la hora programada.
          </p>
          <div className="bg-primary-container/10 p-4 rounded-lg mb-6">
            <p className="text-sm font-semibold text-primary">Hora de la cita:</p>
            <p className="text-lg font-bold">
              {fechaHora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' })}
            </p>
          </div>
          <button 
            onClick={/* Como es server component, un simple refresh funciona */ undefined}
            className="btn-primary w-full"
          >
            <a href={`/videoconsulta?cita=${idCita}`}>Actualizar página</a>
          </button>
        </div>
      </main>
    )
  }

  // 3. Ventana abierta. Obtener/generar enlace.
  let enlaceFinal = cita.enlace_zoom

  if (!enlaceFinal) {
    try {
      const especialidad = (cita.especialidades as unknown as { nombre: string })?.nombre || 'General'
      const enlaceGenerado = await generarEnlaceZoom(
        cita.id,
        fechaHora,
        especialidad
      )

      // Usar la RPC para escritura atómica
      const { data: enlaceRPC, error: rpcError } = await supabase.rpc('registrar_enlace_zoom', {
        p_id_cita: cita.id,
        p_enlace_zoom: enlaceGenerado
      })

      if (rpcError) {
        throw new Error('Error al registrar enlace en base de datos: ' + rpcError.message)
      }

      enlaceFinal = enlaceRPC as string
    } catch (err) {
      const mensaje = err instanceof ZoomApiError 
        ? err.message 
        : 'Ocurrió un error inesperado al intentar generar la reunión.'
        
      return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6">
          <div className="card max-w-md w-full p-8 text-center border-t-4 border-t-error">
            <h1 className="text-2xl font-bold text-error mb-4">Error de conexión</h1>
            <p className="text-on-surface-variant mb-6">{mensaje}</p>
            <a href={`/videoconsulta?cita=${idCita}`} className="btn-primary inline-block">
              Reintentar
            </a>
          </div>
        </main>
      )
    }
  }

  // Si a pesar de todo no hay enlace (muy improbable)
  if (!enlaceFinal) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-error mb-4">Enlace no disponible</h1>
        <p>No se encontró el enlace de conexión. Contacta a soporte.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface-container-lowest">
      <div className="card max-w-md w-full p-8 text-center border-t-4 border-t-secondary">
        <h1 className="text-2xl font-bold text-primary mb-2">Consulta Lista</h1>
        <p className="text-on-surface-variant mb-8">
          Haz clic en el botón para abrir Zoom y comenzar la videollamada.
        </p>
        <a 
          href={enlaceFinal} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-primary inline-block w-full text-lg py-3"
        >
          Unirse a la Reunión
        </a>
      </div>
    </main>
  );
}
