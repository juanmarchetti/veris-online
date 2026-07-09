'use client'

import { useState, useTransition } from 'react'
import { Plus, Save, ShieldCheck, ShieldOff, UserPlus, X } from 'lucide-react'
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

function labelRol(rol: string) {
  switch (rol) {
    case 'admin': return 'Admin'
    case 'medico': return 'Médico'
    case 'agente_cc': return 'Agente'
    default: return rol
  }
}

function rolBadgeClass(rol: string) {
  switch (rol) {
    case 'admin': return 'badge badge-admin'
    case 'medico': return 'badge badge-medico'
    case 'agente_cc': return 'badge badge-agente'
    default: return 'badge bg-surface-container text-on-surface-variant'
  }
}

function NuevoPersonalForm({ especialidades }: { especialidades: Especialidad[] }) {
  const [rolSeleccionado, setRolSeleccionado] = useState('agente_cc')
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [abierto, setAbierto] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensaje(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await crearUsuarioStaff(formData)
      setMensaje({
        ok: result.ok,
        texto: result.ok ? 'Usuario creado correctamente.' : result.error ?? 'Error desconocido.',
      })
      if (result.ok) {
        form.reset()
        setAbierto(false)
        setRolSeleccionado('agente_cc')
      }
    })
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn-primary w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Registrar personal
      </button>
    )
  }

  return (
    <div className="card border-l-4 border-l-primary p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-primary">Registrar nuevo personal</h3>
          <p className="mt-1 text-sm text-on-surface-variant">Crea accesos para médicos o agentes operativos.</p>
        </div>
        <button
          type="button"
          onClick={() => { setAbierto(false); setMensaje(null) }}
          className="icon-button"
          aria-label="Cerrar formulario"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="input-label">Correo electrónico</label>
            <input type="email" name="email" required placeholder="medico@veris.com" className="input-field" />
          </div>
          <div>
            <label className="input-label">Contraseña temporal</label>
            <input type="password" name="password" required minLength={8} placeholder="Mínimo 8 caracteres" className="input-field" />
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
            <option value="agente_cc">Agente operativo</option>
            <option value="medico">Médico</option>
          </select>
        </div>

        {rolSeleccionado === 'medico' && (
          <div className="grid gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-extrabold uppercase text-blue-700">Datos del médico</p>
            <div>
              <label className="input-label">Nombre completo del médico</label>
              <input type="text" name="nombreMedico" required placeholder="Ej. Dra. María González" className="input-field" />
            </div>
            <div>
              <label className="input-label">Especialidad</label>
              <select name="idEspecialidad" required defaultValue="" className="input-field">
                <option value="" disabled>Seleccionar especialidad</option>
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

        <div className="grid gap-3 sm:flex sm:justify-end">
          <button type="button" onClick={() => { setAbierto(false); setMensaje(null) }} className="btn-outline w-full sm:w-auto">
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            {isPending ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </div>
  )
}

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
        texto: result.ok ? 'Rol actualizado.' : result.error ?? 'Error.',
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
          texto: activoLocal ? 'Usuario suspendido.' : 'Usuario reactivado.',
        })
      } else {
        setMensajeSuspension({ ok: false, texto: result.error ?? 'Error.' })
      }
    })
  }

  return (
    <article className={`card grid gap-4 p-5 ${activoLocal ? '' : 'opacity-75'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-on-surface">{member.email}</h3>
          <p className="mt-1 font-mono text-xs text-outline">{member.id.slice(0, 8)}...</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className={rolBadgeClass(member.rol)}>{labelRol(member.rol)}</span>
          <span className={`badge ${activoLocal ? 'badge-activo' : 'badge-suspendido'}`}>
            {activoLocal ? 'Activo' : 'Suspendido'}
          </span>
        </div>
      </div>

      <form onSubmit={handleRolSubmit} className="grid gap-3">
        <input type="hidden" name="userId" value={member.id} />
        <div>
          <label className="input-label">Cambiar rol</label>
          <select
            name="nuevoRol"
            value={rolSeleccionado}
            onChange={(e) => { setRolSeleccionado(e.target.value); setMensajeRol(null) }}
            className="input-field"
          >
            <option value="medico">Médico</option>
            <option value="agente_cc">Agente operativo</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {rolSeleccionado === 'medico' && (
          <div className="grid gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div>
              <label className="input-label">Nombre del médico</label>
              <input
                type="text"
                name="nombreMedico"
                required
                defaultValue={member.nombreMedico}
                placeholder="Dra. María González"
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Especialidad</label>
              <select name="idEspecialidad" required defaultValue={member.idEspecialidad || ''} className="input-field">
                <option value="" disabled>Seleccionar</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {mensajeRol && (
          <div className={mensajeRol.ok ? 'alert-success' : 'alert-error'}>
            {mensajeRol.texto}
          </div>
        )}

        <button type="submit" disabled={isPendingRol} className="btn-primary">
          <Save className="h-4 w-4" />
          {isPendingRol ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <div className="border-t border-outline-variant pt-4">
        {mensajeSuspension && (
          <div className={`mb-3 ${mensajeSuspension.ok ? 'alert-success' : 'alert-error'}`}>
            {mensajeSuspension.texto}
          </div>
        )}
        <button
          type="button"
          onClick={handleToggleSuspension}
          disabled={isPendingSuspension}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition-colors disabled:opacity-60 ${
            activoLocal
              ? 'bg-red-50 text-red-700 hover:bg-red-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {activoLocal ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {isPendingSuspension ? 'Procesando...' : activoLocal ? 'Suspender acceso' : 'Reactivar acceso'}
        </button>
      </div>
    </article>
  )
}

export default function GestionPersonal({
  personal,
  especialidades,
}: {
  personal: StaffMember[]
  especialidades: Especialidad[]
}) {
  return (
    <section className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-extrabold text-primary">Gestión de personal</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Médicos, agentes y administradores registrados en el sistema.
          </p>
        </div>
        <span className="w-fit rounded-full bg-surface-container px-3 py-1 text-sm font-bold text-on-surface-variant">
          {personal.length} en total
        </span>
      </div>

      <NuevoPersonalForm especialidades={especialidades} />

      {personal.length === 0 ? (
        <div className="empty-state">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface">Aún no hay personal registrado</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Registra al primer médico o agente operativo.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {personal.map((m) => (
            <StaffCard key={m.id} member={m} especialidades={especialidades} />
          ))}
        </div>
      )}
    </section>
  )
}
