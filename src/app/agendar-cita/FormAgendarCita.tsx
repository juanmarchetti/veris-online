'use client'

import { useState, useMemo } from 'react'
import { crearCita } from './actions'

type Especialidad = { id: string; nombre: string }
type Medico = { id: string; nombre_completo: string; id_especialidad: string }
type Convenio = { id: string; nombre_aseguradora: string }

type Props = {
  especialidades: Especialidad[]
  medicos: Medico[]
  convenios: Convenio[]
  tieneHistorialClinico: boolean
}

// Genera bloques de 30 min entre 08:00 y 17:30 (última cita a las 17:30, cierre 18:00)
function generarHoras(): string[] {
  const horas: string[] = []
  for (let h = 8; h < 18; h++) {
    horas.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 17 || h === 17) {
      horas.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  // Quitar 18:00 que se agrega al loop
  return horas.filter(h => h < '18:00')
}

export default function FormAgendarCita({ especialidades, medicos, convenios, tieneHistorialClinico }: Props) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('')

  const horas = useMemo(() => generarHoras(), [])

  // Filtrar médicos por especialidad seleccionada
  const medicosFiltrados = useMemo(() => {
    if (!especialidadSeleccionada) return medicos
    return medicos.filter(m => m.id_especialidad === especialidadSeleccionada)
  }, [especialidadSeleccionada, medicos])

  // Fecha mínima: hoy
  const hoy = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Validación de fecha no sea domingo
    const fecha = formData.get('fecha') as string
    if (fecha) {
      const dia = new Date(fecha + 'T12:00:00')
      if (dia.getDay() === 0) {
        setError('No se pueden agendar citas en domingo.')
        setLoading(false)
        return
      }
    }

    const result = await crearCita(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si no hay error, el server action redirige a /pago
  }

  return (
    <>
      {/* RF-02.6: Aviso de historial clínico */}
      {!tieneHistorialClinico && (
        <div className="w-full bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded-lg mb-6 text-sm">
          <strong>⚠️ Aviso importante:</strong> No tienes historial clínico registrado en Veris.
          Antes de que tu cita pueda ser confirmada, debes comunicarte al Contact Center al{' '}
          <strong>6009600</strong> para registrar tus datos clínicos.
        </div>
      )}

      {error && <div className="w-full bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card flex flex-col gap-6" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

        {/* RF-02.2 / RF-06.4: Motivo de consulta con recordatorio */}
        <div>
          <label className="text-sm font-medium mb-1 block">Motivo de consulta *</label>
          <textarea
            name="motivo_consulta"
            rows={3}
            placeholder="Por favor detalla tus síntomas con el mayor detalle posible: cuándo empezaron, frecuencia, intensidad y cualquier otro dato relevante para tu consulta."
            required
            className="input-field"
            style={{ width: '100%', minHeight: '100px' }}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Especialidad *</label>
          <select
            name="id_especialidad"
            required
            value={especialidadSeleccionada}
            onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
            className="input-field"
            style={{ width: '100%' }}
          >
            <option value="">Selecciona una especialidad</option>
            {especialidades.map(esp => (
              <option key={esp.id} value={esp.id}>{esp.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Médico *</label>
          <select name="id_medico" required className="input-field" style={{ width: '100%' }}>
            <option value="">Selecciona un médico</option>
            {medicosFiltrados.map(med => (
              <option key={med.id} value={med.id}>{med.nombre_completo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Convenio (Seguro Privado)</label>
          <select name="id_convenio" className="input-field" style={{ width: '100%' }}>
            <option value="">Ninguno / Particular</option>
            {convenios.map(conv => (
              <option key={conv.id} value={conv.id}>{conv.nombre_aseguradora}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Fecha *</label>
            <input
              type="date"
              name="fecha"
              required
              min={hoy}
              className="input-field"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Hora *</label>
            <select name="hora" required className="input-field" style={{ width: '100%' }}>
              <option value="">Selecciona una hora</option>
              {horas.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-foreground/10">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ padding: '1rem', fontSize: '1.1rem' }}
          >
            {loading ? 'Agendando...' : 'Confirmar y Proceder al Pago'}
          </button>
        </div>
      </form>
    </>
  )
}
