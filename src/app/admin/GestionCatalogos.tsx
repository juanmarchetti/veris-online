'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import {
  crearEspecialidad,
  editarEspecialidad,
  eliminarEspecialidad,
  crearConvenio,
  editarConvenio,
  eliminarConvenio
} from './catalogos-actions'

type Especialidad = { id: string; nombre: string; precio_base: number }
type Convenio = { id: string; nombre_aseguradora: string }

export default function GestionCatalogos({
  especialidades,
  convenios
}: {
  especialidades: Especialidad[]
  convenios: Convenio[]
}) {
  return (
    <section className="grid gap-8">
      <TablaEspecialidades items={especialidades} />
      <div className="h-px bg-outline-variant" />
      <TablaConvenios items={convenios} />
    </section>
  )
}

function TablaEspecialidades({ items }: { items: Especialidad[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    startTransition(async () => {
      const res = await crearEspecialidad(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Especialidad creada correctamente.' })
      if (!res.error) form.reset()
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await editarEspecialidad(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Especialidad actualizada.' })
      if (!res.error) setEditId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Eliminar esta especialidad? No se puede deshacer.')) return
    startTransition(async () => {
      const res = await eliminarEspecialidad(id)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Especialidad eliminada.' })
    })
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-extrabold text-primary">Especialidades</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Catálogo clínico y precio base de cada videoconsulta.</p>
      </div>

      {msg && (
        <div className={msg.ok ? 'alert-success' : 'alert-error'}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_auto] md:items-end">
        <div>
          <label className="input-label">Nombre</label>
          <input name="nombre" required placeholder="Ej. Cardiología" className="input-field" />
        </div>
        <div>
          <label className="input-label">Precio base</label>
          <input name="precioBase" type="number" step="0.01" min="0" required defaultValue="25.00" className="input-field" />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary md:w-auto">
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-4 py-3 text-left text-xs font-extrabold uppercase text-on-surface-variant">Nombre</th>
              <th className="w-36 px-4 py-3 text-left text-xs font-extrabold uppercase text-on-surface-variant">Precio base</th>
              <th className="w-44 px-4 py-3 text-right text-xs font-extrabold uppercase text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay especialidades registradas.
                </td>
              </tr>
            )}
            {items.map((esp) => (
              <tr key={esp.id} className="border-b border-surface-container bg-surface-container-lowest last:border-b-0">
                {editId === esp.id ? (
                  <td colSpan={3} className="px-4 py-3">
                    <form onSubmit={handleEdit} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_auto_auto] md:items-center">
                      <input type="hidden" name="id" value={esp.id} />
                      <input name="nombre" defaultValue={esp.nombre} required className="input-field" />
                      <input name="precioBase" type="number" step="0.01" min="0" defaultValue={esp.precio_base} required className="input-field" />
                      <button type="submit" disabled={isPending} className="btn-primary md:w-auto">
                        <Save className="h-4 w-4" />
                        Guardar
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="btn-outline w-full md:w-auto">
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-semibold text-on-surface">{esp.nombre}</td>
                    <td className="px-4 py-3 text-on-surface">${esp.precio_base.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditId(esp.id)} className="inline-grid place-items-center icon-button" aria-label="Editar especialidad">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(esp.id)} disabled={isPending} className="inline-grid place-items-center icon-button text-error" aria-label="Eliminar especialidad">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TablaConvenios({ items }: { items: Convenio[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await crearConvenio(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Convenio creado correctamente.' })
      if (!res.error) form.reset()
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await editarConvenio(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Convenio actualizado.' })
      if (!res.error) setEditId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Eliminar este convenio? No se puede deshacer.')) return
    startTransition(async () => {
      const res = await eliminarConvenio(id)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: 'Convenio eliminado.' })
    })
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-extrabold text-primary">Convenios y aseguradoras</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Listado de convenios asociados al agendamiento.</p>
      </div>

      {msg && (
        <div className={msg.ok ? 'alert-success' : 'alert-error'}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <label className="input-label">Nombre de aseguradora</label>
          <input name="nombre" required placeholder="Ej. Humana" className="input-field" />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary md:w-auto">
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="px-4 py-3 text-left text-xs font-extrabold uppercase text-on-surface-variant">Aseguradora</th>
              <th className="w-44 px-4 py-3 text-right text-xs font-extrabold uppercase text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay convenios registrados.
                </td>
              </tr>
            )}
            {items.map((conv) => (
              <tr key={conv.id} className="border-b border-surface-container bg-surface-container-lowest last:border-b-0">
                {editId === conv.id ? (
                  <td colSpan={2} className="px-4 py-3">
                    <form onSubmit={handleEdit} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                      <input type="hidden" name="id" value={conv.id} />
                      <input name="nombre" defaultValue={conv.nombre_aseguradora} required className="input-field" />
                      <button type="submit" disabled={isPending} className="btn-primary md:w-auto">
                        <Save className="h-4 w-4" />
                        Guardar
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="btn-outline w-full md:w-auto">
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-semibold text-on-surface">{conv.nombre_aseguradora}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditId(conv.id)} className="inline-grid place-items-center icon-button" aria-label="Editar convenio">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => handleDelete(conv.id)} disabled={isPending} className="inline-grid place-items-center icon-button text-error" aria-label="Eliminar convenio">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
