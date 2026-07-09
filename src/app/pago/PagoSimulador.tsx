'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { procesarPagoSandbox } from './actions'
import { CheckCircle2, Clock, CreditCard, Loader2, ShieldCheck } from 'lucide-react'

type PaymentsMode = 'sandbox' | 'production'

type Props = {
  idCita: string
  monto: number
  fechaLimitePago: string
  estadoPago: string
  estadoCita: string
  especialidad: string
  medico: string
  fechaHora: string
  paymentsMode: PaymentsMode
}

const TEST_CARD_NUMBER = '4242 4242 4242 4242'
const TEST_CARD_DIGITS = '4242424242424242'

export default function PagoSimulador({
  idCita,
  monto,
  fechaLimitePago,
  estadoPago,
  estadoCita,
  especialidad,
  medico,
  fechaHora,
  paymentsMode
}: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tiempoRestante, setTiempoRestante] = useState('')
  const [expirado, setExpirado] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  const isSandbox = paymentsMode === 'sandbox'

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

  const usarTarjetaPrueba = () => {
    setCardNumber(TEST_CARD_NUMBER)
    setCardName('PACIENTE PRUEBA')
    setExpiry('12/30')
    setCvv('123')
    setError('')
    setFormErrors({})
  }

  const validarFormulario = () => {
    const errors: { [key: string]: string } = {}
    const digits = cardNumber.replace(/\D/g, '')

    if (!isSandbox) errors.cardNumber = 'La pasarela real aún no está configurada.'
    if (digits.length < 15) errors.cardNumber = 'Número de tarjeta inválido'
    if (isSandbox && digits !== TEST_CARD_DIGITS) errors.cardNumber = 'En sandbox usa la tarjeta 4242 4242 4242 4242'
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
    setSuccess('')

    startTransition(async () => {
      try {
        await new Promise(r => setTimeout(r, 1200))

        const digits = cardNumber.replace(/\D/g, '')
        const result = await procesarPagoSandbox(idCita, {
          last4: digits.slice(-4),
          titular: cardName.trim().toUpperCase(),
          marca: 'visa-test'
        })

        if ('error' in result && result.error) {
          setError(result.error)
          return
        }

        const referencia = 'referenciaPago' in result ? result.referenciaPago : null
        setSuccess(`Pago sandbox aprobado. Referencia: ${referencia ?? 'SBX'}. Tu cita ha sido confirmada.`)
        setTimeout(() => router.push('/mis-citas'), 2200)
      } catch (err) {
        console.error(err)
        setError('Ocurrió un error inesperado al procesar el pago de prueba.')
      }
    })
  }

  const yaResuelto = estadoPago === 'aprobado' || estadoPago === 'expirado' || estadoCita === 'confirmada' || estadoCita === 'cancelada'
  const displayCardNumber = cardNumber || '**** **** **** ****'
  const displayCardName = cardName || 'PACIENTE PRUEBA'
  const displayExpiry = expiry || 'MM/AA'

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start mt-4">
      <div className="w-full md:w-5/12 flex flex-col gap-6">
        <div className="bg-white dark:bg-black/40 p-6 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.10)] border border-foreground/10">
          <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
            Resumen de la Cita
          </h2>

          <div className="flex flex-col gap-4 text-sm">
            <div className="flex justify-between items-center border-b border-foreground/10 pb-3 gap-4">
              <span className="text-foreground/60">Especialidad</span>
              <span className="font-semibold text-right">{especialidad}</span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/10 pb-3 gap-4">
              <span className="text-foreground/60">Médico</span>
              <span className="font-semibold text-right">{medico}</span>
            </div>
            <div className="flex justify-between items-center border-b border-foreground/10 pb-3 gap-4">
              <span className="text-foreground/60">Fecha y Hora</span>
              <span className="font-semibold text-right">
                {new Date(fechaHora).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'long', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 gap-4">
              <span className="text-foreground/80 font-medium">Total a pagar</span>
              <span className="font-extrabold text-3xl text-primary">${monto.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {estadoPago === 'pendiente' && !expirado && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm font-medium">
            <ShieldCheck size={22} className="shrink-0 text-blue-600 mt-0.5" />
            <p>
              {isSandbox
                ? 'Modo prueba activo: este pago no cobra dinero real y solo confirma la cita para validar el flujo.'
                : 'Pago real pendiente de configurar. Cambia a sandbox para hacer pruebas sin cobro.'}
            </p>
          </div>
        )}
      </div>

      <div className="w-full md:w-7/12">
        <div className="bg-white dark:bg-black/40 p-6 md:p-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.10)] border border-foreground/10">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="font-bold text-xl">Pasarela Sandbox</h2>
              <p className="text-sm text-foreground/60 mt-1">Ambiente de prueba, sin cobros reales.</p>
            </div>
            {estadoPago === 'pendiente' && !expirado && !yaResuelto && (
              <div className="text-right">
                <span className="text-xs text-foreground/60 font-medium uppercase tracking-wider block">Expira en</span>
                <span className="text-lg font-mono font-bold text-red-500">{tiempoRestante || '--:--'}</span>
              </div>
            )}
          </div>

          <div className="w-full mx-auto bg-[#122026] text-white p-6 rounded-lg shadow-xl mb-6 border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-8 rounded bg-[#d7c47a]" />
                <span className="text-xs font-bold text-white/60">TEST CARD</span>
              </div>
              <span className="text-xs font-bold text-emerald-300">SANDBOX</span>
            </div>

            <div className="font-mono text-xl md:text-2xl tracking-widest mb-4 text-white/90 break-words">
              {displayCardNumber}
            </div>
            <div className="flex justify-between text-xs opacity-75 font-mono uppercase gap-4">
              <span className="truncate">{displayCardName}</span>
              <span className="shrink-0">{displayExpiry}</span>
            </div>
          </div>

          {estadoPago === 'aprobado' && (
            <div className="bg-green-50 text-green-700 p-6 rounded-lg text-center font-bold border border-green-200">
              <div className="flex justify-center mb-3 text-green-600"><CheckCircle2 className="w-12 h-12" /></div>
              Pago aprobado. Tu cita está confirmada.
            </div>
          )}

          {estadoPago === 'expirado' && (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center font-bold border border-red-200">
              <div className="flex justify-center mb-3 text-red-600"><Clock className="w-12 h-12" /></div>
              El plazo expiró. Cita cancelada.
            </div>
          )}

          {estadoPago === 'rechazado' && !expirado && (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg mb-6 text-center border border-yellow-200 font-medium">
              El pago anterior fue rechazado. Revisa tus datos e intenta de nuevo.
            </div>
          )}

          {(estadoPago === 'pendiente' || estadoPago === 'rechazado') && !expirado && !yaResuelto && (
            <form onSubmit={handlePagar} className="flex flex-col gap-4">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{error}</div>}
              {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100">{success}</div>}

              {!success && (
                <>
                  <button
                    type="button"
                    onClick={usarTarjetaPrueba}
                    className="w-full border border-primary/30 text-primary bg-primary/5 p-3 rounded-lg font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} /> Usar tarjeta de prueba
                  </button>

                  <div>
                    <label className="input-label">Número de tarjeta</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className={`input-field font-mono ${formErrors.cardNumber ? 'border-red-500 bg-red-50' : ''}`}
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        inputMode="numeric"
                      />
                    </div>
                    {formErrors.cardNumber && <p className="text-red-500 text-xs mt-1">{formErrors.cardNumber}</p>}
                  </div>

                  <div>
                    <label className="input-label">Titular de la tarjeta</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value.toUpperCase())
                        setFormErrors(prev => ({ ...prev, cardName: '' }))
                      }}
                      className={`input-field uppercase ${formErrors.cardName ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder="PACIENTE PRUEBA"
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
                        placeholder="12/30"
                        maxLength={5}
                        inputMode="numeric"
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
                        placeholder="123"
                        maxLength={4}
                        inputMode="numeric"
                      />
                      {formErrors.cvv && <p className="text-red-500 text-xs mt-1">{formErrors.cvv}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !isSandbox}
                    className="mt-4 w-full bg-[#006a63] text-white p-4 rounded-lg font-bold text-lg hover:bg-[#00524d] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <><Loader2 className="animate-spin" size={20} /> Procesando prueba...</>
                    ) : (
                      <><ShieldCheck size={20} /> Aprobar pago sandbox ${monto.toFixed(2)}</>
                    )}
                  </button>
                  <p className="text-center text-xs text-foreground/50 mt-2 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} /> Sandbox: no ingreses tarjetas reales.
                  </p>
                </>
              )}
            </form>
          )}

          {expirado && estadoPago === 'pendiente' && (
            <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center font-bold border border-red-200 mt-6">
              <div className="flex justify-center mb-3 text-red-600"><Clock className="w-12 h-12" /></div>
              El plazo expiró. Cita cancelada automáticamente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
