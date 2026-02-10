'use client';

import {
  useEffect,
  useState,
} from 'react';
import {
  FolderTree,
  Menu,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  usePathname,
  useRouter,
} from 'next/navigation';
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

export function ShopHeader({ onSearch, searchValue = '', onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  
  const isCatalogPage = pathname.startsWith('/catalog') || pathname.startsWith('/products');

  // Sync local search with URL/parent when searchValue changes (e.g. after navigating with ?q=)
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = localSearch.trim();
    if (!query) return;
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/catalog?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-zinc-950/80">
      <div className="pl-4 md:pl-[65px] pr-4">
        {/* Top bar */}
        <div className="flex h-16 items-center gap-2 sm:gap-4">
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

          {/* Search bar - Desktop and Mobile (only on catalog page) */}
          {isCatalogPage && (
            <form onSubmit={handleSearch} className="flex flex-1 min-w-0 max-w-md">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Пошук за назвою, брендом, артикулом або OEM..."
                  className="w-full pl-8 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-k24-yellow text-sm h-9 sm:h-10"
                />
              </div>
              <Button
                type="submit"
                className="ml-1 sm:ml-2 bg-k24-yellow hover:bg-k24-yellow text-black shrink-0 h-9 sm:h-10 px-2 sm:px-3"
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

          {/* Spacer to push actions (акаунт, корзина) вправо */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User / Особистий кабінет - Desktop only, right side */}
            <Button
              variant="ghost"
              className="hidden lg:inline-flex items-center gap-2 text-zinc-400 hover:text-white"
              asChild
            >
              <Link
                href="/account"
                title="Особистий кабінет"
                className={cn(
                  pathname === "/account" && "text-k24-yellow"
                )}
              >
                <User className="h-5 w-5" />
                <span className="text-sm">Особистий кабінет</span>
              </Link>
            </Button>

            {/* Categories button - Mobile (only on catalog page) */}
            {isCatalogPage && onMobileMenuToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-zinc-400 hover:text-white"
                onClick={onMobileMenuToggle}
                title="Категорії"
              >
                <FolderTree className="h-5 w-5" />
              </Button>
            )}

            {/* Cart - Mobile only (desktop uses floating cart) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-zinc-400 hover:text-white relative"
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
            <Link
              href="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium transition-colors hover:text-k24-yellow",
                pathname === "/account" ? "text-k24-yellow" : "text-zinc-400"
              )}
            >
              Особистий кабінет
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cart Sheet */}
      <Cart open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}
