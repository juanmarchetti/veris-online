'use server'

import { verificarUsuario } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/* ─── Especialidades ─── */

export async function crearEspecialidad(formData: FormData) {
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) return { error: 'No autorizado.' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const precioBase = parseFloat(formData.get('precioBase') as string)

  if (!nombre) return { error: 'El nombre es requerido.' }
  if (isNaN(precioBase) || precioBase < 0) return { error: 'Precio inválido.' }

  const admin = createAdminClient()
  const { error } = await admin.from('especialidades').insert({ nombre, precio_base: precioBase })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe una especialidad con ese nombre.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function editarEspecialidad(formData: FormData) {
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) return { error: 'No autorizado.' }

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const precioBase = parseFloat(formData.get('precioBase') as string)

  if (!id || !nombre) return { error: 'Datos incompletos.' }
  if (isNaN(precioBase) || precioBase < 0) return { error: 'Precio inválido.' }

  const admin = createAdminClient()
  const { error } = await admin.from('especialidades').update({ nombre, precio_base: precioBase }).eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe una especialidad con ese nombre.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function eliminarEspecialidad(id: string) {
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) return { error: 'No autorizado.' }

  const admin = createAdminClient()
  const { error } = await admin.from('especialidades').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') return { error: 'No se puede eliminar: hay médicos o citas vinculados a esta especialidad.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { error: null }
}

/* ─── Convenios ─── */

export async function crearConvenio(formData: FormData) {
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) return { error: 'No autorizado.' }

  const nombre = (formData.get('nombre') as string)?.trim()
  if (!nombre) return { error: 'El nombre es requerido.' }

  const admin = createAdminClient()
  const { error } = await admin.from('convenios').insert({ nombre_aseguradora: nombre })

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un convenio con ese nombre.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function editarConvenio(formData: FormData) {
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) return { error: 'No autorizado.' }

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string)?.trim()

  if (!id || !nombre) return { error: 'Datos incompletos.' }

  const admin = createAdminClient()
  const { error } = await admin.from('convenios').update({ nombre_aseguradora: nombre }).eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un convenio con ese nombre.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { error: null }
}

export async function eliminarConvenio(id: string) {
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) return { error: 'No autorizado.' }

  const admin = createAdminClient()
  const { error } = await admin.from('convenios').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') return { error: 'No se puede eliminar: hay citas vinculadas a este convenio.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { error: null }
}
