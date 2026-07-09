'use client'

import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { aceptarCitaUrgente, rechazarCitaUrgente } from './actions'

type Props = {
  citas: {
    id: string
    motivo_consulta: string
    pacientes: { nombre_completo: string; correo: string } | null
  }[]
}

export default function SolicitudesUrgentes({ citas }: Props) {
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  if (citas.length === 0) return null

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    setLoadingId(id)
    setErrorMsg('')
    startTransition(async () => {
      let res
      if (action === 'accept') {
        res = await aceptarCitaUrgente(id)
      } else {
        res = await rechazarCitaUrgente(id)
      }
      
      if (res?.error) {
        setErrorMsg(res.error)
      }
      setLoadingId(null)
    })
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-red-600" />
        <h2 className="text-xl font-extrabold text-red-700">Solicitudes Urgentes ({citas.length})</h2>
      </div>
      
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4">
        {citas.map(cita => (
          <div key={cita.id} className="bg-red-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase tracking-wide mb-2">
                  ¡Atención Inmediata Requerida!
                </span>
                <h3 className="text-lg font-bold text-gray-900">{cita.pacientes?.nombre_completo}</h3>
                <p className="text-sm text-gray-600 mb-2">{cita.pacientes?.correo}</p>
                <div className="bg-white p-3 rounded border border-red-100 text-sm text-gray-800">
                  <span className="font-semibold text-red-800 block mb-1">Motivo:</span>
                  {cita.motivo_consulta}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                <button 
                  onClick={() => handleAction(cita.id, 'accept')}
                  disabled={isPending && loadingId !== null}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && loadingId === cita.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Aceptar
                </button>
                <button 
                  onClick={() => handleAction(cita.id, 'reject')}
                  disabled={isPending && loadingId !== null}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && loadingId === cita.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
