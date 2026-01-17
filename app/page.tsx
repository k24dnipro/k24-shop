"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShopHeader } from '@/components/shop/header';
import { ShopSidebar } from '@/components/shop/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/lib/hooks/useCart';
import { useCategories } from '@/lib/hooks/useCategories';
import { useProducts } from '@/lib/hooks/useProducts';
import { searchProducts } from '@/lib/services/products';
import {
  Product,
  PRODUCT_STATUSES,
} from '@/lib/types';

const statusColors: Record<string, string> = {
  in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_order: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  out_of_stock: 'bg-red-500/10 text-red-400 border-red-500/20',
  discontinued: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    products,
    totalCount,
    loading,
    hasMore,
    loadMore,
  } = useProducts({
    pageSize: 12,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
  });
  const { categories, loading: categoriesLoading } = useCategories();
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success('Товар додано до корзини!');
  };

  const handleSearch = async (query?: string) => {
    const searchQuery = query !== undefined ? query : searchTerm;
    
    if (searchQuery.trim()) {
      setSearchLoading(true);
      setIsSearchActive(true);
      setActiveSearchTerm(searchQuery.trim()); // Зберігаємо пошуковий запит
      try {
        const results = await searchProducts(
          searchQuery.trim(),
          selectedCategory !== 'all' ? { categoryId: selectedCategory } : undefined
        );
        setSearchResults(results);
      } catch (error) {
        console.error('Помилка пошуку:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setIsSearchActive(false);
      setActiveSearchTerm('');
      setSearchResults([]);
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
    setActiveSearchTerm('');
    setIsSearchActive(false);
    setSearchResults([]);
  };

  // Handle search from header
  const handleHeaderSearch = (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      handleSearch(query); // Передаємо query безпосередньо
    }
  };

  const getStatusLabel = (status: string) => {
    return PRODUCT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Header */}
      <ShopHeader
        onSearch={handleHeaderSearch}
        searchValue={searchTerm}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <ShopSidebar
          categories={categories}
          loading={categoriesLoading}
          selectedCategoryId={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Hero section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Каталог автозапчастин K24</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {isSearchActive && activeSearchTerm
                  ? `Результати пошуку: "${activeSearchTerm}"`
                  : selectedCategory !== 'all'
                  ? categories.find((c) => c.id === selectedCategory)?.name || 'Товари'
                  : 'Усі товари'}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  <Package className="mr-2 h-3.5 w-3.5" />
                  {isSearchActive
                    ? `${searchResults.length} знайдено`
                    : selectedCategory !== 'all'
                    ? `${categories.find((c) => c.id === selectedCategory)?.productCount || 0} товарів`
                    : `${totalCount || 0} товарів`}
                </Badge>
                {!isSearchActive && products.length > 0 && (
                  <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700">
                    Показано {products.length} {selectedCategory !== 'all' 
                      ? `з ${categories.find((c) => c.id === selectedCategory)?.productCount || 0}`
                      : `з ${totalCount || 0}`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Search/Filter actions */}
            {(isSearchActive || selectedCategory !== 'all') && (
              <div className="flex gap-2">
                {isSearchActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-white"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveSearchTerm('');
                      setIsSearchActive(false);
                      setSearchResults([]);
                    }}
                  >
                    Скинути пошук
                  </Button>
                )}
                {selectedCategory !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-white"
                    onClick={() => handleCategorySelect('all')}
                  >
                    Скинути категорію
                  </Button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {isSearchActive && activeSearchTerm ? (
              <div>
                {searchLoading && (
                  <Badge variant="outline" className="border-zinc-800 text-zinc-400 mb-4">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Пошук...
                  </Badge>
                )}

                {searchLoading && searchResults.length === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-64 bg-zinc-900/60" />
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {searchResults.map((product) => {
                      const firstImage = product.images?.[0]?.url;
                      const statusClass = statusColors[product.status] || statusColors.discontinued;
                      return (
                        <Link key={product.id} href={`/products/${product.id}`}>
                          <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col hover:border-amber-500/40 transition-colors cursor-pointer h-full">
                            <div className="relative aspect-[4/3] bg-zinc-950">
                              {firstImage ? (
                                <Image
                                  src={firstImage}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                                  Немає фото
                                </div>
                              )}
                              <div className="absolute top-3 left-3">
                                <Badge variant="outline" className={statusClass}>
                                  {getStatusLabel(product.status)}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4 flex-1 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                  <h3 className="text-base font-semibold leading-tight text-white">{product.name}</h3>
                                  <p className="text-xs text-zinc-500">
                                    {product.partNumber || product.sku}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {product.brand || '—'}
                                  </p>
                                </div>
                                <span className="text-amber-400 font-semibold shrink-0">
                                  {product.price.toLocaleString()} ₴
                                </span>
                              </div>
                              <Button
                                onClick={(e) => handleAddToCart(e, product)}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium text-sm h-9"
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                В корзину
                              </Button>
                              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                                <span>{product.views || 0} переглядів</span>
                                <span>
                                  {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardContent className="p-8 text-center space-y-3">
                      <p className="text-white font-medium">Нічого не знайдено</p>
                      <p className="text-zinc-500 text-sm">
                        За запитом &quot;{activeSearchTerm}&quot; не знайдено жодного товару.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div>
                {loading && (
                  <Badge variant="outline" className="border-zinc-800 text-zinc-400 mb-4">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Завантаження...
                  </Badge>
                )}

                {loading && products.length === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-64 bg-zinc-900/60" />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {products.map((product) => {
                        const firstImage = product.images?.[0]?.url;
                        const statusClass = statusColors[product.status] || statusColors.discontinued;
                        return (
                          <Link key={product.id} href={`/products/${product.id}`}>
                            <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col hover:border-amber-500/40 transition-colors cursor-pointer h-full">
                              <div className="relative aspect-[4/3] bg-zinc-950">
                                {firstImage ? (
                                  <Image
                                    src={firstImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                                    Немає фото
                                  </div>
                                )}
                                <div className="absolute top-3 left-3">
                                  <Badge variant="outline" className={statusClass}>
                                    {getStatusLabel(product.status)}
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="p-4 flex-1 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1 flex-1">
                                    <h3 className="text-base font-semibold leading-tight text-white">{product.name}</h3>
                                    <p className="text-xs text-zinc-500">
                                      {product.partNumber || product.sku}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                      {product.brand || '—'}
                                    </p>
                                  </div>
                                  <span className="text-amber-400 font-semibold shrink-0">
                                    {product.price.toLocaleString()} ₴
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto pt-2 border-t border-zinc-800">
                                  <span>{product.views || 0} переглядів</span>
                                  <span>
                                    {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>

                    {hasMore && !loading && (
                      <div className="flex flex-col items-center gap-2 mt-6">
                        <Button
                          onClick={loadMore}
                          className="bg-amber-500 hover:bg-amber-600 text-black px-6"
                        >
                          Показати більше
                        </Button>
                        <span className="text-xs text-zinc-500">
                          {selectedCategory !== 'all' 
                            ? `Залишилось товарів: ${(categories.find((c) => c.id === selectedCategory)?.productCount || 0) - products.length}`
                            : `Залишилось товарів: ${(totalCount || 0) - products.length}`}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="bg-zinc-900/60 border-zinc-800">
                    <CardContent className="p-8 text-center space-y-3">
                      <p className="text-white font-medium">Товари відсутні</p>
                      <p className="text-zinc-500 text-sm">
                        В цій категорії поки немає товарів.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar - Mobile */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0 bg-zinc-950 border-zinc-800">
            <ShopSidebar
              categories={categories}
              loading={categoriesLoading}
              selectedCategoryId={selectedCategory}
              onCategorySelect={handleCategorySelect}
              isMobile={true}
              onClose={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
