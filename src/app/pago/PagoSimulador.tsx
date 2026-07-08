'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { simularPagoAprobado, simularPagoRechazado } from './actions'
import { CheckCircle2, Clock, CreditCard, ShieldCheck, Loader2 } from 'lucide-react'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tiempoRestante, setTiempoRestante] = useState('')
  const [expirado, setExpirado] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estado del formulario de tarjeta
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

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

  // Formateo de tarjeta
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim()
    if (val.length <= 16) {
      setCardNumber(formatted)
      setFormErrors(prev => ({ ...prev, cardNumber: '' }))
    }
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4)
    }
    if (val.length <= 5) {
      setExpiry(val)
      setFormErrors(prev => ({ ...prev, expiry: '' }))
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (val.length <= 4) {
      setCvv(val)
      setFormErrors(prev => ({ ...prev, cvv: '' }))
    }
  }

  const validarFormulario = () => {
    const errors: { [key: string]: string } = {}
    if (cardNumber.replace(/\D/g, '').length < 15) errors.cardNumber = 'Número de tarjeta inválido'
    if (cardName.trim().length < 3) errors.cardName = 'Nombre inválido'
    if (expiry.length < 5) errors.expiry = 'Fecha inválida'
    if (cvv.length < 3) errors.cvv = 'CVV inválido'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) return

    setError('')
    
    startTransition(async () => {
      try {
        // Simulamos un procesamiento de 1.5s para mayor realismo
        await new Promise(r => setTimeout(r, 1500))
        
        const result = await simularPagoAprobado(idCita)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccess('¡Pago procesado exitosamente! Tu cita ha sido confirmada.')
          setTimeout(() => router.push('/mis-citas'), 2000)
        }
      } catch (err) {
        console.error(err)
        setError('Ocurrió un error inesperado al procesar el pago con el banco.')
      }
    })
  }

  // Ya procesado
  const yaResuelto = estadoPago === 'aprobado' || estadoPago === 'expirado' || estadoCita === 'confirmada' || estadoCita === 'cancelada'

  // Dinámica de la tarjeta mock
  const displayCardNumber = cardNumber || '•••• •••• •••• ••••'
  const displayCardName = cardName || 'TITULAR DE LA TARJETA'
  const displayExpiry = expiry || 'MM/AA'

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start mt-4">
      
      {/* Columna Izquierda: Resumen */}
      <div className="w-full md:w-5/12 flex flex-col gap-6">
        <div className="bg-white dark:bg-black/40 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-foreground/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <h2 className="font-bold text-xl mb-6 relative z-10 flex items-center gap-2">
            Resumen de la Cita
          </h2>
          
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
              <span className="font-semibold text-right">
                {new Date(fechaHora).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'long', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-foreground/80 font-medium">Total a Pagar</span>
              <span className="font-extrabold text-3xl text-primary">${monto.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {estadoPago === 'pendiente' && !expirado && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-medium">
            <ShieldCheck size={24} className="shrink-0 text-blue-600" />
            <p>Tus fondos serán transferidos de forma segura a la cuenta bancaria configurada por el administrador.</p>
          </div>
        )}
      </div>

      {/* Columna Derecha: Tarjeta / Pasarela */}
      <div className="w-full md:w-7/12">
        <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-foreground/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl">Detalles de Pago</h2>
            {estadoPago === 'pendiente' && !expirado && !yaResuelto && (
              <div className="text-right">
                <span className="text-xs text-foreground/60 font-medium uppercase tracking-wider block">Expira en</span>
                <span className="text-lg font-mono font-bold text-red-500">{tiempoRestante || '--:--'}</span>
              </div>
            )}
          </div>
          
          {/* Mock Credit Card Interactivo */}
          <div className="w-full mx-auto bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden transform transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <svg className="w-10 h-10 opacity-80" viewBox="0 0 36 36" fill="none"><rect width="36" height="36" rx="6" fill="#e0e0e0"/><rect x="6" y="10" width="8" height="16" rx="2" fill="#bdbdbd"/><rect x="18" y="10" width="12" height="16" rx="2" fill="#bdbdbd"/></svg>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/80 mix-blend-screen"></div>
                <div className="w-8 h-8 rounded-full bg-yellow-500/80 mix-blend-screen -ml-4"></div>
              </div>
            </div>
            
            <div className="font-mono text-xl md:text-2xl tracking-widest mb-4 relative z-10 text-white/90">
              {displayCardNumber}
            </div>
            <div className="flex justify-between text-xs opacity-70 font-mono relative z-10 uppercase">
              <span className="truncate pr-4">{displayCardName}</span>
              <span className="shrink-0">{displayExpiry}</span>
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
              El pago anterior fue rechazado. Revisa tus datos e intenta de nuevo.
            </div>
          )}

          {/* Formulario de Checkout */}
          {(estadoPago === 'pendiente' || estadoPago === 'rechazado') && !expirado && !yaResuelto && (
            <form onSubmit={handlePagar} className="flex flex-col gap-4">
              
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}
              {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100">{success}</div>}

              {!success && (
                <>
                  <div>
                    <label className="input-label">Número de Tarjeta</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className={`input-field pl-10 font-mono ${formErrors.cardNumber ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                    </div>
                    {formErrors.cardNumber && <p className="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>}
                  </div>

                  <div>
                    <label className="input-label">Titular de la Tarjeta</label>
                    <input 
                      type="text" 
                      value={cardName}
                      onChange={(e) => { setCardName(e.target.value.toUpperCase()); setFormErrors(prev => ({...prev, cardName: ''})) }}
                      className={`input-field uppercase ${formErrors.cardName ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="NOMBRE EN LA TARJETA"
                    />
                    {formErrors.cardName && <p className="text-red-500 text-xs mt-1">{formErrors.cardName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Vencimiento</label>
                      <input 
                        type="text" 
                        value={expiry}
                        onChange={handleExpiryChange}
                        className={`input-field font-mono text-center ${formErrors.expiry ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                      {formErrors.expiry && <p className="text-red-500 text-xs mt-1">{formErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="input-label">CVV</label>
                      <input 
                        type="password" 
                        value={cvv}
                        onChange={handleCvvChange}
                        className={`input-field font-mono text-center ${formErrors.cvv ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="•••"
                        maxLength={4}
                      />
                      {formErrors.cvv && <p className="text-red-500 text-xs mt-1">{formErrors.cvv}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-4 w-full bg-[#006a63] text-white p-4 rounded-xl font-bold text-lg hover:bg-[#00524d] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <><Loader2 className="animate-spin" size={20} /> Procesando pago...</>
                    ) : (
                      <><ShieldCheck size={20} /> Pagar ${monto.toFixed(2)}</>
                    )}
                  </button>
                  <p className="text-center text-xs text-foreground/50 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} /> Pago Seguro Encriptado de Extremo a Extremo
                  </p>
                </>
              )}
            </form>
          )}

          {expirado && estadoPago === 'pendiente' && (
             <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center font-bold border border-red-200 mt-6">
             <div className="flex justify-center mb-3 text-red-600"><Clock className="w-12 h-12" /></div>
             El plazo expiró. Cita cancelada automáticamente.
           </div>
          )}
        </div>
      </div>
    </div>
  )
}
