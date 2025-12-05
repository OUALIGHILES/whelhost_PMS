'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { PageTitle } from '@/components/page-title'
import { ReactNode, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface User {
  id: string;
  email: string | null;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
}

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Get user profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", authUser.id)
          .single();

        // Combine user data with profile data
        const userData = {
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            full_name: profile?.full_name || authUser.user_metadata?.full_name,
            role: profile?.role || authUser.user_metadata?.role,
          }
        };

        setUser(userData);
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
        return;
      }

      setLoading(false);
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // Only render if user exists (after redirect has been handled)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - appears on the right in RTL layout */}
      <Sidebar user={user} />

      {/* Header */}
      <Header />

      {/* Content wrapper with padding for the fixed header and right sidebar */}
      <div className="pt-16 pl-0 pr-64">
        <main className="p-8">
          <PageTitle />
          {children}
        </main>
      </div>
    </div>
  )
}
