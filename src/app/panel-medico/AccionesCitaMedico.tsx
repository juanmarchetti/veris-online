'use client'

import { useState, useTransition } from 'react'
import { marcarCitaEnCurso, finalizarCitaMedico, agregarDocumentoClinico } from './actions'

type Props = {
  idCita: string
  estado: string
}

export default function AccionesCitaMedico({ idCita, estado }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  
  // Para finalizar cita (Diagnóstico SOAP)
  const [sintomas, setSintomas] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [requiereValoracion, setRequiereValoracion] = useState(false)
  
  // Paso de confirmación
  const [confirmando, setConfirmando] = useState(false)
  
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
    if (!diagnostico.trim()) {
      setMensaje({ ok: false, texto: 'El campo de Diagnóstico es obligatorio.' })
      return
    }

    if (!confirmando) {
      setConfirmando(true)
      return
    }

    startTransition(async () => {
      const res = await finalizarCitaMedico(idCita, {
        sintomas_reportados: sintomas,
        diagnostico,
        tratamiento_indicado: tratamiento,
        observaciones,
        requiere_valoracion_presencial: requiereValoracion
      })
      if (res.error) {
        setMensaje({ ok: false, texto: res.error })
        setConfirmando(false)
      } else {
        setMensaje({ ok: true, texto: 'Consulta finalizada. Diagnóstico enviado al paciente.' })
      }
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
        <div className="flex flex-col gap-6 mt-2">
          {/* Formulario de Diagnóstico Clínico */}
          <form onSubmit={handleFinalizar} className="bg-surface p-4 rounded-xl border border-outline-variant flex flex-col gap-4 shadow-sm">
            <h4 className="font-bold text-lg text-primary">Registro Clínico</h4>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Síntomas Reportados (S)</label>
              <textarea 
                value={sintomas} onChange={e => setSintomas(e.target.value)} 
                className="input-field text-sm" rows={2} placeholder="Lo que el paciente relata..."
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-error">Diagnóstico (A) *</label>
              <textarea 
                value={diagnostico} onChange={e => setDiagnostico(e.target.value)} 
                className="input-field text-sm" rows={3} placeholder="Evaluación médica..." required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Tratamiento Indicado (P)</label>
              <textarea 
                value={tratamiento} onChange={e => setTratamiento(e.target.value)} 
                className="input-field text-sm" rows={3} placeholder="Receta, medicación, plan de acción..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Observaciones / Recomendaciones</label>
              <textarea 
                value={observaciones} onChange={e => setObservaciones(e.target.value)} 
                className="input-field text-sm" rows={2} placeholder="Reposo, dieta, cuidados generales..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm mt-2 p-2 bg-yellow-50 text-yellow-800 rounded">
              <input 
                type="checkbox" 
                checked={requiereValoracion} 
                onChange={e => setRequiereValoracion(e.target.checked)} 
              />
              <span className="font-medium">El paciente requiere valoración presencial</span>
            </label>

            {confirmando ? (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-2">
                <p className="text-sm font-bold text-red-800 mb-3">¿Está seguro de finalizar la cita y enviar este diagnóstico al paciente?</p>
                <div className="flex gap-2">
                  <button type="submit" disabled={isPending} className="bg-red-600 text-white rounded px-4 py-2 text-sm font-bold flex-1 hover:bg-red-700">
                    Sí, Finalizar
                  </button>
                  <button type="button" onClick={() => setConfirmando(false)} disabled={isPending} className="bg-gray-200 text-gray-800 rounded px-4 py-2 text-sm font-bold flex-1 hover:bg-gray-300">
                    No, Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="submit" className="bg-primary text-white rounded-lg p-2 font-bold mt-2 hover:bg-primary/90 transition-colors">
                Finalizar Consulta
              </button>
            )}
          </form>

          {/* Formulario de Documentos Adjuntos Opcionales */}
          <form onSubmit={handleDoc} className="bg-surface p-4 rounded-xl border border-outline-variant text-sm flex flex-col gap-3">
            <h4 className="font-bold">Adjuntar Documento Adicional</h4>
            <div className="flex gap-2">
              <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} className="input-field flex-1 py-1 px-2">
                <option value="receta">Receta Externa (PDF)</option>
                <option value="orden_servicio">Orden de Exámenes</option>
                <option value="certificado">Certificado Médico</option>
              </select>
            </div>
            <input 
              type="url" 
              placeholder="URL del archivo (ej. Google Drive, Supabase)" 
              value={urlDoc} 
              onChange={e => setUrlDoc(e.target.value)} 
              className="input-field py-1 px-2" 
              required
            />
            <button type="submit" disabled={isPending} className="bg-secondary text-on-secondary rounded p-2 font-bold hover:bg-secondary/90 transition-colors">
              Guardar Documento
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
