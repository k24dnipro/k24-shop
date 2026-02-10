"use client";

import {
  Suspense,
  useEffect,
  useState,
} from 'react';
import {
  ArrowUpDown,
  Filter,
  Loader2,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { NoIndexFilter } from '@/components/seo/noindex-filter';
import { ShopHeader } from '@/components/shop/header';
import { ShopSidebar } from '@/components/shop/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/lib/hooks/useCart';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import {
  useProducts,
  useProductsSearch,
} from '@/modules/products/hooks/use-products';
import {
  Product,
  PRODUCT_STATUSES,
  ProductStatus,
} from '@/modules/products/types';

const statusColors: Record<string, string> = {
  in_stock: 'text-emerald-400',
  on_order: 'text-blue-400',
  out_of_stock: 'text-red-400',
  discontinued: 'text-zinc-400',
};

type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">Завантаження...</div>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [inputSearchTerm, setInputSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Products hook for category browsing
  const {
    products,
    totalCount,
    loading,
    hasMore,
    loadMore,
  } = useProducts({
    pageSize: 12,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: statusFilter !== 'all' ? statusFilter as ProductStatus : undefined,
    sortBy: sortBy,
  });

  // Search hook with pagination
  const {
    searchTerm: activeSearchTerm,
    products: searchResults,
    totalCount: searchTotalCount,
    totalSearchCount,
    categoryCounts: searchCategoryCounts,
    loading: searchLoading,
    hasMore: searchHasMore,
    search: performSearch,
    loadMore: loadMoreSearch,
    clearSearch,
  } = useProductsSearch({
    pageSize: 12,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: statusFilter !== 'all' ? statusFilter as ProductStatus : undefined,
    sortBy: sortBy,
  });

  const isSearchActive = !!activeSearchTerm;

  const { categories, loading: categoriesLoading } = useCategories();
  const { addItem } = useCart();

  // Run search when URL has ?q= (e.g. navigated from product page or shared link)
  useEffect(() => {
    if (initialSearch.trim()) {
      performSearch(initialSearch);
    }
  }, [initialSearch, performSearch]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.status === 'discontinued' || product.status === 'on_order') {
      toast.error('Цей товар недоступний для додавання до кошика. Будь ласка, зв\'яжіться з нами.');
      return;
    }

    addItem(product);
    toast.success('Товар додано до корзини!', {
      description: product.name,
    });
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Don't clear search when selecting category - allow filtering search results by category
    if (!isSearchActive) {
      setInputSearchTerm('');
    }
  };

  // Handle search from header
  const handleHeaderSearch = (query: string) => {
    setInputSearchTerm(query);
    if (query.trim()) {
      performSearch(query);
    }
  };

  const getStatusLabel = (status: string) => {
    return PRODUCT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  // Products are already sorted by the hooks
  const displayProducts = products;
  const displaySearchResults = searchResults;

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* SEO: noindex для фільтрів */}
      <NoIndexFilter />
      
      {/* Header */}
      <ShopHeader
        onSearch={handleHeaderSearch}
        searchValue={isSearchActive ? activeSearchTerm : inputSearchTerm}
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
          isSearchActive={isSearchActive}
          searchCategoryCounts={searchCategoryCounts}
          totalSearchCount={totalSearchCount}
          selectedCategoryActualCount={!isSearchActive && selectedCategory !== 'all' ? totalCount : undefined}
        />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Hero section */}
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {isSearchActive && activeSearchTerm
                  ? `Результати пошуку: "${activeSearchTerm}"`
                  : selectedCategory !== 'all'
                    ? categories.find((c) => c.id === selectedCategory)?.name || 'Товари'
                    : 'Усі товари'}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-k24-yellow/10 text-k24-yellow border-k24-yellow/30">
                  <Package className="mr-2 h-3.5 w-3.5" />
                  {isSearchActive
                    ? `${searchTotalCount} знайдено`
                    : `${totalCount || 0} товарів`}
                </Badge>
                {isSearchActive && searchResults.length > 0 && (
                  <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700">
                    Показано {searchResults.length} з {searchTotalCount}
                  </Badge>
                )}
                {!isSearchActive && products.length > 0 && (
                  <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700">
                    Показано {products.length} з {totalCount || 0}
                  </Badge>
                )}
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-800 text-white">
                    <Filter className="mr-2 h-4 w-4 text-zinc-500" />
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem
                      value="all"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Всі статуси
                    </SelectItem>
                    {PRODUCT_STATUSES.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                        className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-800 text-white">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-zinc-500" />
                    <SelectValue placeholder="Сортування" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem
                      value="date_desc"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Новіші спочатку
                    </SelectItem>
                    <SelectItem
                      value="date_asc"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Старіші спочатку
                    </SelectItem>
                    <SelectItem
                      value="price_asc"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Ціна: від низької
                    </SelectItem>
                    <SelectItem
                      value="price_desc"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Ціна: від високої
                    </SelectItem>
                    <SelectItem
                      value="name_asc"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Назва: А-Я
                    </SelectItem>
                    <SelectItem
                      value="name_desc"
                      className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                    >
                      Назва: Я-А
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset filters */}
              {(isSearchActive || selectedCategory !== 'all' || statusFilter !== 'all' || sortBy !== 'date_desc') && (
                <div className="flex gap-2">
                  {isSearchActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-800 text-zinc-300 hover:border-k24-yellow hover:text-white"
                      onClick={() => {
                        setInputSearchTerm('');
                        clearSearch();
                      }}
                    >
                      Скинути пошук
                    </Button>
                  )}
                  {(selectedCategory !== 'all' || statusFilter !== 'all' || sortBy !== 'date_desc') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-800 text-zinc-300 hover:border-k24-yellow hover:text-white"
                      onClick={() => {
                        if (selectedCategory !== 'all') handleCategorySelect('all');
                        setStatusFilter('all');
                        setSortBy('date_desc');
                      }}
                    >
                      Скинути фільтри
                    </Button>
                  )}
                </div>
              )}
            </div>

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
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-64 bg-zinc-900/60" />
                    ))}
                  </div>
                ) : displaySearchResults.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                      {displaySearchResults.map((product) => {
                        const firstImage = product.images?.[0]?.url;
                        const statusClass = statusColors[product.status] || statusColors.discontinued;
                        return (
                          <Link key={product.id} href={`/products/${product.id}`}>
                            <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col hover:border-k24-yellow/40 transition-colors cursor-pointer h-full pt-0 pb-0">
                              <div className="relative aspect-4/3 bg-zinc-950 shrink-0">
                                {firstImage ? (
                                  <ProductImage
                                    src={firstImage}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                                    Немає фото
                                  </div>
                                )}
                              </div>
                              <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col gap-3 min-h-0">
                                <div className="flex-1 flex flex-col min-h-0 gap-2">
                                  <h3 className="text-[15px] sm:text-base font-semibold leading-snug text-white line-clamp-2 w-full">
                                    {product.name}
                                  </h3>
                                  <span
                                    className={`text-[12px] sm:text-xs ${statusClass}`}
                                  >
                                    {getStatusLabel(product.status)}
                                  </span>
                                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] sm:text-xs text-zinc-400 flex-1 min-w-0">
                                      <span className="truncate">
                                        <span className="sm:hidden font-mono text-zinc-300">{product.partNumber || '—'}</span>
                                        <span className="hidden sm:inline">
                                          <span className="text-zinc-500">Артикул:</span>{' '}
                                          <span className="font-mono text-zinc-300">{product.partNumber || '—'}</span>
                                        </span>
                                      </span>
                                      <span className="truncate">
                                        <span className="sm:hidden text-zinc-300">{product.brand || '—'}</span>
                                        <span className="hidden sm:inline">
                                          <span className="text-zinc-500">Виробник:</span>{' '}
                                          <span className="text-zinc-300">{product.brand || '—'}</span>
                                        </span>
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-base sm:text-lg text-k24-yellow font-bold block">
                                        {product.price.toLocaleString()} ₴
                                      </span>
                                      {product.originalPrice && (
                                        <span className="text-[13px] sm:text-sm text-zinc-500 line-through block">
                                          {product.originalPrice.toLocaleString()} ₴
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {product.status === 'in_stock' && (
                                  <Button
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-medium text-[13px] sm:text-sm h-10 shrink-0 rounded-lg"
                                  >
                                    <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                                    В корзину
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>

                    {searchHasMore && !searchLoading && (
                      <div className="flex flex-col items-center gap-2 mt-6">
                        <Button
                          onClick={loadMoreSearch}
                          className="bg-k24-yellow hover:bg-k24-yellow text-black px-6"
                        >
                          Показати більше
                        </Button>
                        <span className="text-xs text-zinc-500">
                          Залишилось товарів: {Math.max(0, searchTotalCount - displaySearchResults.length)}
                        </span>
                      </div>
                    )}
                  </>
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
                  <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-64 bg-zinc-900/60" />
                    ))}
                  </div>
                ) : displayProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                      {displayProducts.map((product) => {
                        const firstImage = product.images?.[0]?.url;
                        const statusClass = statusColors[product.status] || statusColors.discontinued;
                        return (
                          <Link key={product.id} href={`/products/${product.id}`}>
                            <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col hover:border-k24-yellow/40 transition-colors cursor-pointer h-full pt-0 pb-0">
                              <div className="relative aspect-4/3 bg-zinc-950 shrink-0">
                                {firstImage ? (
                                  <ProductImage
                                    src={firstImage}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                                    Немає фото
                                  </div>
                                )}
                              </div>
                              <CardContent className="pt-0 px-4 pb-4 flex-1 flex flex-col gap-3 min-h-0">
                                <div className="flex-1 flex flex-col min-h-0 gap-2">
                                  <h3 className="text-[15px] sm:text-base font-semibold leading-snug text-white line-clamp-2 w-full">
                                    {product.name}
                                  </h3>
                                  <span
                                    className={`text-[12px] sm:text-xs ${statusClass}`}
                                  >
                                    {getStatusLabel(product.status)}
                                  </span>
                                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] sm:text-xs text-zinc-400 flex-1 min-w-0">
                                      <span className="truncate">
                                        <span className="sm:hidden font-mono text-zinc-300">{product.partNumber || '—'}</span>
                                        <span className="hidden sm:inline">
                                          <span className="text-zinc-500">Артикул:</span>{' '}
                                          <span className="font-mono text-zinc-300">{product.partNumber || '—'}</span>
                                        </span>
                                      </span>
                                      <span className="truncate">
                                        <span className="sm:hidden text-zinc-300">{product.brand || '—'}</span>
                                        <span className="hidden sm:inline">
                                          <span className="text-zinc-500">Виробник:</span>{' '}
                                          <span className="text-zinc-300">{product.brand || '—'}</span>
                                        </span>
                                      </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-base sm:text-lg text-k24-yellow font-bold block">
                                        {product.price.toLocaleString()} ₴
                                      </span>
                                      {product.originalPrice && (
                                        <span className="text-[13px] sm:text-sm text-zinc-500 line-through block">
                                          {product.originalPrice.toLocaleString()} ₴
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {product.status === 'in_stock' && (
                                  <Button
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-medium text-[13px] sm:text-sm h-10 shrink-0 rounded-lg"
                                  >
                                    <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                                    В корзину
                                  </Button>
                                )}
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
                          className="bg-k24-yellow hover:bg-k24-yellow text-black px-6"
                        >
                          Показати більше
                        </Button>
                        <span className="text-xs text-zinc-500">
                          Залишилось товарів: {Math.max(0, (totalCount || 0) - displayProducts.length)}
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
              isSearchActive={isSearchActive}
              searchCategoryCounts={searchCategoryCounts}
              totalSearchCount={totalSearchCount}
              selectedCategoryActualCount={!isSearchActive && selectedCategory !== 'all' ? totalCount : undefined}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
