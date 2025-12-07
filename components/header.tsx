'use client'

import Link from 'next/link';
import { Building2, Moon, Sun, User, LogOut, Home } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NotificationBell } from '@/components/notification-bell';

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="fixed top-0 right-64 left-0 h-16 bg-background border-b border-border z-30 flex items-center justify-between px-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Alula Sky</span>
        </Link>
      </div>

      <div className="flex items-center justify-center flex-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
        >
          <Building2 className="w-4 h-4" />
          <span>العودة إلى الرئيسية</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <NotificationBell />

        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Home className="w-5 h-5" />
          </Link>
          <Link href="/profile" className="p-2 rounded-lg hover:bg-accent transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}