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

  // Actualizar pago → aprobado
  const { error: pagoError } = await supabase
    .from('pagos')
    .update({
      estado_pago: 'aprobado',
      fecha_pago: new Date().toISOString(),
      metodo_pago: 'simulado'
    })
    .eq('id_cita', idCita)
    .eq('estado_pago', 'pendiente')

  if (pagoError) {
    return { error: 'Error al procesar el pago: ' + pagoError.message }
  }

  // Actualizar cita → confirmada
  const { error: citaError } = await supabase
    .from('citas')
    .update({ estado: 'confirmada' })
    .eq('id', idCita)

  if (citaError) {
    return { error: 'Pago procesado pero error al confirmar la cita: ' + citaError.message }
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
