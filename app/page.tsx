"use client";

import {
  useEffect,
  useState,
} from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  ArrowRight,
  Filter,
  FolderTree,
  Loader2,
  Package,
  Search,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // Збережений пошуковий запит для відображення результатів
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const {
    products,
    loading,
    hasMore,
    loadMore,
    refresh,
  } = useProducts({
    pageSize: 12,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
  });
  const { categories, loading: categoriesLoading } = useCategories();

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setSearchLoading(true);
      setIsSearchActive(true);
      setActiveSearchTerm(searchTerm.trim()); // Зберігаємо пошуковий запит
      try {
        const results = await searchProducts(
          searchTerm.trim(),
          selectedCategory !== 'all' ? { categoryId: selectedCategory } : undefined
        );
        console.log('Результати пошуку:', {
          searchTerm: searchTerm.trim(),
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          resultsCount: results.length,
          results: results.map(p => ({ id: p.id, name: p.name, sku: p.sku, brand: p.brand }))
        });
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
      refresh();
    }
  };

  // Скидання пошуку при зміні категорії
  useEffect(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setIsSearchActive(false);
    setSearchResults([]);
  }, [selectedCategory]);

  const getStatusLabel = (status: string) => {
    return PRODUCT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Каталог автозапчастин K24</span>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Знайдіть потрібні запчастини швидко
            </h1>
            <p className="text-zinc-400 max-w-2xl">
              Використайте пошук та каталоги, щоб миттєво знайти необхідні автозапчастини.
              Дані оновлюються з тією ж точністю, що й в адмін-панелі.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              <Package className="mr-2 h-3.5 w-3.5" />
              {products.length} товарів доступно
            </Badge>
            <Badge variant="outline" className="bg-zinc-800 text-zinc-200 border-zinc-700">
              <FolderTree className="mr-2 h-3.5 w-3.5" />
              {categories.length} каталоги
            </Badge>
          </div>
        </div>

        {/* Search & filters */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Пошук по назві, SKU або бренду..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="pl-9 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black px-5"
                onClick={handleSearch}
              >
                <Search className="mr-2 h-4 w-4" />
                Пошук
              </Button>
              <Button
                variant="outline"
                className="bg-zinc-950 border-zinc-800 text-zinc-200 hover:border-amber-500 hover:text-white"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                  setActiveSearchTerm('');
                  setIsSearchActive(false);
                  setSearchResults([]);
                  refresh();
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Скинути фільтри
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-lg border text-sm transition ${
                  selectedCategory === 'all'
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                Усі категорії
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition ${
                    selectedCategory === category.id
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {isSearchActive && activeSearchTerm && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-400 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Результати пошуку
                </p>
                <h2 className="text-xl font-semibold mt-1">
                  Знайдено за запитом &quot;{activeSearchTerm}&quot;
                </h2>
              </div>
              {searchLoading && (
                <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Пошук...
                </Badge>
              )}
            </div>

            {searchLoading && searchResults.length === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-64 bg-zinc-900/60" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((product) => {
                  const firstImage = product.images?.[0]?.url;
                  const statusClass = statusColors[product.status] || statusColors.discontinued;
                  return (
                    <Card key={product.id} className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col">
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
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
                            <p className="text-xs text-zinc-500">
                              Артикул: {product.partNumber || product.sku}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Бренд: {product.brand || '—'}
                            </p>
                          </div>
                          <span className="text-amber-400 font-semibold">
                            {product.price.toLocaleString()} ₴
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto">
                          <span>Переглядів: {product.views || 0}</span>
                          <span>
                            {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
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
                  <Button
                    variant="outline"
                    className="border-zinc-800 text-zinc-200 hover:border-amber-500 hover:text-white"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveSearchTerm('');
                      setIsSearchActive(false);
                      setSearchResults([]);
                      refresh();
                    }}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Скинути пошук
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Каталоги
              </p>
              <h2 className="text-xl font-semibold mt-1">Оберіть напрямок</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesLoading && Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-28 bg-zinc-900/60" />
            ))}
            {!categoriesLoading && categories.map((category) => (
              <Card
                key={category.id}
                className={`bg-zinc-900/60 border ${
                  selectedCategory === category.id ? 'border-amber-500/40' : 'border-zinc-800'
                } hover:border-amber-500/40 transition`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-amber-400" />
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 line-clamp-2">
                    {category.description || 'Категорія автозапчастин'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge variant="outline" className="border-zinc-800 text-zinc-300">
                    {category.productCount} товарів
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-amber-400 hover:text-white hover:bg-amber-500/10"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    Переглянути
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!categoriesLoading && categories.length === 0 && (
              <Card className="bg-zinc-900/60 border-zinc-800">
                <CardContent className="p-6 text-center text-zinc-400">
                  Каталоги ще не створені
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Products */}
        {!isSearchActive && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Товари
              </p>
              <h2 className="text-xl font-semibold mt-1">Наявні позиції</h2>
            </div>
            {loading && (
              <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Оновлюємо дані
              </Badge>
            )}
          </div>

          {loading && products.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-64 bg-zinc-900/60" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const firstImage = product.images?.[0]?.url;
                const statusClass = statusColors[product.status] || statusColors.discontinued;
                return (
                  <Card key={product.id} className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col">
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
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
                          <p className="text-xs text-zinc-500">
                            Артикул: {product.partNumber || product.sku}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Бренд: {product.brand || '—'}
                          </p>
                        </div>
                        <span className="text-amber-400 font-semibold">
                          {product.price.toLocaleString()} ₴
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 mt-auto">
                        <span>Переглядів: {product.views || 0}</span>
                        <span>
                          {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && products.length === 0 && (
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-white font-medium">Нічого не знайдено</p>
                <p className="text-zinc-500 text-sm">
                  Спробуйте змінити пошуковий запит або виберіть іншу категорію.
                </p>
                <Button
                  variant="outline"
                  className="border-zinc-800 text-zinc-200 hover:border-amber-500 hover:text-white"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearchTerm('');
                    setSelectedCategory('all');
                    setIsSearchActive(false);
                    setSearchResults([]);
                    refresh();
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Скинути пошук
                </Button>
              </CardContent>
            </Card>
          )}

          {hasMore && !loading && (
            <div className="flex justify-center">
              <Button
                onClick={loadMore}
                className="bg-amber-500 hover:bg-amber-600 text-black px-6"
              >
                Показати більше
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
