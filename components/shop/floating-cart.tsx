"use client";

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/hooks/useCart';
import { Cart } from './cart';

/**
 * Floating cart button for desktop - always visible in corner
 */
export function FloatingCart() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <>
      {/* Floating Cart Button - Desktop only */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsCartOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-k24-yellow hover:bg-k24-yellow/90 text-black shadow-lg hover:shadow-xl transition-all duration-200 relative"
          aria-label="Відкрити корзину"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-zinc-950">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Button>
      </div>

      {/* Cart Sheet */}
      <Cart open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
