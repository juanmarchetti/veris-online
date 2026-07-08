'use client'

import { useState } from 'react'
import { actualizarHorarioMedico } from './actions'

type HorarioMedico = {
  hora_entrada: string
  hora_salida: string
  dias_laborables: number[]
}

const DIAS = [
  { valor: 1, etiqueta: 'Lunes' },
  { valor: 2, etiqueta: 'Martes' },
  { valor: 3, etiqueta: 'Miércoles' },
  { valor: 4, etiqueta: 'Jueves' },
  { valor: 5, etiqueta: 'Viernes' },
  { valor: 6, etiqueta: 'Sábado' },
  { valor: 0, etiqueta: 'Domingo' }
]

export default function ConfiguracionHorario({ horarioInicial }: { horarioInicial: HorarioMedico }) {
  const [horaEntrada, setHoraEntrada] = useState(horarioInicial.hora_entrada.slice(0, 5))
  const [horaSalida, setHoraSalida] = useState(horarioInicial.hora_salida.slice(0, 5))
  const [diasLaborables, setDiasLaborables] = useState<number[]>(horarioInicial.dias_laborables)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleDiaToggle = (dia: number) => {
    setDiasLaborables(prev => 
      prev.includes(dia) 
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')
    
    const formData = new FormData()
    formData.set('hora_entrada', horaEntrada)
    formData.set('hora_salida', horaSalida)
    formData.set('dias_laborables', JSON.stringify(diasLaborables))
    
    const res = await actualizarHorarioMedico(formData)
    setCargando(false)
    
    if (res?.error) {
      setMensaje('Error: ' + res.error)
    } else {
      setMensaje('Horario actualizado con éxito.')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 mb-8">
      <h2 className="text-xl font-semibold mb-4">Configurar Mi Horario Laboral</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hora de entrada</label>
            <input 
              type="time" 
              required
              value={horaEntrada}
              onChange={e => setHoraEntrada(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora de salida</label>
            <input 
              type="time" 
              required
              value={horaSalida}
              onChange={e => setHoraSalida(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Días Laborables</label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map(dia => {
              const seleccionado = diasLaborables.includes(dia.valor)
              return (
                <button
                  key={dia.valor}
                  type="button"
                  onClick={() => handleDiaToggle(dia.valor)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                    seleccionado 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-surface text-foreground border-foreground/20 hover:border-primary'
                  }`}
                >
                  {dia.etiqueta}
                </button>
              )
            })}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={cargando || diasLaborables.length === 0}
          className="mt-2 bg-primary text-white px-4 py-2 rounded-md font-bold self-start hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Guardar Horario'}
        </button>
        
        {mensaje && (
          <p className={`text-sm mt-2 ${mensaje.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  )
}
