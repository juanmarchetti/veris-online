'use client'

// GestionCatalogos — Panel de Admin — Veris Online
// Gestión de especialidades y convenios/aseguradoras.
// Diseño Stitch: Clinical Minimalist.

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
    <section style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <TablaEspecialidades items={especialidades} />
      <hr style={{ border: 'none', borderTop: '1px solid var(--outline-variant)' }} />
      <TablaConvenios items={convenios} />
    </section>
  )
}

/* ─── Especialidades ─── */
function TablaEspecialidades({ items }: { items: Especialidad[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await crearEspecialidad(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: '✓ Especialidad creada correctamente.' })
      if (!res.error) (e.target as HTMLFormElement).reset()
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await editarEspecialidad(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: '✓ Especialidad actualizada.' })
      if (!res.error) setEditId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta especialidad? No se puede deshacer.')) return
    startTransition(async () => {
      const res = await eliminarEspecialidad(id)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: '✓ Especialidad eliminada.' })
    })
  }

  return (
    <div>
      <h2 className="section-title">Especialidades</h2>

      {msg && (
        <div className={msg.ok ? 'alert-success' : 'alert-error'} style={{ marginBottom: '1rem' }}>
          {msg.text}
        </div>
      )}

      {/* Formulario de creación */}
      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="input-label">Nombre</label>
          <input
            name="nombre"
            required
            placeholder="Ej: Cardiología"
            className="input-field"
          />
        </div>
        <div style={{ width: '140px' }}>
          <label className="input-label">Precio Base ($)</label>
          <input
            name="precioBase"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue="25.00"
            className="input-field"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{ width: 'auto', whiteSpace: 'nowrap' }}
        >
          Agregar
        </button>
      </form>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nombre</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px' }}>Precio Base</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '160px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                  No hay especialidades registradas.
                </td>
              </tr>
            )}
            {items.map((esp) => (
              <tr
                key={esp.id}
                style={{ borderBottom: '1px solid var(--surface-container)', background: 'var(--surface-container-lowest)' }}
              >
                {editId === esp.id ? (
                  <td colSpan={3} style={{ padding: '0.75rem 1rem' }}>
                    <form onSubmit={handleEdit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="hidden" name="id" value={esp.id} />
                      <input name="nombre" defaultValue={esp.nombre} required className="input-field" style={{ flex: 1, minWidth: '140px', padding: '0.4rem 0.75rem', fontSize: '14px' }} />
                      <input name="precioBase" type="number" step="0.01" min="0" defaultValue={esp.precio_base} required className="input-field" style={{ width: '110px', padding: '0.4rem 0.75rem', fontSize: '14px' }} />
                      <button type="submit" disabled={isPending} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-container)', background: 'none', border: 'none', cursor: 'pointer' }}>Guardar</button>
                      <button type="button" onClick={() => setEditId(null)} style={{ fontSize: '13px', color: 'var(--outline)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--on-surface)' }}>{esp.nombre}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--on-surface)' }}>${esp.precio_base.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => setEditId(esp.id)} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-container)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.75rem' }}>Editar</button>
                      <button onClick={() => handleDelete(esp.id)} disabled={isPending} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
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

/* ─── Convenios ─── */
function TablaConvenios({ items }: { items: Convenio[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await crearConvenio(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: '✓ Convenio creado correctamente.' })
      if (!res.error) (e.target as HTMLFormElement).reset()
    })
  }

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await editarConvenio(fd)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: '✓ Convenio actualizado.' })
      if (!res.error) setEditId(null)
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este convenio? No se puede deshacer.')) return
    startTransition(async () => {
      const res = await eliminarConvenio(id)
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: '✓ Convenio eliminado.' })
    })
  }

  return (
    <div>
      <h2 className="section-title">Convenios / Aseguradoras</h2>

      {msg && (
        <div className={msg.ok ? 'alert-success' : 'alert-error'} style={{ marginBottom: '1rem' }}>
          {msg.text}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label className="input-label">Nombre Aseguradora</label>
          <input
            name="nombre"
            required
            placeholder="Ej: Humana"
            className="input-field"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
          style={{ width: 'auto' }}
        >
          Agregar
        </button>
      </form>

      <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--outline-variant)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aseguradora</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--on-surface-variant)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '160px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                  No hay convenios registrados.
                </td>
              </tr>
            )}
            {items.map((conv) => (
              <tr key={conv.id} style={{ borderBottom: '1px solid var(--surface-container)', background: 'var(--surface-container-lowest)' }}>
                {editId === conv.id ? (
                  <td colSpan={2} style={{ padding: '0.75rem 1rem' }}>
                    <form onSubmit={handleEdit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="hidden" name="id" value={conv.id} />
                      <input name="nombre" defaultValue={conv.nombre_aseguradora} required className="input-field" style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '14px' }} />
                      <button type="submit" disabled={isPending} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-container)', background: 'none', border: 'none', cursor: 'pointer' }}>Guardar</button>
                      <button type="button" onClick={() => setEditId(null)} style={{ fontSize: '13px', color: 'var(--outline)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--on-surface)' }}>{conv.nombre_aseguradora}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => setEditId(conv.id)} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-container)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.75rem' }}>Editar</button>
                      <button onClick={() => handleDelete(conv.id)} disabled={isPending} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Eliminar</button>
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
