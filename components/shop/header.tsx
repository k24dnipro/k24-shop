'use client';

import { useState } from 'react';
import {
  Menu,
  Search,
  ShoppingCart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cart } from '@/components/shop/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCart } from '@/lib/hooks/useCart';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  onMobileMenuToggle?: () => void;
}

export function ShopHeader({ onSearch, searchValue = '' }: HeaderProps) {
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-zinc-950/80">
      <div className="pl-4 md:pl-[65px] pr-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="K24 Dnipro"
              width={140}
              height={48}
              className="h-12 w-auto rounded-md"
              priority
            />
          </Link>

          {/* Search bar - Desktop (only on catalog page) */}
          {pathname.startsWith('/catalog') && (
            <form onSubmit={handleSearch} className="hidden xl:flex flex-1 max-w-xl ml-auto mr-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Пошук по назві, артикулу або бренду..."
                  className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-k24-yellow"
                />
              </div>
              <Button
                type="submit"
                className="ml-2 bg-k24-yellow hover:bg-k24-yellow text-black"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-6 mx-6">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-k24-yellow",
                pathname === "/" ? "text-k24-yellow" : "text-white"
              )}
            >
              Головна
            </Link>
            <Link
              href="/catalog"
              className={cn(
                "text-sm font-medium transition-colors hover:text-k24-yellow",
                pathname.startsWith("/catalog") || pathname.startsWith("/products") ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Каталог
            </Link>
            <Link
              href="/delivery"
              className={cn(
                "text-sm font-medium transition-colors hover:text-k24-yellow",
                pathname === "/delivery" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Доставка
            </Link>
            <Link
              href="/about"
              className={cn(
                "text-sm font-medium transition-colors hover:text-k24-yellow",
                pathname === "/about" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Про нас
            </Link>
            <Link
              href="/contacts"
              className={cn(
                "text-sm font-medium transition-colors hover:text-k24-yellow",
                pathname === "/contacts" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Контакти
            </Link>
          </nav>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">


            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-k24-yellow text-[10px] font-bold text-black">
                  {getTotalItems()}
                </span>
              )}
            </Button>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="bg-zinc-950 border-l border-zinc-800 w-[300px] sm:w-[400px] p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="text-left text-white">Меню</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 p-6">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium transition-colors hover:text-k24-yellow",
                pathname === "/" ? "text-k24-yellow" : "text-white"
              )}
            >
              Головна
            </Link>
            <Link
              href="/catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium transition-colors hover:text-k24-yellow",
                pathname.startsWith("/catalog") || pathname.startsWith("/products") ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Каталог
            </Link>
            <Link
              href="/delivery"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium transition-colors hover:text-k24-yellow",
                pathname === "/delivery" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Доставка
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium transition-colors hover:text-k24-yellow",
                pathname === "/about" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Про нас
            </Link>
            <Link
              href="/contacts"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium transition-colors hover:text-k24-yellow",
                pathname === "/contacts" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Контакти
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cart Sheet */}
      <Cart open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
