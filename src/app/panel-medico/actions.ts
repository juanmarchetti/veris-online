'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarCitaEnCurso(idCita: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autorizado.' }

  const { error } = await supabase
    .from('citas')
    .update({ estado: 'en_curso' })
    .eq('id', idCita)

  if (error) return { error: error.message }
  
  revalidatePath('/panel-medico')
  return { success: true }
}

export async function finalizarCita(idCita: string, requiereValoracion: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

  const { error } = await supabase
    .from('citas')
    .update({
      estado: 'finalizada',
      requiere_valoracion_presencial: requiereValoracion
    })
    .eq('id', idCita)

  if (error) return { error: error.message }
  
  revalidatePath('/panel-medico')
  return { success: true }
}

export async function agregarDocumentoClinico(formData: FormData) {
  const idCita = formData.get('idCita') as string
  const tipoDocumento = formData.get('tipoDocumento') as string
  const urlArchivo = formData.get('urlArchivo') as string // Placeholder: en producción sería un archivo en Storage
  
  if (!idCita || !tipoDocumento || !urlArchivo) return { error: 'Datos incompletos.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }

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

  // Obtener id_paciente para el historial clínico
  const { data: cita } = await supabase.from('citas').select('id_paciente').eq('id', idCita).single()
  
  if (cita) {
    await supabase.from('historial_clinico').insert({
      id_paciente: cita.id_paciente,
      tipo_registro: `Documento clínico: ${tipoDocumento}`,
      referencia_documento: doc.id
    })
  }

  revalidatePath('/panel-medico')
  return { success: true }
}
