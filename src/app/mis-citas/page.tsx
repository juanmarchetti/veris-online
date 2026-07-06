import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Interface estricta requerida por la arquitectura
type CitaRespuesta = {
  id: string;
  fecha_hora: string;
  estado: string;
  enlace_zoom: string | null;
  especialidades: { nombre: string } | null;
  medicos: { nombre_completo: string } | null;
};

export default async function MisCitasPage() {
  const { error, status } = await verificarUsuario(['paciente'])
  
  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="mt-4 text-center">Solo los pacientes pueden ver sus citas.</p>
      </main>
    )
  }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from('citas')
    .select(`
      id, 
      fecha_hora, 
      estado, 
      enlace_zoom,
      especialidades(nombre),
      medicos(nombre_completo)
    `)
    .order('fecha_hora', { ascending: false })

  // Transformar de forma segura al tipo CitaRespuesta
  const citas = data as unknown as CitaRespuesta[] | null;

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-primary mb-8">Mis Videoconsultas</h1>
      
      {dbError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">Error al cargar las citas: {dbError.message}</div>
      ) : !citas || citas.length === 0 ? (
        <div className="bg-surface border border-foreground/10 p-8 rounded-xl text-center text-foreground/60">
          No tienes ninguna cita registrada.
        </div>
      ) : (
        <div className="grid gap-4">
          {citas.map((cita) => (
            <div key={cita.id} className="bg-white dark:bg-black/20 p-6 rounded-xl shadow-sm border border-foreground/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg">{cita.especialidades?.nombre || 'Especialidad'} - Dr(a). {cita.medicos?.nombre_completo || 'No asignado'}</h3>
                <p className="text-foreground/70">{new Date(cita.fecha_hora).toLocaleString('es-EC')}</p>
                <div className="mt-2 text-sm">
                  Estado: <span className="font-semibold px-2 py-1 bg-secondary/10 text-secondary rounded-md uppercase text-xs tracking-wider">{cita.estado}</span>
                </div>
              </div>
              {cita.enlace_zoom && cita.estado === 'confirmada' && (
                <a 
                  href={cita.enlace_zoom} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-primary text-white px-6 py-2 rounded-md font-bold hover:bg-primary/90 transition-colors"
                >
                  Conectarse a Zoom
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
