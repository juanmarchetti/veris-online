'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Clock } from 'lucide-react'

export default function EsperandoRespuestaMedico({ citaId }: { citaId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [minutos, setMinutos] = useState(0)

  useEffect(() => {
    // Timer para mostrar cuánto tiempo lleva esperando
    const interval = setInterval(() => setMinutos(m => m + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Suscripción a cambios en la cita
    const channel = supabase
      .channel(`cita-${citaId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'citas', 
        filter: `id=eq.${citaId}` 
      }, (payload) => {
        const estado = payload.new.estado
        if (estado === 'confirmada' || estado === 'en_curso') {
          router.push(`/videoconsulta?cita=${citaId}`)
        } else if (estado === 'pendiente_pago') {
          router.push(`/pago?cita=${citaId}&motivo=reagendada`)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [citaId, router, supabase])

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center flex flex-col items-center gap-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
        <AlertCircle size={40} className="text-red-600" />
      </div>
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitud de Urgencia Enviada</h1>
        <p className="text-gray-600">
          Hemos notificado a tu médico de inmediato. Por favor, mantén esta pantalla abierta. 
          Serás redirigido automáticamente en cuanto el médico acepte o responda.
        </p>
      </div>

      <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
        <Loader2 size={16} className="animate-spin text-[#006a63]" />
        <span className="font-medium">Esperando respuesta del médico...</span>
      </div>

      {minutos > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Clock size={14} />
          <span>Tiempo de espera: {minutos} min</span>
        </div>
      )}
    </div>
  )
}
