'use client';

import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth state to load
    if (!loading) {
      // If not authenticated, redirect to home
      if (!user) {
        router.push('/');
        return;
      }

      // Check if user has premium/is_premium status
      if (profile && !profile.is_premium) {
        router.push('/packages');
        return;
      }

      setIsChecking(false);
    }
  }, [user, profile, loading, router]);

  // Show nothing while checking authentication/subscription
  if (isChecking || loading || !user || (profile && !profile.is_premium)) {
    return (
      <div className="min-h-screen bg-[#1E2228] flex items-center justify-center">
        <div className="text-[#EBEAE6]">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
