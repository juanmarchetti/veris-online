'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simularPagoAprobado, simularPagoRechazado } from './actions'

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
    const result = await simularPagoAprobado(idCita)
    if (result.error) {
      setError(result.error)
      setLoading('')
    } else {
      setSuccess('¡Pago simulado como aprobado! Tu cita ha sido confirmada.')
      setLoading('')
      setTimeout(() => router.push('/mis-citas'), 2000)
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
    <div className="w-full max-w-lg mx-auto">
      {/* Badge de simulador */}
      <div className="bg-orange-100 border-2 border-orange-400 text-orange-800 p-3 rounded-lg mb-6 text-center text-sm font-bold">
        ⚠️ SIMULADOR DE PAGO — Esto NO es una pasarela real
      </div>

      {/* Datos de la cita */}
      <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-lg border border-foreground/5 mb-6">
        <h2 className="font-bold text-lg mb-4">Resumen de la cita</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <span className="text-foreground/60">Especialidad:</span>
          <span className="font-medium">{especialidad}</span>
          <span className="text-foreground/60">Médico:</span>
          <span className="font-medium">{medico}</span>
          <span className="text-foreground/60">Fecha y hora:</span>
          <span className="font-medium">{new Date(fechaHora).toLocaleString('es-EC')}</span>
          <span className="text-foreground/60">Monto:</span>
          <span className="font-bold text-xl text-primary">${monto.toFixed(2)}</span>
        </div>
      </div>

      {/* Estado actual */}
      {estadoPago === 'aprobado' && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 text-center font-bold">
          ✅ Pago aprobado — Cita confirmada
        </div>
      )}
      {estadoPago === 'expirado' && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4 text-center font-bold">
          ⏰ El plazo de pago ha expirado. La cita fue cancelada.
        </div>
      )}
      {estadoPago === 'rechazado' && !expirado && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md mb-4 text-center">
          El último intento de pago fue rechazado. Puedes reintentar.
        </div>
      )}

      {/* Countdown y botones si el pago está pendiente o rechazado */}
      {(estadoPago === 'pendiente' || estadoPago === 'rechazado') && !expirado && !yaResuelto && (
        <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-lg border border-foreground/5">
          <div className="text-center mb-6">
            <p className="text-sm text-foreground/60 mb-1">Tiempo restante para pagar</p>
            <p className="text-4xl font-mono font-bold text-primary">{tiempoRestante || '--:--'}</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">{success}</div>}

          {!success && (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAprobar}
                disabled={!!loading}
                className="w-full bg-green-600 text-white p-4 rounded-md font-bold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading === 'aprobando' ? 'Procesando...' : '✅ Simular Pago Aprobado'}
              </button>
              <button
                onClick={handleRechazar}
                disabled={!!loading}
                className="w-full bg-red-500 text-white p-4 rounded-md font-bold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading === 'rechazando' ? 'Procesando...' : '❌ Simular Pago Rechazado'}
              </button>
            </div>
          )}
        </div>
      )}

      {expirado && estadoPago === 'pendiente' && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center font-bold">
          ⏰ El plazo de pago ha expirado. La cita será cancelada automáticamente.
        </div>
      )}
    </div>
  )
}
