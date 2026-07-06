import { createClient } from '@/utils/supabase/server'

/**
 * Expiración "perezosa" de pagos vencidos (RF-03.2).
 *
 * Al no contar con un cron job real (pg_cron o Supabase Edge Function programada),
 * esta función se ejecuta al cargar las páginas /mis-citas y /pago.
 * Solo expira cuando alguien consulta la cita, no en tiempo real.
 *
 * Mejora futura: implementar un cron real para expiración en segundo plano.
 */
export async function expirarPagosPendientes() {
  const supabase = await createClient()

  // 1. Marcar pagos vencidos como 'expirado'
  const { data: pagosExpirados } = await supabase
    .from('pagos')
    .update({ estado_pago: 'expirado' })
    .eq('estado_pago', 'pendiente')
    .lt('fecha_limite_pago', new Date().toISOString())
    .select('id_cita')

  // 2. Cancelar las citas asociadas a los pagos expirados
  if (pagosExpirados && pagosExpirados.length > 0) {
    const citaIds = pagosExpirados.map((p: { id_cita: string }) => p.id_cita)
    await supabase
      .from('citas')
      .update({ estado: 'cancelada' })
      .in('id', citaIds)
      .eq('estado', 'pendiente_pago')
  }
}
