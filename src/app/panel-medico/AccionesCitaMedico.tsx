'use client'

import { useState, useTransition } from 'react'
import { marcarCitaEnCurso, finalizarCita, agregarDocumentoClinico } from './actions'

type Props = {
  idCita: string
  estado: string
}

export default function AccionesCitaMedico({ idCita, estado }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  
  // Para finalizar cita
  const [requiereValoracion, setRequiereValoracion] = useState(false)
  const [informeMedico, setInformeMedico] = useState('')
  
  // Para documento
  const [tipoDoc, setTipoDoc] = useState('receta')
  const [urlDoc, setUrlDoc] = useState('')

  const handleEnCurso = () => {
    startTransition(async () => {
      const res = await marcarCitaEnCurso(idCita)
      if (res.error) setMensaje({ ok: false, texto: res.error })
    })
  }

  const handleFinalizar = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await finalizarCita(idCita, requiereValoracion, informeMedico)
      if (res.error) setMensaje({ ok: false, texto: res.error })
      else setMensaje({ ok: true, texto: 'Cita finalizada.' })
    })
  }

  const handleDoc = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const formData = new FormData()
      formData.append('idCita', idCita)
      formData.append('tipoDocumento', tipoDoc)
      formData.append('urlArchivo', urlDoc)
      
      const res = await agregarDocumentoClinico(formData)
      if (res.error) setMensaje({ ok: false, texto: res.error })
      else {
        setMensaje({ ok: true, texto: 'Documento subido.' })
        setUrlDoc('')
      }
    })
  }

  if (estado === 'finalizada' || estado === 'cancelada') return null

  return (
    <div className="flex flex-col gap-3 mt-4 border-t pt-4">
      {mensaje && (
        <div className={`p-2 rounded text-xs ${mensaje.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {mensaje.texto}
        </div>
      )}

      {estado === 'confirmada' && (
        <button
          onClick={handleEnCurso}
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700"
        >
          Iniciar Consulta (Marcar En Curso)
        </button>
      )}

      {estado === 'en_curso' && (
        <div className="flex flex-col gap-4">
          <form onSubmit={handleDoc} className="bg-surface p-3 rounded border text-sm flex flex-col gap-2">
            <h4 className="font-bold">Subir Documento</h4>
            <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} className="border p-1 rounded">
              <option value="receta">Receta</option>
              <option value="orden_servicio">Orden de Servicio</option>
              <option value="recomendacion">Recomendación</option>
              <option value="certificado">Certificado</option>
            </select>
            <input 
              type="text" 
              placeholder="URL del archivo" 
              value={urlDoc} 
              onChange={e => setUrlDoc(e.target.value)} 
              className="border p-1 rounded" 
              required
            />
            <button type="submit" disabled={isPending} className="bg-primary text-white rounded p-1 font-bold">
              Guardar Documento
            </button>
          </form>

          <form onSubmit={handleFinalizar} className="bg-surface p-3 rounded border text-sm flex flex-col gap-2">
            <h4 className="font-bold">Finalizar Consulta</h4>
            <textarea
              placeholder="Informe de síntomas y diagnóstico del paciente..."
              required
              rows={4}
              value={informeMedico}
              onChange={e => setInformeMedico(e.target.value)}
              className="border p-2 rounded resize-none"
            />
            <label className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                checked={requiereValoracion} 
                onChange={e => setRequiereValoracion(e.target.checked)} 
              />
              Requiere valoración presencial
            </label>
            <button type="submit" disabled={isPending} className="bg-gray-800 text-white rounded p-1 font-bold mt-1">
              Finalizar Cita
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
