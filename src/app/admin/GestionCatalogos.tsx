'use client'

import { useState, useTransition } from 'react'
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
    <section className="space-y-10">
      <TablaEspecialidades items={especialidades} />
      <hr className="border-foreground/10" />
      <TablaConvenios items={convenios} />
    </section>
  )
}

/* ─── Especialidades ─── */

function TablaEspecialidades({ items }: { items: Especialidad[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await crearEspecialidad(fd)
      setMsg(res.error ?? '✓ Especialidad creada')
      if (!res.error) (e.target as HTMLFormElement).reset()
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await editarEspecialidad(fd)
      setMsg(res.error ?? '✓ Especialidad actualizada')
      if (!res.error) setEditId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta especialidad? Las citas vinculadas impedirán la eliminación.')) return
    startTransition(async () => {
      const res = await eliminarEspecialidad(id)
      setMsg(res.error ?? '✓ Especialidad eliminada')
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Especialidades</h2>

      {msg && (
        <div className={`text-sm p-2 rounded mb-4 ${msg.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg}
        </div>
      )}

      {/* Formulario de creación */}
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-foreground/60 block mb-1">Nombre</label>
          <input name="nombre" required placeholder="Ej: Cardiología" className="w-full border rounded p-2 text-sm bg-white dark:bg-black" />
        </div>
        <div className="w-32">
          <label className="text-xs font-semibold text-foreground/60 block mb-1">Precio Base ($)</label>
          <input name="precioBase" type="number" step="0.01" min="0" required defaultValue="25.00" className="w-full border rounded p-2 text-sm bg-white dark:bg-black" />
        </div>
        <button type="submit" disabled={isPending} className="bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
          Agregar
        </button>
      </form>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              <th className="p-3 font-semibold text-foreground/60">Nombre</th>
              <th className="p-3 font-semibold text-foreground/60 w-28">Precio Base</th>
              <th className="p-3 font-semibold text-foreground/60 w-40 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((esp) => (
              <tr key={esp.id} className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                {editId === esp.id ? (
                  <td colSpan={3} className="p-3">
                    <form onSubmit={handleEdit} className="flex flex-wrap gap-2 items-end">
                      <input type="hidden" name="id" value={esp.id} />
                      <input name="nombre" defaultValue={esp.nombre} required className="flex-1 border rounded p-1 text-sm bg-white dark:bg-black" />
                      <input name="precioBase" type="number" step="0.01" min="0" defaultValue={esp.precio_base} required className="w-28 border rounded p-1 text-sm bg-white dark:bg-black" />
                      <button type="submit" disabled={isPending} className="text-primary font-bold text-xs">Guardar</button>
                      <button type="button" onClick={() => setEditId(null)} className="text-foreground/50 text-xs">Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="p-3">{esp.nombre}</td>
                    <td className="p-3">${esp.precio_base.toFixed(2)}</td>
                    <td className="p-3 text-right space-x-3">
                      <button onClick={() => setEditId(esp.id)} className="text-primary text-xs font-semibold hover:underline">Editar</button>
                      <button onClick={() => handleDelete(esp.id)} disabled={isPending} className="text-red-500 text-xs font-semibold hover:underline">Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-foreground/50">No hay especialidades registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Convenios ─── */

function TablaConvenios({ items }: { items: Convenio[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await crearConvenio(fd)
      setMsg(res.error ?? '✓ Convenio creado')
      if (!res.error) (e.target as HTMLFormElement).reset()
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await editarConvenio(fd)
      setMsg(res.error ?? '✓ Convenio actualizado')
      if (!res.error) setEditId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este convenio?')) return
    startTransition(async () => {
      const res = await eliminarConvenio(id)
      setMsg(res.error ?? '✓ Convenio eliminado')
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Convenios / Aseguradoras</h2>

      {msg && (
        <div className={`text-sm p-2 rounded mb-4 ${msg.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-3 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-foreground/60 block mb-1">Nombre Aseguradora</label>
          <input name="nombre" required placeholder="Ej: Humana" className="w-full border rounded p-2 text-sm bg-white dark:bg-black" />
        </div>
        <button type="submit" disabled={isPending} className="bg-primary text-white px-4 py-2 rounded font-bold text-sm hover:bg-primary/90 disabled:opacity-50">
          Agregar
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-foreground/10 text-left">
              <th className="p-3 font-semibold text-foreground/60">Aseguradora</th>
              <th className="p-3 font-semibold text-foreground/60 w-40 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((conv) => (
              <tr key={conv.id} className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors">
                {editId === conv.id ? (
                  <td colSpan={2} className="p-3">
                    <form onSubmit={handleEdit} className="flex gap-2 items-end">
                      <input type="hidden" name="id" value={conv.id} />
                      <input name="nombre" defaultValue={conv.nombre_aseguradora} required className="flex-1 border rounded p-1 text-sm bg-white dark:bg-black" />
                      <button type="submit" disabled={isPending} className="text-primary font-bold text-xs">Guardar</button>
                      <button type="button" onClick={() => setEditId(null)} className="text-foreground/50 text-xs">Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="p-3">{conv.nombre_aseguradora}</td>
                    <td className="p-3 text-right space-x-3">
                      <button onClick={() => setEditId(conv.id)} className="text-primary text-xs font-semibold hover:underline">Editar</button>
                      <button onClick={() => handleDelete(conv.id)} disabled={isPending} className="text-red-500 text-xs font-semibold hover:underline">Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={2} className="p-6 text-center text-foreground/50">No hay convenios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
