'use server'

import { createClient } from '@/utils/supabase/server'
import { createSandboxPaymentReference, getPaymentsMode } from '@/utils/payments'
import { revalidatePath } from 'next/cache'

type PagoSandboxInput = {
  last4?: string
  titular?: string
  marca?: string
}

function canFallbackToLegacyRpc(message: string) {
  return /aprobar_pago_sandbox|function|schema cache|could not find|not found/i.test(message)
}

export async function procesarPagoSandbox(idCita: string, input: PagoSandboxInput = {}) {
  if (getPaymentsMode() !== 'sandbox') {
    return { error: 'Pago real aun no configurado. Activa PAYMENTS_MODE=sandbox para pruebas.' }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: cita } = await supabase
    .from('citas')
    .select('fecha_hora, motivo_consulta, duracion_minutos')
    .eq('id', idCita)
    .single()

  let enlaceZoom = null
  if (cita) {
    try {
      const { generarEnlaceZoom } = await import('@/utils/zoom')
      enlaceZoom = await generarEnlaceZoom(idCita, cita.fecha_hora, cita.motivo_consulta, cita.duracion_minutos || 30)
    } catch (err) {
      console.error('No se pudo generar el enlace de Zoom al aprobar el pago:', err)
      enlaceZoom = null
    }
  }

  const referenciaPago = createSandboxPaymentReference(idCita)
  const detallePago = {
    origen: 'checkout_sandbox',
    last4: input.last4 ?? null,
    titular: input.titular ?? null,
    marca: input.marca ?? 'sandbox-card'
  }

  const { error: rpcError } = await supabase.rpc('aprobar_pago_sandbox', {
    p_id_cita: idCita,
    p_enlace_zoom: enlaceZoom,
    p_metodo_pago: 'sandbox',
    p_referencia_pago: referenciaPago,
    p_ambiente_pago: 'sandbox',
    p_detalle_pago: detallePago
  })

  if (rpcError) {
    if (!canFallbackToLegacyRpc(rpcError.message)) {
      return { error: 'Error al procesar el pago: ' + rpcError.message }
    }

    const { error: legacyRpcError } = await supabase.rpc('aprobar_pago_simulado', {
      p_id_cita: idCita,
      p_enlace_zoom: enlaceZoom
    })

    if (legacyRpcError) {
      return { error: 'Error al procesar el pago: ' + legacyRpcError.message }
    }
  }

  if (cita) {
    try {
      const { enviarCorreoConfirmacion } = await import('@/utils/resend')
      await enviarCorreoConfirmacion(idCita)
    } catch (err) {
      console.error('Error al enviar el correo de confirmacion:', err)
    }
  }

  revalidatePath('/mis-citas')
  return { success: true, referenciaPago }
}

export async function simularPagoAprobado(idCita: string) {
  return procesarPagoSandbox(idCita)
}

export async function simularPagoRechazado(idCita: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

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
