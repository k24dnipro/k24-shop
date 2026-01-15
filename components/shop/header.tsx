'use client';

import { useState } from 'react';
import {
  Car,
  Menu,
  Phone,
  Search,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { Cart } from '@/components/shop/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/hooks/useCart';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  onMobileMenuToggle?: () => void;
}

export function ShopHeader({ onSearch, searchValue = '', onMobileMenuToggle }: HeaderProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="pl-4 md:pl-[65px] pr-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Car className="h-6 w-6 text-amber-500" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-white">K24 Shop</span>
              <span className="text-xs text-zinc-500">Автозапчастини</span>
            </div>
          </Link>

          {/* Search bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Пошук по назві, артикулу або бренду..."
                className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500"
              />
            </div>
            <Button
              type="submit"
              className="ml-2 bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Contact */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex text-zinc-400 hover:text-white"
              asChild
            >
              <a href="tel:+380">
                <Phone className="h-5 w-5" />
              </a>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                  {getTotalItems()}
                </span>
              )}
            </Button>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-zinc-400 hover:text-white"
              onClick={onMobileMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search bar - Mobile */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Пошук..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
        </form>
      </div>

      {/* Cart Sheet */}
      <Cart open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
