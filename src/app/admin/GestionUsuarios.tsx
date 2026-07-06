'use client'

// Fix #3 y #4: Client Component para gestión de usuarios en el panel admin.
// Permite cambiar el rol de cada usuario y, si es 'medico',
// ingresar nombre completo y especialidad para crear la fila en tabla medicos.

import { useState, useTransition } from 'react'
import { actualizarRolYPerfil } from './actions'

type Especialidad = { id: string; nombre: string }

export type UsuarioConRol = {
  id: string
  email: string
  rol: string
}

type RolLabel = { value: string; label: string }
const ROL_LABELS: RolLabel[] = [
  { value: 'paciente', label: 'Paciente' },
  { value: 'medico', label: 'Médico' },
  { value: 'agente_cc', label: 'Agente CC' },
  { value: 'admin', label: 'Admin' },
]

// Badge de color por rol para identificación visual rápida
function badgeRol(rol: string) {
  switch (rol) {
    case 'admin':
      return 'bg-purple-100 text-purple-700'
    case 'medico':
      return 'bg-blue-100 text-blue-700'
    case 'agente_cc':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-green-100 text-green-700'
  }
}

// Fila de formulario para un usuario individual
function UserRolForm({
  usuario,
  especialidades,
}: {
  usuario: UsuarioConRol
  especialidades: Especialidad[]
}) {
  const [rolSeleccionado, setRolSeleccionado] = useState(usuario.rol)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensaje(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await actualizarRolYPerfil(formData)
      setMensaje({
        ok: result.ok,
        texto: result.ok ? '✓ Rol actualizado correctamente.' : '✗ ' + (result.error ?? 'Error desconocido.'),
      })
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-black/20 p-5 rounded-xl border border-foreground/10 flex flex-col gap-4"
    >
      {/* Identificación del usuario */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm truncate max-w-xs">{usuario.email}</p>
          <p className="text-xs text-foreground/50 mt-0.5 font-mono">{usuario.id.slice(0, 8)}…</p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${badgeRol(usuario.rol)}`}
        >
          {usuario.rol}
        </span>
      </div>

      <input type="hidden" name="userId" value={usuario.id} />

      {/* Selector de rol */}
      <div>
        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1 block">
          Nuevo rol
        </label>
        <select
          name="nuevoRol"
          value={rolSeleccionado}
          onChange={(e) => {
            setRolSeleccionado(e.target.value)
            setMensaje(null)
          }}
          className="w-full p-2 border rounded-md bg-white dark:bg-black text-sm"
        >
          {ROL_LABELS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campos adicionales solo cuando el nuevo rol es 'medico' */}
      {rolSeleccionado === 'medico' && (
        <div className="flex flex-col gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            Datos requeridos para médico
          </p>

          {/* Nombre explícito del médico — el admin lo ingresa manualmente */}
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre completo del médico</label>
            <input
              type="text"
              name="nombreMedico"
              placeholder="Ej: Dra. María González"
              required
              className="w-full p-2 border rounded-md bg-white dark:bg-black text-sm"
            />
          </div>

          {/* Especialidad */}
          <div>
            <label className="text-sm font-medium mb-1 block">Especialidad</label>
            <select
              name="idEspecialidad"
              required
              defaultValue=""
              className="w-full p-2 border rounded-md bg-white dark:bg-black text-sm"
            >
              <option value="" disabled>
                Seleccionar especialidad…
              </option>
              {especialidades.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Feedback del resultado */}
      {mensaje && (
        <p
          className={`text-sm font-medium rounded-md p-2 ${
            mensaje.ok
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20'
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white p-2 rounded-md font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}

// Componente principal exportado — recibe la lista de usuarios y especialidades
// desde el Server Component padre (admin/page.tsx)
export default function GestionUsuarios({
  usuarios,
  especialidades,
}: {
  usuarios: UsuarioConRol[]
  especialidades: Especialidad[]
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <span className="text-sm text-foreground/50">{usuarios.length} usuarios</span>
      </div>

      {usuarios.length === 0 ? (
        <div className="bg-surface border border-foreground/10 p-8 rounded-xl text-center text-foreground/60">
          No hay usuarios registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usuarios.map((u) => (
            <UserRolForm key={u.id} usuario={u} especialidades={especialidades} />
          ))}
        </div>
      )}
    </section>
  )
}
