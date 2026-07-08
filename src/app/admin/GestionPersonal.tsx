'use client'

// GestionPersonal — Panel de Admin — Veris Online
// Permite al administrador:
//   1. Registrar nuevo personal (médico o agente) directamente sin que se registren en el portal.
//   2. Editar el rol de un usuario de personal existente.
//   3. Suspender / Reactivar usuarios de personal.
// Los pacientes NO aparecen aquí — se gestionan en panel-medico y panel-cc.

import { useState, useTransition } from 'react'
import { actualizarRolYPerfil, crearUsuarioStaff, toggleSuspensionUsuario } from './actions'

type Especialidad = { id: string; nombre: string }

export type StaffMember = {
  id: string
  email: string
  rol: string
  activo: boolean
  nombreMedico?: string
  idEspecialidad?: string
}

// ─────────────────────────────────────────────
// Formulario de CREACIÓN de nuevo personal
// ─────────────────────────────────────────────
function NuevoPersonalForm({ especialidades }: { especialidades: Especialidad[] }) {
  const [rolSeleccionado, setRolSeleccionado] = useState('agente_cc')
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [abierto, setAbierto] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensaje(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await crearUsuarioStaff(formData)
      setMensaje({
        ok: result.ok,
        texto: result.ok ? '✓ Usuario creado exitosamente.' : '✗ ' + (result.error ?? 'Error desconocido.'),
      })
      if (result.ok) {
        setAbierto(false)
        ;(e.target as HTMLFormElement).reset()
        setRolSeleccionado('agente_cc')
      }
    })
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary-container)',
            color: 'var(--on-primary)',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Registrar Nuevo Personal
        </button>
      ) : (
        <div
          className="card"
          style={{ padding: '1.75rem', borderLeft: '4px solid var(--primary-container)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              Registrar Nuevo Personal
            </h3>
            <button
              onClick={() => { setAbierto(false); setMensaje(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '18px' }}
              aria-label="Cerrar formulario"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">Correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="medico@veris.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Contraseña temporal</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Rol</label>
              <select
                name="rol"
                value={rolSeleccionado}
                onChange={(e) => setRolSeleccionado(e.target.value)}
                className="input-field"
              >
                <option value="agente_cc">Agente Contact Center</option>
                <option value="medico">Médico</option>
              </select>
            </div>

            {rolSeleccionado === 'medico' && (
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Datos del Médico
                </p>
                <div>
                  <label className="input-label">Nombre completo del médico</label>
                  <input
                    type="text"
                    name="nombreMedico"
                    required
                    placeholder="Ej: Dra. María González"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Especialidad</label>
                  <select
                    name="idEspecialidad"
                    required
                    defaultValue=""
                    className="input-field"
                  >
                    <option value="" disabled>Seleccionar especialidad…</option>
                    {especialidades.map((esp) => (
                      <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {mensaje && (
              <div className={mensaje.ok ? 'alert-success' : 'alert-error'}>
                {mensaje.texto}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setAbierto(false); setMensaje(null) }}
                className="btn-outline"
                style={{ width: 'auto' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
                style={{ width: 'auto' }}
              >
                {isPending ? 'Creando…' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tarjeta de personal existente
// ─────────────────────────────────────────────
function StaffCard({
  member,
  especialidades,
}: {
  member: StaffMember
  especialidades: Especialidad[]
}) {
  const [rolSeleccionado, setRolSeleccionado] = useState(member.rol)
  const [mensajeRol, setMensajeRol] = useState<{ ok: boolean; texto: string } | null>(null)
  const [mensajeSuspension, setMensajeSuspension] = useState<{ ok: boolean; texto: string } | null>(null)
  const [isPendingRol, startRol] = useTransition()
  const [isPendingSuspension, startSuspension] = useTransition()
  const [activoLocal, setActivoLocal] = useState(member.activo)

  const handleRolSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensajeRol(null)
    const formData = new FormData(e.currentTarget)
    startRol(async () => {
      const result = await actualizarRolYPerfil(formData)
      setMensajeRol({
        ok: result.ok,
        texto: result.ok ? '✓ Rol actualizado.' : '✗ ' + (result.error ?? 'Error.'),
      })
    })
  }

  const handleToggleSuspension = () => {
    setMensajeSuspension(null)
    startSuspension(async () => {
      const result = await toggleSuspensionUsuario(member.id, activoLocal)
      if (result.ok) {
        setActivoLocal(!activoLocal)
        setMensajeSuspension({
          ok: true,
          texto: activoLocal ? '✓ Usuario suspendido.' : '✓ Usuario reactivado.',
        })
      } else {
        setMensajeSuspension({ ok: false, texto: '✗ ' + (result.error ?? 'Error.') })
      }
    })
  }

  function rolBadge(rol: string) {
    switch (rol) {
      case 'admin':    return <span className="badge badge-admin">Admin</span>
      case 'medico':   return <span className="badge badge-medico">Médico</span>
      case 'agente_cc': return <span className="badge badge-agente">Agente CC</span>
      default:         return null
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        opacity: activoLocal ? 1 : 0.75,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header de la tarjeta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.2rem' }}>
            {member.email}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--outline)', fontFamily: 'monospace' }}>
            {member.id.slice(0, 8)}…
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {rolBadge(member.rol)}
          <span className={`badge ${activoLocal ? 'badge-activo' : 'badge-suspendido'}`}>
            {activoLocal ? 'Activo' : 'Suspendido'}
          </span>
        </div>
      </div>

      {/* Formulario de cambio de rol */}
      <form onSubmit={handleRolSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input type="hidden" name="userId" value={member.id} />

        <div>
          <label className="input-label" style={{ fontSize: '11px' }}>Cambiar rol</label>
          <select
            name="nuevoRol"
            value={rolSeleccionado}
            onChange={(e) => { setRolSeleccionado(e.target.value); setMensajeRol(null) }}
            className="input-field"
            style={{ fontSize: '14px', padding: '0.5rem 0.75rem' }}
          >
            <option value="medico">Médico</option>
            <option value="agente_cc">Agente CC</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {rolSeleccionado === 'medico' && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '0.5rem',
              padding: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Nombre del médico</label>
              <input
                type="text"
                name="nombreMedico"
                required
                defaultValue={member.nombreMedico}
                placeholder="Dra. María González"
                className="input-field"
                style={{ fontSize: '14px', padding: '0.5rem 0.75rem' }}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '11px' }}>Especialidad</label>
              <select
                name="idEspecialidad"
                required
                defaultValue={member.idEspecialidad || ""}
                className="input-field"
                style={{ fontSize: '14px', padding: '0.5rem 0.75rem' }}
              >
                <option value="" disabled>Seleccionar…</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mensajeRol && (
          <div className={mensajeRol.ok ? 'alert-success' : 'alert-error'} style={{ fontSize: '13px', padding: '0.5rem 0.75rem' }}>
            {mensajeRol.texto}
          </div>
        )}

        <button
          type="submit"
          disabled={isPendingRol}
          className="btn-primary"
          style={{ fontSize: '13px', padding: '0.5rem' }}
        >
          {isPendingRol ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      {/* Botón de Suspensión */}
      <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '0.75rem' }}>
        {mensajeSuspension && (
          <div className={mensajeSuspension.ok ? 'alert-success' : 'alert-error'} style={{ fontSize: '13px', padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
            {mensajeSuspension.texto}
          </div>
        )}
        <button
          type="button"
          onClick={handleToggleSuspension}
          disabled={isPendingSuspension}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '0.5rem',
            border: 'none',
            cursor: isPendingSuspension ? 'not-allowed' : 'pointer',
            background: activoLocal ? '#fee2e2' : '#dcfce7',
            color: activoLocal ? '#b91c1c' : '#166534',
            transition: 'background 0.2s',
            opacity: isPendingSuspension ? 0.6 : 1,
          }}
        >
          {isPendingSuspension
            ? 'Procesando…'
            : activoLocal
            ? '⛔ Suspender acceso'
            : '✓ Reactivar acceso'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente principal exportado
// ─────────────────────────────────────────────
export default function GestionPersonal({
  personal,
  especialidades,
}: {
  personal: StaffMember[]
  especialidades: Especialidad[]
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Gestión de Personal</h2>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
            Médicos y Agentes de Contact Center registrados en el sistema.
          </p>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', background: 'var(--surface-container)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
          {personal.length} en total
        </span>
      </div>

      {/* Botón de creación */}
      <NuevoPersonalForm especialidades={especialidades} />

      {/* Lista de personal */}
      {personal.length === 0 ? (
        <div
          className="card"
          style={{ padding: '3rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '14px' }}
        >
          <p style={{ marginBottom: '0.5rem', fontSize: '32px' }}>👤</p>
          <p>Aún no hay personal registrado.</p>
          <p>Usa el botón de arriba para agregar al primer médico o agente.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {personal.map((m) => (
            <StaffCard key={m.id} member={m} especialidades={especialidades} />
          ))}
        </div>
      )}
    </section>
  )
}
