'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LogoutForm() {
  const router = useRouter();

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <form onSubmit={handleLogout}>
      <button type="submit">Logout</button>
    </form>
  );
}