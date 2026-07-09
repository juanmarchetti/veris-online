import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { verificarUsuario } from '@/utils/auth'
import EsperandoRespuestaMedico from './EsperandoRespuestaMedico'

export default async function EsperandoUrgenciaPage({ searchParams }: { searchParams: Promise<{ cita?: string }> | { cita?: string } }) {
  const { error: authError, user } = await verificarUsuario(['paciente'])
  if (authError || !user) redirect('/login')

  // Support for async searchParams in Next.js 15
  const params = await searchParams
  const citaId = params.cita
  if (!citaId) redirect('/mis-citas')

  const supabase = await createClient()

  // Verify cita
  const { data: cita } = await supabase
    .from('citas')
    .select('id, id_paciente, estado, es_urgente, pacientes!inner(id_auth_user)')
    .eq('id', citaId)
    .single()

  if (!cita) redirect('/mis-citas')

  const paciente = cita.pacientes as unknown as { id_auth_user: string }
  if (!cita.es_urgente || paciente.id_auth_user !== user.id) {
    redirect('/mis-citas')
  }

  // Si ya no está pendiente, redirigir
  if (cita.estado === 'confirmada' || cita.estado === 'en_curso') {
    redirect(`/videoconsulta?cita=${cita.id}`)
  }
  if (cita.estado === 'pendiente_pago') {
    redirect(`/pago?cita=${cita.id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <EsperandoRespuestaMedico citaId={cita.id} />
    </div>
  )
}
