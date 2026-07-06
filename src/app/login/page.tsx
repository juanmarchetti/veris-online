'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO-PRODUCTO: Según el RF-01.1 del SRS, el ingreso debe ser por Tipo y Número de Identificación.
  // Sin embargo, Supabase Auth utiliza nativamente correo/contraseña. 
  // Por ahora se implementa con correo. A futuro se puede requerir un flujo que busque
  // el correo asociado a la identificación ingresada antes de autenticar.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
      }

      // Check if user is fully loaded and if they are a patient missing their row
      if (authData.user) {
        // Obtenemos el registro de pacientes para asegurar que exista
        const { error: fetchError } = await supabase
          .from('pacientes')
          .select('id')
          .eq('id_auth_user', authData.user.id)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // No existe la fila. Probablemente hubo confirmación de correo o un error de RLS en el signUp.
          // Recuperamos los metadatos de usuario guardados en signUp.
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
              console.error('Error auto-creando paciente tras login:', insertError);
              throw new Error('No se pudo completar el registro de tu perfil de paciente. Contacta a soporte.');
            }
          }
        }
      }

      router.push('/agendar-cita');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-black/20 p-8 rounded-xl shadow-lg border border-foreground/5">
        <h1 className="text-3xl font-bold text-primary mb-6 text-center">Iniciar Sesión</h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Correo Electrónico</label>
            <input type="email" name="email" required className="w-full p-2 border rounded-md bg-white dark:bg-black" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Contraseña</label>
            <input type="password" name="password" required className="w-full p-2 border rounded-md bg-white dark:bg-black" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white p-3 rounded-md font-bold hover:bg-primary/90 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Ingresar'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-foreground/70">
          ¿Eres nuevo? <Link href="/registro" className="text-primary font-medium hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </main>
  );
}
