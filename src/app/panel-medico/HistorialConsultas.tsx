'use client'

import { useState } from 'react'

type Diagnostico = {
  id: string
  fecha: string
  motivo_consulta: string
  sintomas_reportados: string
  diagnostico: string
  tratamiento_indicado: string
  observaciones: string
  requiere_valoracion_presencial: boolean
  paciente_nombre: string
}

export default function HistorialConsultas({ historial }: { historial: Diagnostico[] }) {
  const [expandidoId, setExpandidoId] = useState<string | null>(null)

  if (!historial || historial.length === 0) {
    return <p className="text-foreground/60 text-sm italic">No hay consultas finalizadas en el historial.</p>
  }

  const toggle = (id: string) => {
    setExpandidoId(prev => prev === id ? null : id)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold mt-8 mb-2 border-b pb-2">Historial de Consultas</h2>
      <div className="grid gap-3">
        {historial.map(reg => (
          <div key={reg.id} className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden text-sm">
            {/* Header del Accordion */}
            <div 
              className="p-4 cursor-pointer hover:bg-black/5 flex justify-between items-center transition-colors"
              onClick={() => toggle(reg.id)}
            >
              <div>
                <p className="font-bold text-base text-primary">{reg.paciente_nombre}</p>
                <p className="text-foreground/70 text-xs">
                  {new Date(reg.fecha).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <p className="text-foreground/80 mt-1"><span className="font-semibold">Motivo:</span> {reg.motivo_consulta || 'No registrado'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <a 
                  href={`/api/diagnostico/${reg.id}/pdf`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-secondary text-on-secondary px-3 py-1 rounded text-xs font-bold hover:bg-secondary/90 shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Descargar PDF
                </a>
                <span className="text-foreground/50 text-xl font-light">
                  {expandidoId === reg.id ? '−' : '+'}
                </span>
              </div>
            </div>

            {/* Contenido Expandido */}
            {expandidoId === reg.id && (
              <div className="p-4 border-t bg-black/5 flex flex-col gap-3">
                {reg.sintomas_reportados && (
                  <div>
                    <h5 className="font-bold text-xs uppercase text-foreground/60">Síntomas</h5>
                    <p className="text-sm">{reg.sintomas_reportados}</p>
                  </div>
                )}
                <div>
                  <h5 className="font-bold text-xs uppercase text-error">Diagnóstico</h5>
                  <p className="text-sm">{reg.diagnostico}</p>
                </div>
                {reg.tratamiento_indicado && (
                  <div>
                    <h5 className="font-bold text-xs uppercase text-foreground/60">Tratamiento</h5>
                    <p className="text-sm whitespace-pre-wrap">{reg.tratamiento_indicado}</p>
                  </div>
                )}
                {reg.observaciones && (
                  <div>
                    <h5 className="font-bold text-xs uppercase text-foreground/60">Observaciones</h5>
                    <p className="text-sm whitespace-pre-wrap">{reg.observaciones}</p>
                  </div>
                )}
                {reg.requiere_valoracion_presencial && (
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded text-xs font-semibold inline-block self-start mt-1">
                    ⚠️ Requiere valoración presencial
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
