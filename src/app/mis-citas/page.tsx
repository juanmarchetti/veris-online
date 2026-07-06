import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { expirarPagosPendientes } from '@/utils/expirarPagos'
import Link from 'next/link'

type CitaRespuesta = {
  id: string
  fecha_hora: string
  estado: string
  enlace_zoom: string | null
  especialidades: { nombre: string } | null
  medicos: { nombre_completo: string } | null
}

// Colores para cada estado de cita
function badgeEstado(estado: string) {
  switch (estado) {
    case 'confirmada':
      return 'bg-green-100 text-green-700'
    case 'pendiente_pago':
      return 'bg-yellow-100 text-yellow-700'
    case 'cancelada':
      return 'bg-red-100 text-red-600'
    case 'en_curso':
      return 'bg-blue-100 text-blue-700'
    case 'finalizada':
      return 'bg-gray-100 text-gray-600'
    case 'agendada':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-secondary/10 text-secondary'
  }
}

function etiquetaEstado(estado: string) {
  switch (estado) {
    case 'pendiente_pago': return 'Pendiente de Pago'
    case 'confirmada': return 'Confirmada'
    case 'cancelada': return 'Cancelada'
    case 'en_curso': return 'En Curso'
    case 'finalizada': return 'Finalizada'
    case 'agendada': return 'Agendada'
    default: return estado
  }
}

export default async function MisCitasPage() {
  const { error, status } = await verificarUsuario(['paciente'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">Solo los pacientes pueden ver sus citas.</p>
      </main>
    )
  }

  // Expiración perezosa antes de consultar
  await expirarPagosPendientes()

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('citas')
    .select(`
      id,
      fecha_hora,
      estado,
      enlace_zoom,
      especialidades(nombre),
      medicos(nombre_completo)
    `)
    .order('fecha_hora', { ascending: false })

  const citas = data as unknown as CitaRespuesta[] | null

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-primary mb-8">Mis Videoconsultas</h1>

      {dbError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">Error al cargar las citas: {dbError.message}</div>
      ) : !citas || citas.length === 0 ? (
        <div className="bg-surface border border-foreground/10 p-8 rounded-xl text-center text-foreground/60">
          No tienes ninguna cita registrada.
        </div>
      ) : (
        <div className="grid gap-4">
          {citas.map((cita) => (
            <div key={cita.id} className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg">
                  {cita.especialidades?.nombre || 'Especialidad'} - Dr(a). {cita.medicos?.nombre_completo || 'No asignado'}
                </h3>
                <p className="text-foreground/70">{new Date(cita.fecha_hora).toLocaleString('es-EC')}</p>
                <div className="mt-2 text-sm">
                  <span className={`font-semibold px-2 py-1 rounded-md uppercase text-xs tracking-wider ${badgeEstado(cita.estado)}`}>
                    {etiquetaEstado(cita.estado)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {cita.estado === 'pendiente_pago' && (
                  <Link
                    href={`/pago?cita=${cita.id}`}
                    className="bg-yellow-500 text-white px-5 py-2 rounded-md font-bold hover:bg-yellow-600 transition-colors text-sm"
                  >
                    Pagar ahora
                  </Link>
                )}
                {cita.enlace_zoom && cita.estado === 'confirmada' && (
                  <a
                    href={cita.enlace_zoom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-white px-5 py-2 rounded-md font-bold hover:bg-primary/90 transition-colors text-sm"
                  >
                    Conectarse a Zoom
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
