// Fix #3 y #4: Panel de Administración ampliado con gestión de usuarios y roles.
// Mantiene las estadísticas originales intactas y agrega la sección de usuarios debajo.

// Forzar renderizado dinámico: página autenticada que usa admin client con service_role.
export const dynamic = 'force-dynamic'

import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import GestionUsuarios, { type UsuarioConRol } from './GestionUsuarios'
import GestionCatalogos from './GestionCatalogos'

export default async function AdminPage() {
  const { error, status } = await verificarUsuario(['admin'])
  
  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">No tienes permisos de administrador.</p>
      </main>
    )
  }

  const supabase = await createClient()

  // Consultar estadisticas basicas (como somos admin por RLS, vemos todo)
  const [
    { count: totalPacientes },
    { count: totalMedicos },
    { count: totalCitas }
  ] = await Promise.all([
    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
    supabase.from('medicos').select('*', { count: 'exact', head: true }),
    supabase.from('citas').select('*', { count: 'exact', head: true })
  ])

  // Fix #3: Obtener lista de todos los usuarios para la sección de gestión.
  // Usamos createAdminClient() (service_role key) para:
  //   a) Acceder a auth.admin.listUsers() y obtener los emails de auth.users
  //   b) Leer todos los perfiles (bypassando RLS, que solo permite leer el propio)
  const adminClient = createAdminClient()

  const [
    { data: authUsersData },
    { data: perfiles },
    { data: especialidades },
    { data: conveniosData },
    { data: especialidadesConPrecio },
  ] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 200 }),
    adminClient.from('perfiles').select('id, rol'),
    adminClient.from('especialidades').select('id, nombre').order('nombre'),
    adminClient.from('convenios').select('id, nombre_aseguradora').order('nombre_aseguradora'),
    adminClient.from('especialidades').select('id, nombre, precio_base').order('nombre'),
  ])

  // Combinar datos de auth.users con el rol de perfiles
  const perfilMap = new Map<string, string>(
    perfiles?.map((p: { id: string; rol: string }) => [p.id, p.rol]) ?? []
  )

  const usuarios: UsuarioConRol[] = (authUsersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? 'Sin correo',
    rol: perfilMap.get(u.id) ?? 'paciente',
  }))

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-primary mb-8">Panel de Administración</h1>
      
      {/* Estadísticas — sin cambios respecto al original */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 text-center">
          <p className="text-foreground/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Pacientes</p>
          <p className="text-5xl font-extrabold text-primary">{totalPacientes ?? 0}</p>
        </div>
        
        <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 text-center">
          <p className="text-foreground/60 text-sm font-semibold uppercase tracking-wider mb-2">Total Médicos</p>
          <p className="text-5xl font-extrabold text-secondary">{totalMedicos ?? 0}</p>
        </div>
        
        <div className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 text-center">
          <p className="text-foreground/60 text-sm font-semibold uppercase tracking-wider mb-2">Citas Registradas</p>
          <p className="text-5xl font-extrabold text-foreground">{totalCitas ?? 0}</p>
        </div>
      </div>

      {/* Divisor */}
      <hr className="my-10 border-foreground/10" />

      {/* Fix #3 y #4: Gestión de usuarios — cambio de roles y creación de perfil médico */}
      <GestionUsuarios
        usuarios={usuarios}
        especialidades={especialidades ?? []}
      />

      {/* Tarea 9: Gestión de catálogos — CRUD de especialidades y convenios */}
      <hr className="my-10 border-foreground/10" />
      <GestionCatalogos
        especialidades={(especialidadesConPrecio ?? []).map((e: { id: string; nombre: string; precio_base: number | null }) => ({ ...e, precio_base: e.precio_base ?? 25.00 }))}
        convenios={conveniosData ?? []}
      />
    </main>
  );
}
