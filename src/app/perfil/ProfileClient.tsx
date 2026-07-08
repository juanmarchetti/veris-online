'use client'

import { useState, useTransition } from 'react'
import { Camera, Save, User, CreditCard, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { actualizarAvatar, actualizarConfiguracionAdmin } from './actions'

type Props = {
  user: {
    id: string
    email: string
    rol: string
    nombre: string
    avatar_url: string
  }
  configuracionAdmin: Record<string, unknown> | null
}

export default function ProfileClient({ user, configuracionAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<'datos' | 'pago'>('datos')
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null)

  // Subida de imagen
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un archivo de imagen válido.' })
      return
    }

    setUploading(true)
    setMensaje(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const result = await actualizarAvatar(formData)
      
      if (result.error) {
        setMensaje({ tipo: 'error', texto: result.error })
      } else if (result.avatar_url) {
        setAvatarUrl(result.avatar_url)
        setMensaje({ tipo: 'exito', texto: 'Foto de perfil actualizada correctamente.' })
        // Refrescar para que el Header también se entere
        window.location.reload()
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Ocurrió un error inesperado al subir la imagen.' })
    } finally {
      setUploading(false)
    }
  }

  const handleAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensaje(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await actualizarConfiguracionAdmin(formData)
      if (result?.error) {
        setMensaje({ tipo: 'error', texto: result.error })
      } else {
        setMensaje({ tipo: 'exito', texto: 'Datos bancarios actualizados correctamente.' })
      }
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <button 
          onClick={() => { setActiveTab('datos'); setMensaje(null) }}
          className={`text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${activeTab === 'datos' ? 'bg-primary-container text-primary' : 'hover:bg-surface-container text-gray-600'}`}
        >
          <User size={18} />
          Datos Personales
        </button>

        {user.rol === 'admin' && (
          <button 
            onClick={() => { setActiveTab('pago'); setMensaje(null) }}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${activeTab === 'pago' ? 'bg-primary-container text-primary' : 'hover:bg-surface-container text-gray-600'}`}
          >
            <CreditCard size={18} />
            Recepción de Fondos
          </button>
        )}
      </div>

      {/* Contenido Principal */}
      <div className="flex-1">
        {mensaje && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {mensaje.tipo === 'exito' ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="shrink-0 mt-0.5" />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        {/* Tab: Datos Personales */}
        {activeTab === 'datos' && (
          <div className="card p-8">
            <h2 className="text-xl font-bold text-primary mb-6">Información Básica</h2>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center group">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-gray-400" />
                  )}
                  
                  {/* Overlay for uploading */}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white">
                    {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                    <span className="text-xs font-medium mt-1">{uploading ? 'Subiendo...' : 'Cambiar'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 capitalize">{user.rol.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Text Fields */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="input-label">Nombre Completo</label>
                  <input type="text" className="input-field bg-gray-50 text-gray-500" value={user.nombre} readOnly />
                  <p className="text-xs text-gray-400 mt-1">El nombre se gestiona desde el registro inicial.</p>
                </div>
                <div>
                  <label className="input-label">Correo Electrónico</label>
                  <input type="email" className="input-field bg-gray-50 text-gray-500" value={user.email} readOnly />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Recepción de Fondos (Admin Only) */}
        {activeTab === 'pago' && user.rol === 'admin' && (
          <div className="card p-8">
            <h2 className="text-xl font-bold text-primary mb-2">Datos Bancarios para Recepción</h2>
            <p className="text-sm text-gray-500 mb-6">
              Esta es la cuenta a la que se transferirán automáticamente los fondos pagados por los pacientes.
            </p>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="input-label">Titular de la cuenta</label>
                <input 
                  type="text" 
                  name="titular_cuenta" 
                  required 
                  defaultValue={configuracionAdmin?.titular_cuenta || ''}
                  className="input-field" 
                  placeholder="Ej. Clinica Veris S.A."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Número de Cuenta / Tarjeta</label>
                  <input 
                    type="text" 
                    name="numero_cuenta" 
                    required 
                    defaultValue={configuracionAdmin?.numero_cuenta || ''}
                    className="input-field font-mono" 
                    placeholder="xxxx-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="input-label">Banco Institución</label>
                  <input 
                    type="text" 
                    name="banco" 
                    required 
                    defaultValue={configuracionAdmin?.banco || ''}
                    className="input-field" 
                    placeholder="Ej. Banco del Pacífico"
                  />
                </div>
              </div>
              
              <div>
                <label className="input-label">Tipo de Cuenta</label>
                <select 
                  name="tipo_cuenta" 
                  className="input-field"
                  defaultValue={configuracionAdmin?.tipo_cuenta || 'Ahorros'}
                >
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito Receptora</option>
                </select>
              </div>

              <div className="pt-4 border-t mt-6">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="btn-primary w-full md:w-auto ml-auto flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Datos Bancarios
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
