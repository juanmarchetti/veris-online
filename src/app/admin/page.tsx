export const dynamic = 'force-dynamic'

import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import type { ComponentType } from 'react'
import { CalendarDays, ShieldCheck, Stethoscope, UsersRound } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import GestionPersonal, { type StaffMember } from './GestionPersonal'
import GestionCatalogos from './GestionCatalogos'

export default async function AdminPage() {
  const { error, status } = await verificarUsuario(['admin'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main className="page-shell">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-2xl font-extrabold text-error">Acceso denegado</h1>
          <p className="mt-3 text-sm text-on-surface-variant">{error}</p>
        </div>
      </main>
    )
  }

  const adminClient = createAdminClient()

  const [
    { count: totalPacientes },
    { count: totalMedicos },
    { count: totalCitas },
  ] = await Promise.all([
    adminClient.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'paciente'),
    adminClient.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'medico').eq('activo', true),
    adminClient.from('citas').select('*', { count: 'exact', head: true }),
  ])

  const rolesPersonal: string[] = ['medico', 'agente_cc', 'admin']

  const [
    { data: authUsersData, error: authError },
    { data: perfilesPersonal, error: perfilesError },
    { data: especialidades },
    { data: conveniosData },
    { data: especialidadesConPrecio },
    { data: medicosData },
  ] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 500 }),
    adminClient.from('perfiles').select('id, rol, activo').in('rol', rolesPersonal),
    adminClient.from('especialidades').select('id, nombre').order('nombre'),
    adminClient.from('convenios').select('id, nombre_aseguradora').order('nombre_aseguradora'),
    adminClient.from('especialidades').select('id, nombre, precio_base').order('nombre'),
    adminClient.from('medicos').select('id_auth_user, nombre_completo, id_especialidad'),
  ])

  if (perfilesError || authError) {
    return (
      <main className="page-shell">
        <div className="card mx-auto max-w-2xl p-8">
          <h1 className="text-2xl font-extrabold text-error">Error del Admin Client</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Hubo un error al conectar con Supabase usando la llave Service Role.
          </p>
          <pre className="mt-4 overflow-auto rounded-lg bg-red-50 p-4 text-xs text-red-700">
            {JSON.stringify({ perfilesError, authError }, null, 2)}
          </pre>
        </div>
      </main>
    )
  }

  const emailMap = new Map<string, string>(
    (authUsersData?.users ?? []).map((u) => [u.id, u.email ?? 'Sin correo'])
  )

  const medicosMap = new Map(
    (medicosData ?? []).map((m) => [m.id_auth_user, m])
  )

  type PerfilDB = { id: string; rol: string; activo: boolean | null }
  const personal: StaffMember[] = (perfilesPersonal as PerfilDB[] ?? []).map((p) => {
    const medInfo = medicosMap.get(p.id)
    return {
      id: p.id,
      email: emailMap.get(p.id) ?? `${p.id.slice(0, 8)}...`,
      rol: p.rol,
      activo: p.activo ?? true,
      nombreMedico: medInfo?.nombre_completo,
      idEspecialidad: medInfo?.id_especialidad,
    }
  })

  return (
    <main className="page-shell grid gap-8">
      <section className="grid gap-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="grid gap-2">
            <span className="section-kicker">
              <ShieldCheck className="h-4 w-4" />
              Administración
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">Panel de administración</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Gestión de personal médico, agentes, especialidades y convenios del sistema.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[480px]">
            <AdminMetric icon={UsersRound} label="Pacientes" value={totalPacientes ?? 0} />
            <AdminMetric icon={Stethoscope} label="Médicos activos" value={totalMedicos ?? 0} />
            <AdminMetric icon={CalendarDays} label="Citas" value={totalCitas ?? 0} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <GestionPersonal
          personal={personal}
          especialidades={especialidades ?? []}
        />
      </section>

      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <GestionCatalogos
          especialidades={(especialidadesConPrecio ?? []).map((e: { id: string; nombre: string; precio_base: number | null }) => ({ ...e, precio_base: e.precio_base ?? 25.00 }))}
          convenios={conveniosData ?? []}
        />
      </section>
    </main>
  )
}

function AdminMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
          <p className="text-2xl font-extrabold text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}
