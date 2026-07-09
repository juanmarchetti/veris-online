'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verificarUsuario } from '@/utils/auth'

export async function marcarCitaEnCurso(idCita: string) {
  const { error: authError, user } = await verificarUsuario(['medico'])
  if (authError || !user) return { error: 'No autorizado.' }

  const supabase = await createClient()

  // Verify medico profile
  const { data: medico } = await supabase
    .from('medicos')
    .select('id')
    .eq('id_auth_user', user.id)
    .single()
  
  if (!medico) return { error: 'Perfil médico no encontrado.' }

  const { data, error } = await supabase
    .from('citas')
    .update({ estado: 'en_curso' })
    .eq('id', idCita)
    .eq('id_medico', medico.id)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'No se pudo actualizar. La cita no existe o no te pertenece.' }
  
  revalidatePath('/panel-medico')
  return { success: true }
}
export async function finalizarCitaMedico(
  idCita: string, 
  datosDiagnostico: {
    sintomas_reportados: string,
    diagnostico: string,
    tratamiento_indicado: string,
    observaciones: string,
    requiere_valoracion_presencial: boolean
  }
) {
  const { error: authError, user } = await verificarUsuario(['medico'])
  if (authError || !user) return { error: 'No autorizado.' }

  const supabase = await createClient()

  // Verify medico profile
  const { data: medico } = await supabase
    .from('medicos')
    .select('id')
    .eq('id_auth_user', user.id)
    .single()
  
  if (!medico) return { error: 'Perfil médico no encontrado.' }

  // Check cita exists and get patient info for email
  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .select('id, id_paciente, pacientes(correo, nombre_completo)')
    .eq('id', idCita)
    .eq('id_medico', medico.id)
    .single()

  if (citaError || !cita) return { error: 'No se pudo actualizar. La cita no existe o no te pertenece.' }

  // Update cita status
  const { error: updateError } = await supabase
    .from('citas')
    .update({ 
      estado: 'finalizada',
      requiere_valoracion_presencial: datosDiagnostico.requiere_valoracion_presencial
    })
    .eq('id', idCita)

  if (updateError) return { error: updateError.message }
  
  // Insert in historial_clinico
  const { error: historialError } = await supabase.from('historial_clinico').insert({
    id_paciente: cita.id_paciente,
    id_medico: medico.id,
    id_cita: idCita,
    tipo_registro: 'Diagnóstico de Videoconsulta',
    sintomas_reportados: datosDiagnostico.sintomas_reportados,
    diagnostico: datosDiagnostico.diagnostico,
    tratamiento_indicado: datosDiagnostico.tratamiento_indicado,
    observaciones: datosDiagnostico.observaciones,
    requiere_valoracion_presencial: datosDiagnostico.requiere_valoracion_presencial
  })

  if (historialError) {
    console.error('Error insertando en historial', historialError)
    return { error: 'Error al guardar el historial clínico.' }
  }

  // Notificar al paciente por correo (simulado o real)
  const isResendEnabled = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '';
  if (isResendEnabled) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const paciente = cita.pacientes as unknown as { correo: string, nombre_completo: string }
      
      await resend.emails.send({
        from: 'Veris Online <onboarding@resend.dev>',
        to: paciente.correo,
        subject: 'Diagnóstico de Videoconsulta Disponible',
        html: `
          <h1>Diagnóstico de Videoconsulta</h1>
          <p>Hola ${paciente.nombre_completo},</p>
          <p>Tu médico ha finalizado la videoconsulta y el diagnóstico ya está disponible en tu portal.</p>
          <p>Ingresa a <strong>Veris Online -> Mis Citas -> Historial Clínico</strong> para verlo y descargar el PDF.</p>
          <br/>
          <p>Gracias por usar Veris Online.</p>
        `
      })
    } catch (err) {
      console.error('Error enviando correo de diagnóstico:', err)
    }
  }

  revalidatePath('/panel-medico')
  return { success: true }
}

export async function agregarDocumentoClinico(formData: FormData) {
  const idCita = formData.get('idCita') as string
  const tipoDocumento = formData.get('tipoDocumento') as string
  const urlArchivo = formData.get('urlArchivo') as string // Placeholder: en producción sería un archivo en Storage
  
  if (!idCita || !tipoDocumento || !urlArchivo) return { error: 'Datos incompletos.' }

  const { error: authError, user } = await verificarUsuario(['medico'])
  if (authError || !user) return { error: 'No autorizado.' }

  const supabase = await createClient()

  // Verify medico profile
  const { data: medico } = await supabase
    .from('medicos')
    .select('id')
    .eq('id_auth_user', user.id)
    .single()
  
  if (!medico) return { error: 'Perfil médico no encontrado.' }

  // Verify cita belongs to medico
  const { data: cita } = await supabase
    .from('citas')
    .select('id_paciente')
    .eq('id', idCita)
    .eq('id_medico', medico.id)
    .single()

  if (!cita) return { error: 'La cita no existe o no te pertenece.' }

  // Insertar en documentos_clinicos
  const { data: doc, error: docError } = await supabase
    .from('documentos_clinicos')
    .insert({
      id_cita: idCita,
      tipo_documento: tipoDocumento,
      url_archivo: urlArchivo
    })
    .select('id')
    .single()

  if (docError) return { error: docError.message }

  // Crear registro en historial clínico
  await supabase.from('historial_clinico').insert({
    id_paciente: cita.id_paciente,
    tipo_registro: `Documento clínico: ${tipoDocumento}`,
    referencia_documento: doc.id
  })

  // TAREA D: Enviar correo de notificación de documento clínico
  try {
    const { enviarCorreoDocumentoClinico } = await import('@/utils/resend')
    await enviarCorreoDocumentoClinico(doc.id)
  } catch (err) {
    console.error('Error al enviar el correo de documento clínico:', err)
  }

  revalidatePath('/panel-medico')
  return { success: true }
}

export async function actualizarHorarioMedico(formData: FormData) {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado. Inicia sesión nuevamente.' }
  }

  // 2. Extraer datos
  const hora_entrada = formData.get('hora_entrada') as string
  const hora_salida = formData.get('hora_salida') as string
  const diasRaw = formData.get('dias_laborables') as string
  
  if (!hora_entrada || !hora_salida || !diasRaw) {
    return { error: 'Faltan datos requeridos.' }
  }

  let dias_laborables: number[]
  try {
    dias_laborables = JSON.parse(diasRaw)
  } catch {
    return { error: 'Formato de días inválido.' }
  }

  // 3. Actualizar la base de datos (Usando Admin Client para saltar RLS en catálogos)
  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient
    .from('medicos')
    .update({ hora_entrada, hora_salida, dias_laborables })
    .eq('id_auth_user', user.id)

  if (updateError) {
    return { error: 'Error al actualizar el horario: ' + updateError.message }
  }

  revalidatePath('/panel-medico')
  return { ok: true }
}
