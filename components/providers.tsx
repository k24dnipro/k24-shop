'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/lib/hooks/useCart';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Toaster />
    </CartProvider>
  );
}
