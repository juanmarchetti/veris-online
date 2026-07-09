'use server'

import { verificarUsuario } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function validarHistorialPaciente(formData: FormData): Promise<void> {
  const { error: authError, user } = await verificarUsuario(['agente_cc', 'admin'])
  if (authError) {
    return
  }

  const pacienteId = formData.get('pacienteId') as string | null
  const observacion = (formData.get('observacion') as string | null)?.trim() || null

  if (!pacienteId) {
    return
  }

  const supabase = await createClient()

  const { data: pacienteActual } = await supabase
    .from('pacientes')
    .select('historial_clinico_veris')
    .eq('id', pacienteId)
    .single()

  const { error } = await supabase
    .from('pacientes')
    .update({ historial_clinico_veris: true })
    .eq('id', pacienteId)

  if (error) {
    return
  }

  const { error: logError } = await supabase
    .from('contact_center_validaciones')
    .insert({
      id_paciente: pacienteId,
      id_agente: user?.id,
      estado_anterior: pacienteActual?.historial_clinico_veris ?? false,
      estado_nuevo: true,
      observacion,
    })

  if (logError) {
    console.error('No se pudo registrar la auditoria de Contact Center:', logError)
  }

  revalidatePath('/panel-cc')
  revalidatePath('/agendar-cita')
}
