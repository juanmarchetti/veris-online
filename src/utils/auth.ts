import { createClient } from './supabase/server'

type Role = 'paciente' | 'medico' | 'agente_cc' | 'admin'

export async function verificarUsuario(requiredRoles: Role[]) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado', status: 401 }
  }

  // En Supabase, los roles podrían estar en app_metadata o en una tabla de perfiles.
  // Asumiremos que están en user.user_metadata.role o app_metadata.role para este scaffold
  // o consultaremos una tabla 'usuarios_roles' si fuera necesario.
  // Por simplicidad, tomamos app_metadata.role.
  
  const userRole = user.app_metadata?.role as Role | undefined

  if (!userRole || !requiredRoles.includes(userRole)) {
    return { error: 'Prohibido - Rol insuficiente', status: 403 }
  }

  return { user, role: userRole }
}
