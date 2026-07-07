// Navbar — Veris Online — Diseño Stitch
// Muestra links de navegación según el rol del usuario.
// Estilo: fondo blanco, logo azul marino, links sutiles, sin borde agresivo.

import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import LogoutButton from './LogoutButton';
import { type Role } from '@/utils/auth';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    <header
      style={{
        background: 'var(--surface-container-lowest)',
        borderBottom: '1px solid var(--outline-variant)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <nav
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: '20px',
            color: 'var(--primary)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            flexShrink: 0,
          }}
        >
          Veris <span style={{ color: 'var(--secondary)' }}>Online</span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {user ? (
            <>
              {rol === 'paciente' && (
                <>
                  <NavLink href="/agendar-cita">Inicio</NavLink>
                  <NavLink href="/mis-citas">Mis citas</NavLink>
                  <NavLink href="/historial">Historial</NavLink>
                  <NavLink href="/ayuda">Ayuda</NavLink>
                </>
              )}
              {rol === 'medico' && (
                <NavLink href="/panel-medico">Panel Médico</NavLink>
              )}
              {rol === 'agente_cc' && (
                <NavLink href="/panel-cc">Panel CC</NavLink>
              )}
              {rol === 'admin' && (
                <>
                  <NavLink href="/admin">Administración</NavLink>
                  <NavLink href="/panel-cc">Panel CC</NavLink>
                </>
              )}

              {/* Divider visual */}
              <div style={{ width: 1, height: 20, background: 'var(--outline-variant)', margin: '0 0.5rem' }} />

              {/* Avatar placeholder + Logout */}
              <LogoutButton />
            </>
          ) : (
            <>
              <NavLink href="/login">Iniciar Sesión</NavLink>
              <Link
                href="/registro"
                style={{
                  background: 'var(--primary-container)',
                  color: 'var(--on-primary)',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--on-surface-variant)',
        textDecoration: 'none',
        padding: '0.4rem 0.75rem',
        borderRadius: '0.375rem',
        transition: 'background 0.15s, color 0.15s',
      }}
      className="hover:bg-surface-container hover:text-primary"
    >
      {children}
    </Link>
  );
}
