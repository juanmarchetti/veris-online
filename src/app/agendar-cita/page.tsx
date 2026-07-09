import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import FormAgendarCita from './FormAgendarCita'

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

  // Consultar catálogos y datos del paciente en paralelo
  const [
    { data: especialidades },
    { data: medicos },
    { data: convenios }
  ] = await Promise.all([
    supabase.from('especialidades').select('id, nombre').order('nombre'),
    supabase.from('medicos').select('id, nombre_completo, id_especialidad').not('id_auth_user', 'is', null).order('nombre_completo'),
    supabase.from('convenios').select('id, nombre_aseguradora').order('nombre_aseguradora'),
  ])

  return (
    <main className="flex flex-col items-center p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-primary mb-2 text-center">Agendar Videoconsulta</h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        Elige tus días disponibles y el sistema asignará automáticamente el mejor horario libre.
      </p>

      {/* Advertencia Legal Obligatoria */}
      <div className="w-full bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8 rounded-r-md">
        <h2 className="text-red-800 dark:text-red-300 font-bold text-sm uppercase tracking-wide mb-1">
          Atención: Servicio no apto para urgencias
        </h2>
        <p className="text-red-700 dark:text-red-400 text-sm">
          Este servicio de videoconsulta no está diseñado para atender urgencias o emergencias médicas. Si experimenta síntomas graves (dificultad para respirar, dolor en el pecho, pérdida de conocimiento, etc.), acuda inmediatamente al centro de salud más cercano o llame a los servicios de emergencia.
        </p>
      </div>

      <FormAgendarCita
        especialidades={especialidades ?? []}
        medicos={medicos ?? []}
        convenios={convenios ?? []}
      />
    </main>
  )
}
