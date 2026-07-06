import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import LogoutButton from './LogoutButton';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-foreground/10 mb-8">
      <Link href="/" className="text-2xl font-bold tracking-tighter text-primary">
        Veris <span className="text-secondary">Online</span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/agendar-cita" className="text-sm font-medium hover:text-primary transition-colors">Agendar</Link>
            <Link href="/mis-citas" className="text-sm font-medium hover:text-primary transition-colors">Mis Citas</Link>
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
