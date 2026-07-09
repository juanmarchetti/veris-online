import { createClient } from '@/utils/supabase/server';
import { type Role } from '@/utils/auth';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let rol: Role | null = null;
  let perfil: { rol: string; avatar_url: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from('perfiles')
      .select('rol, avatar_url')
      .eq('id', user.id)
      .single();

    perfil = data;
    rol = (perfil?.rol as Role) ?? null;
  }

  return (
    <NavbarClient
      rol={rol}
      userEmail={user?.email ?? null}
      avatarUrl={perfil?.avatar_url ?? null}
    />
  );
}
