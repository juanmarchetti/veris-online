// Panel de Administración — Veris Online
// Diseño Stitch: Clinical Minimalist
// El admin gestiona SOLO al personal (médicos y agentes).
// Los pacientes se gestionan por médicos y agentes en sus propios paneles.

export const dynamic = 'force-dynamic'

import { verificarUsuario } from '@/utils/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import GestionPersonal, { type StaffMember } from './GestionPersonal'
import GestionCatalogos from './GestionCatalogos'

export default async function AdminPage() {
  const { error, status } = await verificarUsuario(['admin'])

  if (error) {
    if (status === 401) redirect('/login')
    return (
      <main style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--error)', marginBottom: '0.75rem' }}>Acceso Denegado</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>{error}</p>
        </div>
      </main>
    )
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Estadísticas generales — usamos adminClient para saltar RLS y contar todo
  const [
    { count: totalPacientes },
    { count: totalMedicos },
    { count: totalCitas }
  ] = await Promise.all([
    adminClient.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'paciente'),
    adminClient.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'medico').eq('activo', true),
    adminClient.from('citas').select('*', { count: 'exact', head: true }),
  ])

  // Obtener SOLO el personal (médicos, agentes, admins) — NO pacientes.
  // La fuente de verdad de roles es la tabla 'perfiles'. Los emails se obtienen
  // del Auth Admin API cuando está disponible (requiere SERVICE_ROLE_KEY).
  const ROLES_PERSONAL: string[] = ['medico', 'agente_cc', 'admin']

  const [
    { data: authUsersData },
    { data: perfilesPersonal },
    { data: especialidades },
    { data: conveniosData },
    { data: especialidadesConPrecio },
  ] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 500 }),
    // Filtrar directamente en BD — fuente de verdad para el listado de personal
    adminClient.from('perfiles').select('id, rol, activo').in('rol', ROLES_PERSONAL),
    adminClient.from('especialidades').select('id, nombre').order('nombre'),
    adminClient.from('convenios').select('id, nombre_aseguradora').order('nombre_aseguradora'),
    adminClient.from('especialidades').select('id, nombre, precio_base').order('nombre'),
  ])

  // Mapa de Auth users para obtener email: id -> email
  const emailMap = new Map<string, string>(
    (authUsersData?.users ?? []).map((u) => [u.id, u.email ?? 'Sin correo'])
  )

  // Construir la lista de personal a partir de 'perfiles' (siempre confiable)
  // y enriquecer con email si está disponible en Auth.
  type PerfilDB = { id: string; rol: string; activo: boolean | null }
  const personal: StaffMember[] = (perfilesPersonal as PerfilDB[] ?? []).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? `${p.id.slice(0, 8)}…`,   // fallback si AUTH no responde
    rol: p.rol,
    activo: p.activo ?? true,
  }))

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
          Panel de Administración
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>
          Gestión de personal médico, agentes y catálogos del sistema.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <StatCard label="Total Pacientes" value={totalPacientes ?? 0} color="var(--primary-container)" />
        <StatCard label="Médicos Activos" value={totalMedicos ?? 0} color="var(--secondary)" />
        <StatCard label="Citas Registradas" value={totalCitas ?? 0} color="var(--on-surface-variant)" />
      </div>

      <hr className="divider" />

      {/* Gestión de Personal — Solo médicos, agentes y admins */}
      <GestionPersonal
        personal={personal}
        especialidades={especialidades ?? []}
      />

      <hr className="divider" />

      {/* Gestión de Catálogos */}
      <GestionCatalogos
        especialidades={(especialidadesConPrecio ?? []).map((e: { id: string; nombre: string; precio_base: number | null }) => ({ ...e, precio_base: e.precio_base ?? 25.00 }))}
        convenios={conveniosData ?? []}
      />
    </main>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="card"
      style={{ padding: '1.5rem', textAlign: 'center' }}
    >
      <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '0.5rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '40px', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}
