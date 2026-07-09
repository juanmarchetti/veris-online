'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function RegistroPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
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
      const { data: existingUser } = await supabase
        .from('pacientes')
        .select('correo, numero_identificacion')
        .or(`correo.eq.${correo},numero_identificacion.eq.${numero_identificacion}`)
        .limit(1)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.numero_identificacion === numero_identificacion) {
          throw new Error('Este número de identificación ya se encuentra registrado.');
        }
        if (existingUser.correo === correo) {
          throw new Error('Este correo ya está registrado. Por favor, inicia sesión.');
        }
      }

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
        if (msg.includes('Password should be at least')) throw new Error('La contraseña es demasiado débil. Usa mínimo 6 caracteres.');
        if (msg === '{}' || msg.trim() === '') throw new Error('Error inesperado al registrarte. Intenta de nuevo.');
        throw new Error(msg);
      }

      if (!authData.user) throw new Error('No se pudo crear el usuario.');

      if (!authData.session) {
        setSuccessMsg('Cuenta creada. Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.');
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
        historial_clinico_veris: true
      });

      if (dbError) {
        setError(`Tu cuenta fue creada, pero hubo un problema al guardar tus datos (${dbError.message}).`);
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
    <main className="grid min-h-[72vh] place-items-center bg-background px-4 py-8">
      <div className="card w-full max-w-lg border-t-4 border-t-primary p-6 sm:p-8">
        <div className="mb-8 grid justify-items-center gap-4 text-center">
          <BrandLogo href="/" />
          <div>
            <h1 className="text-2xl font-extrabold text-primary">Crea tu cuenta</h1>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Completa tus datos para activar tu acceso al portal.
            </p>
          </div>
        </div>

        {error && <div className="alert-error mb-5">{error}</div>}
        {successMsg && (
          <div className="alert-success mb-5">
            {successMsg}
            <div className="mt-3">
              <Link href="/login" className="font-bold text-primary hover:underline">Ir al inicio de sesión</Link>
            </div>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
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

            <div>
              <label htmlFor="nombre_completo" className="input-label">Nombres y apellidos</label>
              <input id="nombre_completo" type="text" name="nombre_completo" required placeholder="Ej. Juan Pérez" className="input-field" />
            </div>

            <div>
              <label htmlFor="correo" className="input-label">Correo electrónico</label>
              <input id="correo" type="email" name="correo" required placeholder="tu@email.com" className="input-field" />
            </div>

            <div>
              <label htmlFor="telefono" className="input-label">Número de celular</label>
              <input id="telefono" type="tel" name="telefono" placeholder="0912345678" className="input-field" />
            </div>

            <PasswordField
              id="password"
              name="password"
              label="Contraseña"
              show={showPassword}
              onToggle={() => setShowPassword(value => !value)}
            />

            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmar contraseña"
              show={showConfirm}
              onToggle={() => setShowConfirm(value => !value)}
            />

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-bold text-secondary hover:underline">
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  name,
  label,
  show,
  onToggle,
}: {
  id: string
  name: string
  label: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label htmlFor={id} className="input-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          name={name}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="input-field pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-outline transition-colors hover:bg-surface-container hover:text-primary"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
