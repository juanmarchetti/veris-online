import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener rol y avatar_url del perfil base
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, avatar_url')
    .eq('id', user.id)
    .single()

  const rol = perfil?.rol

  // Obtener nombre según el rol
  let nombreUsuario = user.email || ''
  
  if (rol === 'paciente') {
    const { data: paciente } = await supabase.from('pacientes').select('nombre_completo').eq('id_auth_user', user.id).single()
    if (paciente) nombreUsuario = paciente.nombre_completo
  } else if (rol === 'medico') {
    const { data: medico } = await supabase.from('medicos').select('nombre_completo').eq('id_auth_user', user.id).single()
    if (medico) nombreUsuario = medico.nombre_completo
  }

  // Si es admin, cargar su configuración bancaria
  let configuracionAdmin = null
  if (rol === 'admin') {
    const { data: config } = await supabase
      .from('configuracion_admin')
      .select('*')
      .eq('id_admin', user.id)
      .maybeSingle()
    
    configuracionAdmin = config
  }

  return (
    <main className="max-w-4xl mx-auto p-6 w-full">
      <h1 className="text-3xl font-bold text-primary mb-6">Mi Perfil</h1>
      
      <ProfileClient 
        user={{
          id: user.id,
          email: user.email || '',
          rol: rol || 'paciente',
          nombre: nombreUsuario,
          avatar_url: perfil?.avatar_url || ''
        }}
        configuracionAdmin={configuracionAdmin}
      />
    </main>
  )
}
