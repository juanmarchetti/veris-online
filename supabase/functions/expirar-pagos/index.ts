import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async () => {
  // Solo permitir POST u orígenes autorizados si es necesario
  // Aquí usamos el service_role key, por lo que tenemos permisos de admin

  console.log("Iniciando expiración de pagos...")

  try {
    // 1. Expirar pagos
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .update({ estado_pago: 'expirado' })
      .eq('estado_pago', 'pendiente')
      .lt('fecha_limite_pago', new Date().toISOString())
      .select('id_cita')

    if (pagosError) throw pagosError

    console.log(`Pagos expirados: ${pagos.length}`)

    // 2. Cancelar citas vinculadas
    if (pagos.length > 0) {
      const citasIds = pagos.map(p => p.id_cita)
      
      const { error: citasError } = await supabase
        .from('citas')
        .update({ estado: 'cancelada' })
        .in('id', citasIds)
        .eq('estado', 'pendiente_pago')

      if (citasError) throw citasError
      console.log(`Citas canceladas: ${citasIds.length}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Expiración procesada' }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("Error procesando expiración:", err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
