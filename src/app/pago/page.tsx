import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { expirarPagosPendientes } from '@/utils/expirarPagos'
import PagoSimulador from './PagoSimulador'

type PagoData = {
  monto: number
  fecha_limite_pago: string
  estado_pago: string
  citas: {
    id: string
    fecha_hora: string
    estado: string
    especialidades: { nombre: string } | null
    medicos: { nombre_completo: string } | null
  } | null
}

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<{ cita?: string }>
}) {
  const { error, status } = await verificarUsuario(['paciente'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">Solo los pacientes pueden realizar pagos.</p>
      </main>
    )
  }

  // Expiración perezosa antes de consultar
  await expirarPagosPendientes()

  const params = await searchParams
  const idCita = params.cita

  if (!idCita) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Cita no especificada</h1>
        <p className="mt-4 text-center">No se recibió el identificador de la cita.</p>
      </main>
    )
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('pagos')
    .select(`
      monto,
      fecha_limite_pago,
      estado_pago,
      citas (
        id,
        fecha_hora,
        estado,
        especialidades(nombre),
        medicos(nombre_completo)
      )
    `)
    .eq('id_cita', idCita)
    .single()

  if (dbError || !data) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Pago no encontrado</h1>
        <p className="mt-4 text-center">No se encontró información de pago para esta cita.</p>
      </main>
    )
  }

  const pago = data as unknown as PagoData
  const cita = pago.citas

  return (
    <main className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">Pago de Videoconsulta</h1>
      <PagoSimulador
        idCita={idCita}
        monto={pago.monto}
        fechaLimitePago={pago.fecha_limite_pago}
        estadoPago={pago.estado_pago}
        estadoCita={cita?.estado ?? 'desconocido'}
        especialidad={cita?.especialidades?.nombre ?? 'Especialidad'}
        medico={cita?.medicos?.nombre_completo ?? 'No asignado'}
        fechaHora={cita?.fecha_hora ?? ''}
      />
    </main>
  )
}
