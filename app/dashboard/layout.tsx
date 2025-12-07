'use client';

import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to home
    if (!user) {
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [user, router]);

  // Show nothing while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#1E2228] flex items-center justify-center">
        <div className="text-[#EBEAE6]">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
