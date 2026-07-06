'use server'

// RF-08 (Admin): Server Actions para gestión de usuarios y roles.
// Todas las mutaciones aquí son privadas — requieren rol 'admin' verificado.

import { verificarUsuario } from '@/utils/auth'
import { actualizarRolUsuario, createAdminClient } from '@/utils/supabase/admin'
import { type Role } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

/**
 * actualizarRolYPerfil — Fix #3 y #4
 *
 * Cambia el rol de un usuario en perfiles y, si el nuevo rol es 'medico',
 * crea la fila correspondiente en la tabla medicos (si aún no existe).
 *
 * El nombre del médico lo ingresa explícitamente el admin en el formulario,
 * no se lee de user_metadata — esto evita el problema de placeholder "Sin nombre
 * asignado" cuando el usuario fue creado directo desde el Dashboard de Supabase.
 *
 * Usa createAdminClient() (service_role key) para bypassar RLS tanto en
 * perfiles como en medicos, dado que el RLS normal solo permite que el usuario
 * modifique su propia fila, no la de terceros.
 *
 * Protegido con verificarUsuario(['admin']) — solo admins pueden invocar esta action.
 */
export async function actualizarRolYPerfil(formData: FormData) {
  // Verificar que quien llama tiene rol admin
  const { error: authError } = await verificarUsuario(['admin'])
  if (authError) {
    return { ok: false, error: 'No autorizado: se requiere rol admin.' }
  }

  const userId = formData.get('userId') as string
  const nuevoRol = formData.get('nuevoRol') as Role
  const idEspecialidad = (formData.get('idEspecialidad') as string) || null
  const nombreMedico = (formData.get('nombreMedico') as string) || null

  if (!userId || !nuevoRol) {
    return { ok: false, error: 'Faltan datos requeridos (userId, nuevoRol).' }
  }

  // 1. Actualizar rol en tabla perfiles via actualizarRolUsuario (usa admin client internamente)
  const { error: rolError } = await actualizarRolUsuario(userId, nuevoRol)
  if (rolError) {
    return { ok: false, error: 'Error al actualizar rol en perfiles: ' + rolError.message }
  }

  // 2. Si el nuevo rol es 'medico', asegurar que exista la fila en tabla medicos.
  //    Sin esta fila, las políticas RLS de citas/documentos_clinicos para médicos
  //    nunca devolverán resultados aunque el campo rol en perfiles esté correcto.
  if (nuevoRol === 'medico') {
    if (!idEspecialidad || !nombreMedico?.trim()) {
      return {
        ok: false,
        error: 'Para el rol médico se requieren la especialidad y el nombre completo.',
      }
    }

    const adminClient = createAdminClient()

    // Verificar si ya existe fila en medicos para este auth user (evitar duplicados)
    const { data: medicoExistente } = await adminClient
      .from('medicos')
      .select('id')
      .eq('id_auth_user', userId)
      .maybeSingle()

    if (!medicoExistente) {
      // Crear nueva fila en medicos con los datos ingresados por el admin
      const { error: medicoError } = await adminClient.from('medicos').insert({
        nombre_completo: nombreMedico.trim(),
        id_especialidad: idEspecialidad,
        id_auth_user: userId,
      })

      if (medicoError) {
        // El rol ya fue actualizado en perfiles; reportar el error parcial
        return {
          ok: false,
          error:
            'Rol actualizado a médico, pero falló la creación del perfil en tabla medicos: ' +
            medicoError.message,
        }
      }
    }
    // Si ya existía medicoExistente, el rol se actualizó y la fila de médico ya estaba — no se toca.
  }

  revalidatePath('/admin')
  return { ok: true, error: null }
}
