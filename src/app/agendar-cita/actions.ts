'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { addMinutes, format, isSameDay, parseISO, startOfDay, endOfDay, isBefore, isAfter, isEqual } from 'date-fns'


export async function crearCita(formData: FormData) {
  const supabase = await createClient()

  // 1. Autenticar usuario
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado. Inicia sesión nuevamente.' }
  }

  // 2. Obtener el id del paciente y su estado de historial
  const { data: paciente, error: pacError } = await supabase
    .from('pacientes')
    .select('id, historial_clinico_veris')
    .eq('id_auth_user', user.id)
    .single()

  if (pacError || !paciente) {
    return { error: 'No se encontró tu perfil de paciente.' }
  }

  if (!paciente.historial_clinico_veris) {
    return { error: 'Debes comunicarte al Contact Center (6009600) para registrar tu historial clínico antes de poder agendar.' }
  }

  // 3. Extraer y validar datos del formulario
  const id_especialidad = formData.get('id_especialidad') as string
  const id_medico = formData.get('id_medico') as string
  const id_convenio = (formData.get('id_convenio') as string) || null
  const motivo_consulta = formData.get('motivo_consulta') as string
  const fecha = formData.get('fecha') as string
  const hora = formData.get('hora') as string
  const duracion_minutos = parseInt(formData.get('duracion_minutos') as string) || 60

  if (!id_especialidad || !id_medico || !motivo_consulta || !fecha || !hora) {
    return { error: 'Todos los campos obligatorios deben ser completados.' }
  }

  const { validarHoraCita, validarDiaCita, validarFechaFutura } = await import('@/utils/validaciones-cita')

  const errorHora = validarHoraCita(hora)
  if (errorHora) return { error: errorHora }

  // Construir fecha_hora en formato ISO
  const fecha_hora = new Date(`${fecha}T${hora}:00`)

  if (isNaN(fecha_hora.getTime())) {
    return { error: 'La fecha u hora seleccionada no es válida.' }
  }

  const errorFutura = validarFechaFutura(fecha_hora)
  if (errorFutura) return { error: errorFutura }

  const errorDia = validarDiaCita(fecha_hora)
  if (errorDia) return { error: errorDia }

  // Extraer precio base de la especialidad
  const { data: especialidad, error: espError } = await supabase
    .from('especialidades')
    .select('precio_base')
    .eq('id', id_especialidad)
    .single()

  if (espError || !especialidad) {
    return { error: 'Especialidad no encontrada.' }
  }
  const precioBaseHora = especialidad.precio_base || 25.00
  const montoConsulta = (precioBaseHora / 60) * duracion_minutos

  // TODO: Agregar validación de conflicto en servidor para prevenir dobles reservas
  // ... (el conflicto real a nivel BD requeriría una constraint temporal sofisticada,
  // pero lo haremos en getDisponibilidadMedico en el cliente para UX por ahora).

  // 4. Insertar cita
  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .insert({
      id_paciente: paciente.id,
      id_medico,
      id_especialidad,
      id_convenio: id_convenio || null,
      fecha_hora: fecha_hora.toISOString(),
      motivo_consulta,
      duracion_minutos,
      estado: 'pendiente_pago',
      canal_origen: 'Web'
    })
    .select('id')
    .single()

  if (citaError) {
    // Error 23505 = violación de unicidad (doble reserva)
    if (citaError.code === '23505') {
      return { error: 'Ese horario ya no está disponible para este médico, elige otro.' }
    }
    return { error: 'Error al crear la cita: ' + citaError.message }
  }

  // 5. Crear registro de pago vinculado
  const fechaLimite = new Date(Date.now() + 30 * 60 * 1000) // +30 minutos
  const { error: pagoError } = await supabase
    .from('pagos')
    .insert({
      id_cita: cita.id,
      monto: montoConsulta,
      fecha_limite_pago: fechaLimite.toISOString(),
      estado_pago: 'pendiente'
    })

  if (pagoError) {
    // Si falla el pago, eliminamos la cita huérfana
    await supabase.from('citas').delete().eq('id', cita.id)
    return { error: 'Error al crear el registro de pago: ' + pagoError.message }
  }

  // 6. Redirigir al pago
  redirect(`/pago?cita=${cita.id}`)
}

export async function getDisponibilidadMedico(id_medico: string, fechaISO: string, duracionSeleccionada: number) {
  const supabase = await createClient()

  // 1. Obtener horario del médico
  const { data: medico } = await supabase
    .from('medicos')
    .select('dias_laborables, hora_entrada, hora_salida')
    .eq('id', id_medico)
    .single()

  if (!medico) return { error: 'Médico no encontrado' }

  const fechaSeleccionada = new Date(fechaISO)
  const dayOfWeek = fechaSeleccionada.getDay() // 0 = Domingo, 1 = Lunes...

  // Si el médico no trabaja este día
  if (!medico.dias_laborables.includes(dayOfWeek)) {
    return { slots: [] }
  }

  // 2. Obtener todas las citas del médico en ese día (que no estén canceladas)
  const inicioDia = startOfDay(fechaSeleccionada).toISOString()
  const finDia = endOfDay(fechaSeleccionada).toISOString()

  const { data: citas } = await supabase
    .from('citas')
    .select('fecha_hora, duracion_minutos')
    .eq('id_medico', id_medico)
    .neq('estado', 'cancelada')
    .gte('fecha_hora', inicioDia)
    .lte('fecha_hora', finDia)

  const citasDelDia = (citas || []).map(c => ({
    inicio: new Date(c.fecha_hora),
    fin: addMinutes(new Date(c.fecha_hora), c.duracion_minutos + 30) // +30 mins de descanso
  }))

  // 3. Generar slots posibles
  const [horaEnt, minEnt] = medico.hora_entrada.split(':').map(Number)
  const [horaSal, minSal] = medico.hora_salida.split(':').map(Number)
  
  let currentSlot = new Date(fechaSeleccionada)
  currentSlot.setHours(horaEnt, minEnt, 0, 0)
  
  const finJornada = new Date(fechaSeleccionada)
  finJornada.setHours(horaSal, minSal, 0, 0)

  // Ajustar "ahora" a la zona horaria de Ecuador (UTC-5) 
  // para que coincida con la representación local de currentSlot
  const ahoraUTC = new Date()
  const ahora = new Date(ahoraUTC.getTime() - 5 * 60 * 60 * 1000)
  
  const availableSlots: string[] = []

  while (currentSlot < finJornada) {
    const slotFin = addMinutes(currentSlot, duracionSeleccionada)
    
    // El slot propuesto excede el horario de salida
    if (isAfter(slotFin, finJornada)) break

    // No permitir agendar en el pasado
    if (isBefore(currentSlot, ahora) || isEqual(currentSlot, ahora)) {
      currentSlot = addMinutes(currentSlot, 30)
      continue
    }

    // Verificar colisión con alguna cita existente
    const hasConflict = citasDelDia.some(cita => {
      // Conflicto si los intervalos se superponen: Slot empieza antes del fin de la cita Y slot termina después del inicio de la cita
      return isBefore(currentSlot, cita.fin) && isAfter(slotFin, cita.inicio)
    })

    if (!hasConflict) {
      availableSlots.push(format(currentSlot, 'HH:mm'))
    }
    
    currentSlot = addMinutes(currentSlot, 30)
  }

  return { slots: availableSlots }
}
