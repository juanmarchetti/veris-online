'use server'

import { createClient } from '@/utils/supabase/server'

export async function actualizarAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const file = formData.get('avatar') as File
  if (!file) return { error: 'No se envió ningún archivo' }

  try {
    // 1. Subir archivo a storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // 3. Actualizar tabla perfiles
    const { error: updateError } = await supabase
      .from('perfiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) throw updateError

    return { avatar_url: publicUrl }
  } catch (err: unknown) {
    console.error('Error actualizando avatar:', err)
    return { error: 'Hubo un error al guardar la imagen.' }
  }
}

export async function actualizarConfiguracionAdmin(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Verificar rol admin
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') {
    return { error: 'Acceso denegado' }
  }

  const titular_cuenta = formData.get('titular_cuenta') as string
  const numero_cuenta = formData.get('numero_cuenta') as string
  const banco = formData.get('banco') as string
  const tipo_cuenta = formData.get('tipo_cuenta') as string

  try {
    // Upsert on id_admin
    const { error } = await supabase
      .from('configuracion_admin')
      .upsert({
        id_admin: user.id,
        titular_cuenta,
        numero_cuenta,
        banco,
        tipo_cuenta,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'id_admin' })

    if (error) throw error
    return { success: true }
  } catch (err: unknown) {
    console.error('Error guardando configuración admin:', err)
    return { error: 'No se pudo guardar la configuración bancaria.' }
  }
}
