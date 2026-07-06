'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function simularPagoAprobado(idCita: string) {
  const supabase = await createClient()

  // Autenticar
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // Obtener datos de la cita para Zoom y Resend
  const { data: cita } = await supabase
    .from('citas')
    .select('fecha_hora, motivo_consulta')
    .eq('id', idCita)
    .single()

  let enlaceZoom = null
  if (cita) {
    const { generarEnlaceZoom } = await import('@/utils/zoom')
    enlaceZoom = await generarEnlaceZoom(idCita, cita.fecha_hora, cita.motivo_consulta)
  }

  // Llamar a la RPC SECURITY DEFINER para aprobar pago y confirmar cita atómicamente
  const { error: rpcError } = await supabase.rpc('aprobar_pago_simulado', {
    p_id_cita: idCita,
    p_enlace_zoom: enlaceZoom
  })

  if (rpcError) {
    return { error: 'Error al procesar el pago: ' + rpcError.message }
  }

  // Notificación por correo
  if (cita) {
    const { enviarCorreoConfirmacion } = await import('@/utils/resend')
    await enviarCorreoConfirmacion(idCita)
  }

  revalidatePath('/mis-citas')
  return { success: true }
}

export async function simularPagoRechazado(idCita: string) {
  const supabase = await createClient()

  // Autenticar
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // Actualizar pago → rechazado (la cita queda en pendiente_pago para reintentar)
  const { error: pagoError } = await supabase
    .from('pagos')
    .update({
      estado_pago: 'rechazado'
    })
    .eq('id_cita', idCita)
    .eq('estado_pago', 'pendiente')

  if (pagoError) {
    return { error: 'Error al registrar el rechazo: ' + pagoError.message }
  }

  revalidatePath('/mis-citas')
  return { success: true }
}
