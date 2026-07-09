'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * crearCita — Server Action de respaldo para compatibilidad.
 * El nuevo flujo usa POST /api/agenda-automatica directamente.
 */
export async function crearCita(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado. Inicia sesión nuevamente.' }
  }

  const { data: paciente, error: pacError } = await supabase
    .from('pacientes')
    .select('id, historial_clinico_veris')
    .eq('id_auth_user', user.id)
    .single()

  if (pacError || !paciente) {
    return { error: 'No se encontró tu perfil de paciente.' }
  }

  if (paciente.historial_clinico_veris === false) {
    return { error: 'Debes tener historial clínico en Veris para agendar citas.' }
  }
const id_especialidad  = formData.get('id_especialidad') as string
  const id_medico        = formData.get('id_medico') as string
  const id_convenio      = (formData.get('id_convenio') as string) || null
  const motivo_consulta  = formData.get('motivo_consulta') as string
  const fecha            = formData.get('fecha') as string
  const hora             = formData.get('hora') as string
  const duracion_minutos = parseInt(formData.get('duracion_minutos') as string) || 60

  if (!id_especialidad || !id_medico || !motivo_consulta || !fecha || !hora) {
    return { error: 'Todos los campos obligatorios deben ser completados.' }
  }

  const { validarHoraCita, validarFechaFutura, validarDiaCita } = await import('@/utils/validaciones-cita')

  const errorHora = validarHoraCita(hora)
  if (errorHora) return { error: errorHora }

  const fecha_hora = new Date(`${fecha}T${hora}:00-05:00`)

  if (isNaN(fecha_hora.getTime())) {
    return { error: 'La fecha u hora seleccionada no es válida.' }
  }

  const errorFutura = validarFechaFutura(fecha_hora)
  if (errorFutura) return { error: errorFutura }
  
  const errorDia = validarDiaCita(fecha_hora)
  if (errorDia) return { error: errorDia }

  const { data: especialidad, error: espError } = await supabase
    .from('especialidades')
    .select('precio_base')
    .eq('id', id_especialidad)
    .single()

  if (espError || !especialidad) {
    return { error: 'Especialidad no encontrada.' }
  }

  const precioBaseHora  = (especialidad as { precio_base?: number }).precio_base ?? 25.00
  const montoConsulta   = (precioBaseHora / 60) * duracion_minutos

  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .insert({
      id_paciente:      paciente.id,
      id_medico,
      id_especialidad,
      id_convenio:      id_convenio || null,
      fecha_hora:       fecha_hora.toISOString(),
      motivo_consulta,
      duracion_minutos,
      estado:           'pendiente_pago',
      canal_origen:     'Web'
    })
    .select('id')
    .single()

  if (citaError) {
    if (citaError.code === '23505') {
      return { error: 'Ese horario ya no está disponible para este médico, elige otro.' }
    }
    return { error: 'Error al crear la cita: ' + citaError.message }
  }

  const fechaLimite = new Date(Date.now() + 30 * 60 * 1000)
  const { error: pagoError } = await supabase
    .from('pagos')
    .insert({
      id_cita:           cita!.id,
      monto:             montoConsulta,
      fecha_limite_pago: fechaLimite.toISOString(),
      estado_pago:       'pendiente'
    })

  if (pagoError) {
    await supabase.from('citas').delete().eq('id', cita!.id)
    return { error: 'Error al crear el registro de pago: ' + pagoError.message }
  }

  redirect(`/pago?cita=${cita!.id}`)
}

export async function crearSolicitudUrgente(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado. Inicia sesión nuevamente.' }
  }

  const { data: paciente, error: pacError } = await supabase
    .from('pacientes')
    .select('id, historial_clinico_veris')
    .eq('id_auth_user', user.id)
    .single()

  if (pacError || !paciente) {
    return { error: 'No se encontró tu perfil de paciente.' }
  }

  if (paciente.historial_clinico_veris === false) {
    return { error: 'Debes tener historial clínico en Veris para agendar citas urgentes.' }
  }

  const id_especialidad  = formData.get('id_especialidad') as string
  const id_medico        = formData.get('id_medico') as string
  const id_convenio      = (formData.get('id_convenio') as string) || null
  const motivo_consulta  = formData.get('motivo_consulta') as string
  const duracion_minutos = 30

  if (!id_especialidad || !id_medico || !motivo_consulta) {
    return { error: 'Todos los campos obligatorios deben ser completados.' }
  }

  const { data: especialidad, error: espError } = await supabase
    .from('especialidades')
    .select('precio_base')
    .eq('id', id_especialidad)
    .single()

  if (espError || !especialidad) {
    return { error: 'Especialidad no encontrada.' }
  }

  const precioBaseHora  = (especialidad as { precio_base?: number }).precio_base ?? 25.00
  const montoConsulta   = (precioBaseHora / 60) * duracion_minutos

  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .insert({
      id_paciente:      paciente.id,
      id_medico,
      id_especialidad,
      id_convenio:      id_convenio || null,
      fecha_hora:       new Date().toISOString(),
      motivo_consulta,
      duracion_minutos,
      estado:           'pendiente_aceptacion_medico',
      canal_origen:     'Web',
      es_urgente:       true
    })
    .select('id')
    .single()

  if (citaError) {
    return { error: 'Error al solicitar cita urgente: ' + citaError.message }
  }

  const fechaLimite = new Date(Date.now() + 30 * 60 * 1000)
  const { error: pagoError } = await supabase
    .from('pagos')
    .insert({
      id_cita:           cita!.id,
      monto:             montoConsulta,
      fecha_limite_pago: fechaLimite.toISOString(),
      estado_pago:       'pendiente'
    })

  if (pagoError) {
    await supabase.from('citas').delete().eq('id', cita!.id)
    return { error: 'Error al crear el registro de pago: ' + pagoError.message }
  }

  redirect(`/urgencia/esperando?cita=${cita!.id}`)
}
