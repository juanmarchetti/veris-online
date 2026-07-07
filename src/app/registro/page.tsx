'use client';

// SRS RF-01.3 [FUENTE]: Registro de paciente nuevo en el portal.
// Recolecta: tipo/número de identificación, nombre, correo, teléfono, contraseña.
// Diseño Stitch: "Crea tu cuenta" — Clinical Minimalist.

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const tipo_identificacion = formData.get('tipo_identificacion') as string;
    const numero_identificacion = formData.get('numero_identificacion') as string;
    const nombre_completo = formData.get('nombre_completo') as string;
    const correo = formData.get('correo') as string;
    const telefono = formData.get('telefono') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password,
        options: {
          data: { tipo_identificacion, numero_identificacion, nombre_completo, telefono }
        }
      });

      if (authError) {
        const msg = authError.message || '';
        if (msg.includes('already registered')) throw new Error('El correo ya está registrado.');
        if (msg.includes('Password should be at least')) throw new Error('La contraseña es demasiado débil (mínimo 6 caracteres).');
        if (msg === '{}' || msg.trim() === '') throw new Error('Error inesperado al registrarte. Intenta de nuevo.');
        throw new Error(msg);
      }

      if (!authData.user) throw new Error('No se pudo crear el usuario.');

      if (!authData.session) {
        setSuccessMsg('¡Cuenta creada! Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.');
        return;
      }

      const { error: dbError } = await supabase.from('pacientes').insert({
        id_auth_user: authData.user.id,
        tipo_identificacion,
        numero_identificacion,
        nombre_completo,
        correo,
        telefono,
        cuenta_registrada_portal: true,
        historial_clinico_veris: false
      });

      if (dbError) {
        setError(`Tu cuenta fue creada, pero hubo un problema al guardar tus datos (${dbError.message}). Contacta a soporte.`);
        return;
      }

      router.push('/agendar-cita');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        minHeight: '70vh',
        background: 'var(--background)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--surface-container-lowest)',
          borderRadius: '0.75rem',
          borderTop: '4px solid var(--primary-container)',
          boxShadow: '0 4px 24px rgba(30, 41, 59, 0.08)',
          padding: '2.5rem',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--primary-container)', margin: '0 0 0.5rem' }}>
            Crea tu cuenta
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>
            Completa tus datos para empezar a cuidar tu salud
          </p>
        </div>

        {/* Messages */}
        {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
        {successMsg && (
          <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
            {successMsg}
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/login" style={{ fontWeight: 600, color: 'var(--primary-container)' }}>Ir al inicio de sesión →</Link>
            </div>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Identificación */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="tipo_identificacion" className="input-label">Tipo de ID</label>
                <select id="tipo_identificacion" name="tipo_identificacion" required className="input-field">
                  <option value="CEDULA">Cédula</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>
              <div>
                <label htmlFor="numero_identificacion" className="input-label">Número de ID</label>
                <input id="numero_identificacion" type="text" name="numero_identificacion" required placeholder="0912345678" className="input-field" />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre_completo" className="input-label">Nombres y Apellidos</label>
              <input id="nombre_completo" type="text" name="nombre_completo" required placeholder="Ej. Juan Pérez" className="input-field" />
            </div>

            {/* Correo */}
            <div>
              <label htmlFor="correo" className="input-label">Correo electrónico</label>
              <input id="correo" type="email" name="correo" required placeholder="tu@email.com" className="input-field" />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="input-label">Número de celular</label>
              <input id="telefono" type="tel" name="telefono" placeholder="0912345678" className="input-field" />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="input-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', padding: '0.25rem' }}
                  aria-label="Mostrar/ocultar contraseña"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="input-label">Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', padding: '0.25rem' }}
                  aria-label="Mostrar/ocultar confirmar contraseña"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Registrando…' : 'Registrarme'}
            </button>
          </form>
        )}

        {/* Login link */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: 500, textDecoration: 'none' }}>
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </main>
  );
}
