'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'


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
  const montoConsulta = especialidad.precio_base || 25.00

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
