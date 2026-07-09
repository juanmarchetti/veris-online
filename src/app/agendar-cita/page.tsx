import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AlertTriangle } from 'lucide-react'
import FormAgendarCita from './FormAgendarCita'

export default async function AgendarCitaPage() {
  const { error, status } = await verificarUsuario(['paciente'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-red-600">Acceso denegado</h1>
        <p className="mt-4 text-center">Solo los pacientes registrados pueden agendar citas.</p>
      </main>
    )
  }

  const supabase = await createClient()

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
    <main className="page-shell max-w-3xl">
      <div className="mb-6 grid gap-2 text-center">
        <span className="section-kicker mx-auto">Agenda automática</span>
        <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">Agendar videoconsulta</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Elige tus días disponibles y el sistema asignará automáticamente el mejor horario libre.
        </p>
      </div>

      <div className="mb-8 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="text-sm font-extrabold uppercase text-red-800">Servicio no apto para urgencias</h2>
          <p className="mt-1 text-sm leading-relaxed">
            Si experimentas síntomas graves, acude inmediatamente al centro de salud más cercano o llama a emergencias.
          </p>
        </div>
      </div>

      <FormAgendarCita
        especialidades={especialidades ?? []}
        medicos={medicos ?? []}
        convenios={convenios ?? []}
      />
    </main>
  )
}
