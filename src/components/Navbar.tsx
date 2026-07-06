// Navbar actualizada para mostrar links de navegación según el rol del usuario autenticado.
// Antes: siempre mostraba "Agendar" y "Mis Citas" para cualquier usuario logueado,
// lo cual era incorrecto para médicos, agentes CC y admins.
// Ahora: consulta perfiles.rol (permitido por la política RLS "Los usuarios pueden leer su propio perfil")
// y renderiza los links apropiados para cada rol.

import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import LogoutButton from './LogoutButton';
import { type Role } from '@/utils/auth';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Consultar el rol del usuario autenticado (RLS permite leer el propio perfil)
  let rol: Role | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();
    rol = (perfil?.rol as Role) ?? null;
  }

  return (
    <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-foreground/10 mb-8">
      <Link href="/" className="text-2xl font-bold tracking-tighter text-primary">
        Veris <span className="text-secondary">Online</span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Links según rol — cada panel solo es visible para su rol correspondiente */}
            {rol === 'paciente' && (
              <>
                <Link href="/agendar-cita" className="text-sm font-medium hover:text-primary transition-colors">
                  Agendar
                </Link>
                <Link href="/mis-citas" className="text-sm font-medium hover:text-primary transition-colors">
                  Mis Citas
                </Link>
              </>
            )}
            {rol === 'medico' && (
              <Link href="/panel-medico" className="text-sm font-medium hover:text-primary transition-colors">
                Panel Médico
              </Link>
            )}
            {rol === 'agente_cc' && (
              <Link href="/panel-cc" className="text-sm font-medium hover:text-primary transition-colors">
                Panel CC
              </Link>
            )}
            {rol === 'admin' && (
              <>
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  Administración
                </Link>
                <Link href="/panel-cc" className="text-sm font-medium hover:text-primary transition-colors">
                  Panel CC
                </Link>
              </>
            )}
            <LogoutButton />
          </>
        ) : (
          <>
            <Link 
              href="/login" 
              className="px-5 py-2 text-sm font-medium rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/registro" 
              className="px-5 py-2 text-sm font-medium rounded-full bg-primary text-white hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
