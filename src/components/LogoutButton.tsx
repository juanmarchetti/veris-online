'use client';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--error)',
        background: 'transparent',
        border: 'none',
        padding: '0.4rem 0.75rem',
        borderRadius: '0.375rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {loading ? 'Saliendo…' : 'Cerrar Sesión'}
    </button>
  );
}
