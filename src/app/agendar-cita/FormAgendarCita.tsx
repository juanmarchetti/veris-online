'use client'

import { useState, useMemo, useEffect } from 'react'
import { crearCita, getDisponibilidadMedico } from './actions'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, startOfToday } from 'date-fns'
import { es } from 'date-fns/locale'

type Especialidad = { id: string; nombre: string }
type Medico = { id: string; nombre_completo: string; id_especialidad: string }
type Convenio = { id: string; nombre_aseguradora: string }

type Props = {
  especialidades: Especialidad[]
  medicos: Medico[]
  convenios: Convenio[]
  tieneHistorialClinico: boolean
}

// Opciones de duración
const DURACIONES = [
  { valor: 30, etiqueta: '30 minutos' },
  { valor: 60, etiqueta: '1 hora' },
  { valor: 90, etiqueta: '1 hora 30 minutos' },
  { valor: 120, etiqueta: '2 horas' }
]

export default function FormAgendarCita({ especialidades, medicos, convenios, tieneHistorialClinico }: Props) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('')
  const [medicoSeleccionado, setMedicoSeleccionado] = useState('')
  const [duracion, setDuracion] = useState(60)
  
  const [fecha, setFecha] = useState<Date | undefined>(undefined)
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([])
  const [cargandoHoras, setCargandoHoras] = useState(false)

  // Filtrar médicos por especialidad seleccionada
  const medicosFiltrados = useMemo(() => {
    if (!especialidadSeleccionada) return medicos
    return medicos.filter(m => m.id_especialidad === especialidadSeleccionada)
  }, [especialidadSeleccionada, medicos])

  // Efecto para buscar horas cuando cambian los dependientes
  useEffect(() => {
    setHoraSeleccionada('')
    if (!medicoSeleccionado || !fecha) {
      setHorasDisponibles([])
      return
    }

    let active = true
    setCargandoHoras(true)
    
    // Formato ISO string para enviar al server (timezone neutral para el día)
    const fechaISO = format(fecha, "yyyy-MM-dd'T'12:00:00'Z'")
    
    getDisponibilidadMedico(medicoSeleccionado, fechaISO, duracion)
      .then(res => {
        if (!active) return
        if (res.error) {
          setError(res.error)
          setHorasDisponibles([])
        } else {
          setHorasDisponibles(res.slots || [])
        }
        setCargandoHoras(false)
      })
      .catch(err => {
        if (!active) return
        setError('Ocurrió un error en el servidor al calcular disponibilidad. Revisa la consola.')
        setHorasDisponibles([])
        setCargandoHoras(false)
      })

    return () => { active = false }
  }, [medicoSeleccionado, fecha, duracion])

  // Fecha mínima: hoy
  const hoy = startOfToday()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    if (!fecha || !horaSeleccionada) {
      setError('Por favor selecciona una fecha y una hora.')
      setLoading(false)
      return
    }
    
    // Inyectar fecha, hora y duración al FormData antes de enviarlo
    formData.set('fecha', format(fecha, 'yyyy-MM-dd'))
    formData.set('hora', horaSeleccionada)
    formData.set('duracion_minutos', duracion.toString())

    const result = await crearCita(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si no hay error, el server action redirige a /pago
  }

  return (
    <>
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
            onChange={(e) => {
              setEspecialidadSeleccionada(e.target.value)
              setMedicoSeleccionado('')
            }}
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
          <select 
            name="id_medico" 
            required 
            className="input-field" 
            style={{ width: '100%' }}
            value={medicoSeleccionado}
            onChange={(e) => setMedicoSeleccionado(e.target.value)}
          >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-sm font-medium mb-1 block">Duración de la consulta *</label>
            <select 
              className="input-field mb-6" 
              style={{ width: '100%' }}
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
            >
              {DURACIONES.map(d => (
                <option key={d.valor} value={d.valor}>{d.etiqueta}</option>
              ))}
            </select>

            <label className="text-sm font-medium mb-1 block">Fecha de la cita *</label>
            <div className="p-4 border rounded-md bg-white flex justify-center">
              <DayPicker
                mode="single"
                selected={fecha}
                onSelect={setFecha}
                disabled={{ before: hoy }}
                locale={es}
              />
            </div>
            {!medicoSeleccionado && (
              <p className="text-xs text-amber-600 mt-2">Selecciona un médico primero para ver disponibilidad.</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Hora disponible *</label>
            <div className="border rounded-md bg-white p-4 min-h-[300px]">
              {cargandoHoras ? (
                <div className="flex justify-center items-center h-full text-sm text-gray-500">
                  Calculando disponibilidad...
                </div>
              ) : !fecha ? (
                <div className="flex justify-center items-center h-full text-sm text-gray-500 text-center">
                  Selecciona una fecha en el calendario<br/>para ver las horas disponibles.
                </div>
              ) : horasDisponibles.length === 0 ? (
                <div className="flex justify-center items-center h-full text-sm text-red-500 font-medium bg-red-50 rounded p-4 text-center">
                  El médico no tiene turnos disponibles este día para la duración seleccionada.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {horasDisponibles.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHoraSeleccionada(h)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        horaSeleccionada === h 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-surface border hover:border-primary text-foreground'
                      } border`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
              {horaSeleccionada && (
                <div className="mt-6 p-3 bg-primary/10 rounded border border-primary/20 text-sm text-center">
                  Hora seleccionada: <strong>{horaSeleccionada}</strong>
                </div>
              )}
            </div>
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
