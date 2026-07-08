'use server'

import { createClient } from '@/utils/supabase/server'
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

export async function finalizarCita(idCita: string, requiereValoracion: boolean) {
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
    .update({
      estado: 'finalizada',
      requiere_valoracion_presencial: requiereValoracion
    })
    .eq('id', idCita)
    .eq('id_medico', medico.id)
    .select()

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'No se pudo actualizar. La cita no existe o no te pertenece.' }
  
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

  revalidatePath('/panel-medico')
  return { success: true }
}
