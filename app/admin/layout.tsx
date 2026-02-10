'use client';

import {
  useEffect,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/sidebar';
import { Toaster } from '@/components/ui/sonner';
import {
  AuthProvider,
  useAuth,
} from '@/lib/hooks/useAuth';
import { logOut } from '@/modules/users/services/users.service';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    // Only redirect when we know there is no Firebase auth user.
    if (!loading && !firebaseUser && !didRedirectRef.current) {
      didRedirectRef.current = true;
      router.replace('/login');
    }
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    // Заявка не одобрена — вийти і перенаправити на логін (тільки в effect, не під час render)
    if (loading || !user) return;
    if (user.approvalStatus !== 'pending') return;
    if (didRedirectRef.current) return;
    didRedirectRef.current = true;
    logOut().then(() => router.replace('/login'));
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-k24-yellow border-t-transparent" />
          <p className="text-sm text-zinc-500">Завантаження...</p>
        </div>
      </div>
    );
  }

  // If we are authenticated but profile is still resolving/creating, avoid a flash redirect.
  if (firebaseUser && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-k24-yellow border-t-transparent" />
          <p className="text-sm text-zinc-500">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !user) {
    return null;
  }

  if (user.approvalStatus === 'pending') {
    return null; // redirect handled in useEffect
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
