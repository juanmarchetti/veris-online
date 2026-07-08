import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Calendar, Clock, FileText, User, AlertCircle, Download, Activity } from 'lucide-react'

export default async function DashboardInicioPage() {
  const { error, status, user } = await verificarUsuario(['paciente'])

  if (error || !user) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
      </main>
    )
  }

  const supabase = await createClient()

  const { data: paciente } = await supabase
    .from('pacientes')
    .select('id, nombre_completo')
    .eq('id_auth_user', user.id)
    .single()

  if (!paciente) {
    return <main className="p-6 text-center">Perfil de paciente no encontrado.</main>
  }

  // 1. Próxima Cita (agendada o confirmada, fecha >= hoy)
  const ahora = new Date().toISOString()
  const { data: proximasCitas } = await supabase
    .from('citas')
    .select('id, fecha_hora, estado, motivo_consulta, medicos(nombre_completo), especialidades(nombre)')
    .eq('id_paciente', paciente.id)
    .in('estado', ['agendada', 'confirmada', 'pendiente_pago', 'en_curso'])
    .gte('fecha_hora', ahora)
    .order('fecha_hora', { ascending: true })
    .limit(1)

  const proximaCita = proximasCitas?.[0]

  // 2. Últimos Diagnósticos
  const { data: ultimosDiagnosticos } = await supabase
    .from('historial_clinico')
    .select('id, fecha, diagnostico, requiere_valoracion_presencial, medicos(nombre_completo), citas(especialidades(nombre))')
    .eq('id_paciente', paciente.id)
    .not('diagnostico', 'is', null)
    .order('fecha', { ascending: false })
    .limit(3)

  // 3. Resumen y alertas
  // - Total consultas (podemos contar historial_clinico)
  const { count: totalConsultas } = await supabase
    .from('historial_clinico')
    .select('*', { count: 'exact', head: true })
    .eq('id_paciente', paciente.id)

  // - Alerta valoración presencial pendiente
  const { data: alertasValoracion } = await supabase
    .from('historial_clinico')
    .select('id, fecha')
    .eq('id_paciente', paciente.id)
    .eq('requiere_valoracion_presencial', true)
    .order('fecha', { ascending: false })
    .limit(1)

  const tieneAlerta = alertasValoracion && alertasValoracion.length > 0

  return (
    <main className="flex flex-col p-6 max-w-5xl mx-auto w-full gap-8">
      {/* Saludo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">¡Hola, {paciente.nombre_completo.split(' ')[0]}!</h1>
          <p className="text-foreground/70 text-lg">Bienvenido a tu panel de salud de Veris Online.</p>
        </div>
      </div>

      {/* Alertas */}
      {tieneAlerta && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-800">Valoración Presencial Requerida</h3>
            <p className="text-sm text-yellow-700">En una de tus últimas consultas, tu médico indicó que requieres atención presencial. Por favor, acude a un centro médico pronto.</p>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Próxima Cita & Accesos Rápidos */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Próxima Cita Destacada */}
          <section className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            {/* Decoration */}
            <Calendar className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10" />
            
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Próxima Videoconsulta
            </h2>
            
            {proximaCita ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {new Date(proximaCita.fecha_hora).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-lg opacity-90">
                      a las {new Date(proximaCita.fecha_hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-2 font-medium">Dr(a). {proximaCita.medicos?.nombre_completo}</p>
                    <p className="text-sm opacity-80">{proximaCita.especialidades?.nombre} — {proximaCita.motivo_consulta}</p>
                  </div>
                  
                  {(proximaCita.estado === 'confirmada' || proximaCita.estado === 'en_curso') ? (
                    <Link 
                      href={`/videoconsulta?cita=${proximaCita.id}`}
                      className="bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-white/90 transition-colors shadow-sm shrink-0"
                    >
                      Ingresar a Zoom
                    </Link>
                  ) : (
                    <span className="bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide">
                      {proximaCita.estado.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <p className="text-lg font-medium mb-4">No tienes citas próximas agendadas.</p>
                <Link 
                  href="/agendar-cita"
                  className="inline-block bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-white/90 transition-colors shadow-sm"
                >
                  Agendar Nueva Cita
                </Link>
              </div>
            )}
          </section>

          {/* Accesos Rápidos */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-foreground/80">Accesos Rápidos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/agendar-cita" className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-center">Agendar Cita</span>
              </Link>
              
              <Link href="/mis-citas" className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-center">Mis Citas</span>
              </Link>

              <Link href="/mis-citas/historial" className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-center">Historial Clínico</span>
              </Link>

              <Link href="/perfil" className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-center">Mi Perfil</span>
              </Link>
            </div>
          </section>

        </div>

        {/* Columna Derecha: Resumen y Últimos Diagnósticos */}
        <div className="flex flex-col gap-6">
          
          {/* Resumen */}
          <section className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground/80 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Mi Actividad
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-foreground/70">Total consultas</span>
                <span className="font-bold text-lg">{totalConsultas || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-foreground/70">Última atención</span>
                <span className="font-semibold text-sm text-right">
                  {ultimosDiagnosticos?.[0]?.fecha 
                    ? new Date(ultimosDiagnosticos[0].fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </section>

          {/* Últimos Diagnósticos */}
          <section className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground/80">Últimos Diagnósticos</h2>
              <Link href="/mis-citas/historial" className="text-xs font-bold text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            
            {(!ultimosDiagnosticos || ultimosDiagnosticos.length === 0) ? (
              <p className="text-sm text-foreground/50 italic text-center mt-8">No tienes diagnósticos recientes.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {ultimosDiagnosticos.map((diag) => (
                  <div key={diag.id} className="border border-outline-variant rounded-xl p-3 hover:border-primary transition-colors group relative">
                    <div className="pr-8">
                      <p className="text-xs text-foreground/60 mb-1">
                        {new Date(diag.fecha).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                        {/* TypeScript safety for nested relations */}
                        {diag.citas && (diag.citas as any).especialidades ? ` • ${(diag.citas as any).especialidades.nombre}` : ''}
                      </p>
                      <p className="text-sm font-semibold line-clamp-2 text-foreground/90 leading-snug">
                        {diag.diagnostico}
                      </p>
                    </div>
                    <a 
                      href={`/api/diagnostico/${diag.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}
