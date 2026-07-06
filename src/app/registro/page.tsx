'use client';

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

    try {
      // 1. Crear usuario en Auth, inyectando los datos como metadatos por seguridad 
      // en caso de que requiera confirmación de correo.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password,
        options: {
          data: {
            tipo_identificacion,
            numero_identificacion,
            nombre_completo,
            telefono
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) throw new Error('El correo ya está registrado.');
        if (authError.message.includes('Password should be at least')) throw new Error('La contraseña es demasiado débil (mínimo 6 caracteres).');
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario.');
      }

      // Verificamos si Supabase exige confirmación de correo (en cuyo caso no hay sesión aún)
      if (!authData.session) {
        setSuccessMsg('Tu cuenta ha sido creada exitosamente. Por favor, revisa tu bandeja de entrada y confirma tu correo electrónico antes de iniciar sesión. Tus datos se guardarán automáticamente en tu primer ingreso.');
        return;
      }

      // 2. Insertar en tabla pacientes de inmediato porque SÍ hay sesión
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
        setError(`Tu cuenta ha sido creada, pero hubo un problema al guardar tus datos de paciente (Error: ${dbError.message}). Por favor contacta a soporte o intenta iniciar sesión para completar tu registro.`);
        return;
      }

      router.push('/agendar-cita');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-black/20 p-8 rounded-xl shadow-lg border border-foreground/5">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">Registro de Paciente</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 text-sm">{error}</div>}
        {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 text-sm">{successMsg}</div>}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Tipo ID</label>
                <select name="tipo_identificacion" required className="w-full p-2 border rounded-md bg-white dark:bg-black">
                  <option value="CEDULA">Cédula</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="flex-[2]">
                <label className="text-sm font-medium mb-1 block">Número de ID</label>
                <input type="text" name="numero_identificacion" required className="w-full p-2 border rounded-md bg-white dark:bg-black" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Nombre Completo</label>
              <input type="text" name="nombre_completo" required className="w-full p-2 border rounded-md bg-white dark:bg-black" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Correo Electrónico</label>
              <input type="email" name="correo" required className="w-full p-2 border rounded-md bg-white dark:bg-black" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Teléfono (opcional)</label>
              <input type="tel" name="telefono" className="w-full p-2 border rounded-md bg-white dark:bg-black" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Contraseña</label>
              <input type="password" name="password" required minLength={6} className="w-full p-2 border rounded-md bg-white dark:bg-black" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white p-3 rounded-md font-bold hover:bg-primary/90 transition-colors mt-4 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-foreground/70">
          ¿Ya tienes cuenta? <Link href="/login" className="text-primary font-medium hover:underline">Inicia Sesión</Link>
        </p>
      </div>
    </main>
  );
}
