import { createClient } from './supabase/server'

export type Role = 'paciente' | 'medico' | 'agente_cc' | 'admin'

export async function verificarUsuario(requiredRoles: Role[]) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado', status: 401 }
  }

  // Obtener el rol y estado del usuario desde la tabla perfiles
  // Usamos select('*') en lugar de select('rol, activo') para que no falle 
  // en ambientes donde la migración 0011 (columna activo) aún no se ha aplicado.
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) {
    console.error('Error fetching perfil:', perfilError)
    return { error: 'Perfil no encontrado', status: 403 }
  }

  if (perfil.activo === false) {
    return { error: 'Tu cuenta ha sido suspendida. Contacta a soporte.', status: 403 }
  }

  const userRole = perfil.rol as Role

  if (!requiredRoles.includes(userRole)) {
    return { error: 'Prohibido - Rol insuficiente', status: 403 }
  }

  return { user, role: userRole }
}
