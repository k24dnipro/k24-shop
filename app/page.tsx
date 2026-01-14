"use client";

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const didRedirectRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Guard against StrictMode double-invocation causing overlapping navigations (AbortError in dev).
      if (didRedirectRef.current) return;
      didRedirectRef.current = true;
      if (user) {
        router.replace("/admin");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (!checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="text-sm text-zinc-500">Завантаження...</p>
      </div>
    </div>
  );
}
