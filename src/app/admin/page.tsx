import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-primary mb-8">Panel de Administración</h1>
      
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
      
      <div className="mt-12 bg-surface border border-foreground/10 p-8 rounded-xl text-center">
        <p className="text-foreground/70">
          La gestión avanzada de catálogos y reportes estará disponible próximamente.
        </p>
      </div>
    </main>
  );
}
