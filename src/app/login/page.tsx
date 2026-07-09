'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const RUTA_POR_ROL: Record<string, string> = {
  paciente: '/inicio',
  medico: '/panel-medico',
  agente_cc: '/panel-cc',
  admin: '/admin',
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
        router.refresh();
        return;
      }
      setLoading(false);
    };

    checkSession();
  }, [router, supabase]);

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
                historial_clinico_veris: true
              });

              if (insertError) {
                console.error('Error insertando paciente post-login:', insertError);
                throw new Error(`No se pudo completar tu perfil (${insertError.message}). Intenta registrarte nuevamente con la cédula correcta.`);
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
    <main className="grid min-h-[72vh] place-items-center bg-background px-4 py-8">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 grid justify-items-center gap-4 text-center">
          <BrandLogo href="/" />
          <div>
            <h1 className="text-2xl font-extrabold text-primary">Bienvenido</h1>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Accede a tu portal de salud para gestionar tus videoconsultas.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-error mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label htmlFor="email" className="input-label">Correo electrónico</label>
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
              placeholder="Ingresa tu contraseña"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Ingresando...' : 'Ingresar'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-outline-variant pt-5 text-center">
          <Link href="/registro" className="text-sm font-bold text-secondary hover:underline">
            ¿Eres nuevo? Regístrate aquí
          </Link>
        </div>
      </div>
    </main>
  );
}
