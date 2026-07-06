import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AgendarCitaPage() {
  const { error, status } = await verificarUsuario(['paciente'])
  
  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">Solo los pacientes registrados pueden agendar citas.</p>
      </main>
    )
  }

  const supabase = await createClient()

  // Consultar catálogos
  const [{ data: especialidades }, { data: medicos }, { data: convenios }] = await Promise.all([
    supabase.from('especialidades').select('id, nombre').order('nombre'),
    supabase.from('medicos').select('id, nombre_completo, id_especialidad').order('nombre_completo'),
    supabase.from('convenios').select('id, nombre_aseguradora').order('nombre_aseguradora')
  ])

  return (
    <main className="flex flex-col items-center p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">Agendar Videoconsulta</h1>
      
      <form className="w-full bg-white dark:bg-black/20 p-8 rounded-xl shadow-lg border border-foreground/5 flex flex-col gap-6">
        
        <div>
          <label className="text-sm font-medium mb-1 block">Motivo de consulta</label>
          <textarea 
            name="motivo_consulta" 
            rows={3} 
            placeholder="Por favor detalla tus síntomas..."
            required 
            className="w-full p-3 border rounded-md bg-white dark:bg-black"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Especialidad</label>
          <select name="id_especialidad" required className="w-full p-3 border rounded-md bg-white dark:bg-black">
            <option value="">Selecciona una especialidad</option>
            {especialidades?.map(esp => (
              <option key={esp.id} value={esp.id}>{esp.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Médico (Opcional)</label>
          <select name="id_medico" className="w-full p-3 border rounded-md bg-white dark:bg-black">
            <option value="">Cualquier médico disponible</option>
            {medicos?.map(med => (
              <option key={med.id} value={med.id}>{med.nombre_completo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Convenio (Seguro Privado)</label>
          <select name="id_convenio" className="w-full p-3 border rounded-md bg-white dark:bg-black">
            <option value="">Ninguno / Particular</option>
            {convenios?.map(conv => (
              <option key={conv.id} value={conv.id}>{conv.nombre_aseguradora}</option>
            ))}
          </select>
        </div>
        
        <div className="pt-4 border-t border-foreground/10">
          <button 
            type="button" 
            className="w-full bg-primary text-white p-4 rounded-md font-bold hover:bg-primary/90 transition-colors"
          >
            Buscar Horarios Disponibles
          </button>
        </div>
      </form>
    </main>
  );
}
