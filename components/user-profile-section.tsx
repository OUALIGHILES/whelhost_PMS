'use client';

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserProfileProps {
  initialUser?: {
    email: string | null;
    user_metadata?: {
      full_name?: string;
      role?: string;
    };
  } | null;
}

export function UserProfileSection({ initialUser }: UserProfileProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);

  // Get display name based on user data
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const role = user?.user_metadata?.role || 'User';

  // Get first two initials for avatar
  const initials = displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{role}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Link href="/profile" className="p-1 rounded-md hover:bg-sidebar-accent transition-colors">
          <User className="w-4 h-4 text-muted-foreground" />
        </Link>
        <button
          onClick={handleLogout}
          className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}