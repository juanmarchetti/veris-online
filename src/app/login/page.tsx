'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// SRS RF-01.1 [FUENTE]: El acceso se hace por Tipo y Número de Identificación.
// Se implementa con correo/contraseña en Supabase Auth + mapeo por rol.
// A futuro: lookup del correo asociado al número de identificación.

const RUTA_POR_ROL: Record<string, string> = {
  paciente: '/agendar-cita',
  medico: '/panel-medico',
  agente_cc: '/panel-cc',
  admin: '/admin',
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Start loading while checking session

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Redirigir al inicio o página respectiva
        router.push('/');
        router.refresh();
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');

      if (authData.user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', authData.user.id)
          .single();

        const rol = perfil?.rol as string | undefined;

        if (rol === 'paciente') {
          const { error: fetchError } = await supabase
            .from('pacientes')
            .select('id')
            .eq('id_auth_user', authData.user.id)
            .single();

          if (fetchError && fetchError.code === 'PGRST116') {
            const { user_metadata } = authData.user;
            if (user_metadata?.nombre_completo) {
              const { error: insertError } = await supabase.from('pacientes').insert({
                id_auth_user: authData.user.id,
                tipo_identificacion: user_metadata.tipo_identificacion || 'CEDULA',
                numero_identificacion: user_metadata.numero_identificacion || '0000000000',
                nombre_completo: user_metadata.nombre_completo,
                correo: authData.user.email,
                telefono: user_metadata.telefono || '',
                cuenta_registrada_portal: true,
                historial_clinico_veris: false
              });
              if (insertError) {
                throw new Error('No se pudo completar el registro de tu perfil. Contacta a soporte.');
              }
            }
          }
        }

        const rutaDestino = rol ? (RUTA_POR_ROL[rol] ?? '/agendar-cita') : '/agendar-cita';
        router.push(rutaDestino);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
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
      {/* Login Card */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          borderRadius: '0.75rem',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* Logo placeholder */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '0.5rem',
              background: 'var(--primary-fixed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-container)', letterSpacing: '-0.01em', margin: 0 }}>
            Bienvenido a Veris Online
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>
            Accede a tu portal de salud
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="email" className="input-label">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="tu@email.com"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="input-label">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? 'Iniciando…' : 'Ingresar'}
            {!loading && (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            )}
          </button>
        </form>

        {/* Register link */}
        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            borderTop: '1px solid var(--outline-variant)',
            paddingTop: '1.25rem',
          }}
        >
          <Link
            href="/registro"
            style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: 500, textDecoration: 'none' }}
          >
            ¿Eres nuevo? Regístrate aquí
          </Link>
        </div>
      </div>
    </main>
  );
}
