'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simularPagoAprobado, simularPagoRechazado } from './actions'
import { CheckCircle2, Clock } from 'lucide-react'

type Props = {
  idCita: string
  monto: number
  fechaLimitePago: string
  estadoPago: string
  estadoCita: string
  especialidad: string
  medico: string
  fechaHora: string
}

export default function PagoSimulador({
  idCita, monto, fechaLimitePago, estadoPago, estadoCita,
  especialidad, medico, fechaHora
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tiempoRestante, setTiempoRestante] = useState('')
  const [expirado, setExpirado] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (estadoPago !== 'pendiente') return

    const interval = setInterval(() => {
      const ahora = new Date().getTime()
      const limite = new Date(fechaLimitePago).getTime()
      const diff = limite - ahora

      if (diff <= 0) {
        setExpirado(true)
        setTiempoRestante('00:00')
        clearInterval(interval)
        return
      }

      const minutos = Math.floor(diff / 60000)
      const segundos = Math.floor((diff % 60000) / 1000)
      setTiempoRestante(`${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [fechaLimitePago, estadoPago])

  const handleAprobar = async () => {
    setLoading('aprobando')
    setError('')
    try {
      const result = await simularPagoAprobado(idCita)
      if (result.error) {
        setError(result.error)
        setLoading('')
      } else {
        setSuccess('¡Pago simulado como aprobado! Tu cita ha sido confirmada.')
        setLoading('')
        setTimeout(() => router.push('/mis-citas'), 2000)
      }
    } catch (err) {
      console.error(err)
      setError('Ocurrió un error inesperado al procesar el pago.')
      setLoading('')
    }
  }

  const handleRechazar = async () => {
    setLoading('rechazando')
    setError('')
    const result = await simularPagoRechazado(idCita)
    if (result.error) {
      setError(result.error)
      setLoading('')
    } else {
      setSuccess('Pago simulado como rechazado. Puedes reintentar mientras el plazo esté vigente.')
      setLoading('')
      setTimeout(() => router.refresh(), 2000)
    }
  }

  // Ya procesado
  const yaResuelto = estadoPago === 'aprobado' || estadoPago === 'expirado' || estadoCita === 'confirmada' || estadoCita === 'cancelada'

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start mt-4">
      
      {/* Columna Izquierda: Resumen */}
      <div className="w-full md:w-5/12 flex flex-col gap-6">
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-foreground/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <h2 className="font-bold text-xl mb-6 relative z-10">Resumen de la Cita</h2>
          
          <div className="flex flex-col gap-4 text-sm relative z-10">
            <div className="flex justify-between items-center border-b border-foreground/10 pb-3">
              <span className="text-foreground/60">Especialidad</span>
              <span className="font-semibold text-right">{especialidad}</span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/10 pb-3">
              <span className="text-foreground/60">Médico</span>
              <span className="font-semibold text-right">{medico}</span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/10 pb-3">
              <span className="text-foreground/60">Fecha y Hora</span>
              <span className="font-semibold text-right">{new Date(fechaHora).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-foreground/80 font-medium">Total a Pagar</span>
              <span className="font-extrabold text-3xl text-primary">${monto.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Badge Simulador */}
        <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded-xl text-center text-sm font-medium shadow-sm flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          SIMULADOR DE PAGO — No es real
        </div>
      </div>

      {/* Columna Derecha: Tarjeta / Pasarela */}
      <div className="w-full md:w-7/12">
        <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-foreground/5">
          <h2 className="font-bold text-xl mb-6">Detalles de Pago</h2>
          
          {/* Mock Credit Card */}
          <div className="w-full max-w-sm mx-auto bg-gradient-to-br from-gray-800 to-black text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden transform transition-transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <svg className="w-10 h-10 opacity-80" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" rx="6" fill="#FFC107"/><rect x="6" y="10" width="8" height="16" rx="2" fill="#FFE082"/><rect x="18" y="10" width="12" height="16" rx="2" fill="#FFE082"/></svg>
              <span className="font-bold tracking-widest opacity-80 italic">VISA</span>
            </div>
            
            <div className="font-mono text-xl tracking-widest mb-2 relative z-10">
              •••• •••• •••• 4242
            </div>
            <div className="flex justify-between text-xs opacity-70 font-mono relative z-10">
              <span>TITULAR DE LA TARJETA</span>
              <span>EXP 12/28</span>
            </div>
          </div>

          {/* Estado actual */}
          {estadoPago === 'aprobado' && (
            <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center font-bold border border-green-200">
              <div className="flex justify-center mb-3 text-green-600"><CheckCircle2 className="w-12 h-12" /></div>
              Pago aprobado. Tu cita está confirmada.
            </div>
          )}
          
          {estadoPago === 'expirado' && (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center font-bold border border-red-200">
              <div className="flex justify-center mb-3 text-red-600"><Clock className="w-12 h-12" /></div>
              El plazo expiró. Cita cancelada.
            </div>
          )}

          {estadoPago === 'rechazado' && !expirado && (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl mb-6 text-center border border-yellow-200 font-medium">
              El pago anterior fue rechazado. Intenta de nuevo.
            </div>
          )}

          {/* Formulario de Simulación */}
          {(estadoPago === 'pendiente' || estadoPago === 'rechazado') && !expirado && !yaResuelto && (
            <div className="flex flex-col gap-6">
              <div className="text-center bg-surface p-4 rounded-xl">
                <p className="text-sm text-foreground/60 mb-1 font-medium">Tiempo restante</p>
                <p className="text-3xl font-mono font-bold text-primary">{tiempoRestante || '--:--'}</p>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}
              {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100">{success}</div>}

              {!success && (
                <div className="flex flex-col gap-4 mt-2">
                  <button
                    onClick={handleAprobar}
                    disabled={!!loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
                  >
                    {loading === 'aprobando' ? (
                      <span className="animate-pulse">Procesando pago...</span>
                    ) : (
                      <>Pagar Seguro ${monto.toFixed(2)}</>
                    )}
                  </button>
                  
                  <button
                    onClick={handleRechazar}
                    disabled={!!loading}
                    className="w-full bg-surface text-foreground/70 p-3 rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading === 'rechazando' ? 'Rechazando...' : 'Simular error de tarjeta'}
                  </button>
                </div>
              )}
            </div>
          )}

          {expirado && estadoPago === 'pendiente' && (
             <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center font-bold border border-red-200">
             <div className="flex justify-center mb-3 text-red-600"><Clock className="w-12 h-12" /></div>
             El plazo expiró. Cita cancelada automáticamente.
           </div>
          )}
        </div>
      </div>
    </div>
  )
}
