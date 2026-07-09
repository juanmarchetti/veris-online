'use client';

import { createClient } from '@/utils/supabase/client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type LogoutButtonProps = {
  className?: string
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
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
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-error transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Saliendo...' : 'Cerrar sesión'}
    </button>
  );
}
