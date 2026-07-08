'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { verificarUsuario } from '@/utils/auth'

export async function marcarHistorialClinicoRegistrado(idPaciente: string) {
  const { error: authError, user } = await verificarUsuario(['agente_cc', 'admin'])
  if (authError || !user) return { error: 'No autorizado.' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('pacientes')
    .update({ historial_clinico_veris: true })
    .eq('id', idPaciente)

  if (error) return { error: error.message }
  
  revalidatePath('/panel-cc')
  return { success: true }
}
