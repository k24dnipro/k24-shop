"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/lib/hooks/useCart';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import { useProducts } from '@/modules/products/hooks/use-products';
import { Product } from '@/modules/products/types';

const statusColors: Record<string, string> = {
  in_stock: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  on_order: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  out_of_stock: 'bg-red-500/10 text-red-400 border-red-500/20',
  discontinued: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { categories, loading: categoriesLoading } = useCategories();
  const { products: newProducts, loading: productsLoading } = useProducts({
    pageSize: 4,
    sortBy: 'date_desc'
  });
  const { addItem } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleHeaderSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.status === 'discontinued' || product.status === 'on_order') {
      toast.error('Цей товар недоступний для додавання до кошика.');
      return;
    }

    addItem(product);
    toast.success('Товар додано до корзини!', {
      description: product.name,
    });
  };

  // Filter root categories for the main grid
  const rootCategories = categories.filter(c => !c.parentId).slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader onSearch={handleHeaderSearch} />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-zinc-900 border-b border-zinc-800">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-k24-yellow opacity-20 blur-[100px]"></div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                Знайдіть потрібні запчастини <br />
                <span className="text-k24-yellow">швидко та надійно</span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Більше 10 років досвіду. Оригінальні запчастини та якісні аналоги для вашого авто.
              </p>

              {/* Main Search */}
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-linear-to-r from-k24-yellow to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                  <div className="relative flex">
                    <Input
                      type="text"
                      placeholder="Введіть назву запчастини, артикул або бренд..."
                      className="h-14 pl-12 pr-4 bg-zinc-950 border-zinc-800 text-lg shadow-xl focus-visible:ring-k24-yellow transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-500" />
                    <Button
                      type="submit"
                      className="absolute right-2 top-2 bottom-2 bg-k24-yellow hover:bg-k24-yellow text-black font-semibold px-6"
                    >
                      Знайти
                    </Button>
                  </div>
                </div>
              </form>

              {/* Quick Tags */}
              <div className="flex flex-wrap justify-center gap-2 text-sm text-zinc-500">
                <span>Часто шукають:</span>
                <Link href="/catalog?q=Фільтр" className="text-zinc-400 hover:text-k24-yellow underline decoration-dotted">Фільтри</Link>
                <Link href="/catalog?q=Заглушка" className="text-zinc-400 hover:text-k24-yellow underline decoration-dotted">Заглушки</Link>
                <Link href="/catalog?q=Колодки" className="text-zinc-400 hover:text-k24-yellow underline decoration-dotted">Гальмівні колодки</Link>
              </div>
            </div>
          </div>
        </div>


        {/* Features Section */}
        <section className="py-12 bg-zinc-900/50 border-y border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="p-3 rounded-lg bg-k24-yellow/10 text-k24-yellow">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Швидка доставка</h3>
                  <p className="text-sm text-zinc-400">Відправка в день замовлення по всій Україні</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="p-3 rounded-lg bg-k24-yellow/10 text-k24-yellow">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Гарантія якості</h3>
                  <p className="text-sm text-zinc-400">Тільки перевірені виробники та оригінальні запчастини</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="p-3 rounded-lg bg-k24-yellow/10 text-k24-yellow">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Професійний підбір</h3>
                  <p className="text-sm text-zinc-400">Допоможемо підібрати деталь саме для вашого авто</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Категорії товарів</h2>
              <Link href="/catalog" className="text-k24-yellow hover:text-k24-yellow flex items-center gap-1 text-sm font-medium">
                Дивитись всі
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoriesLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-zinc-900 rounded-xl" />
                ))
              ) : (
                rootCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/catalog?category=${category.id}`}
                    className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-k24-yellow/50 transition-all duration-300"
                  >
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center gap-3">
                      <span className="text-lg font-medium text-zinc-200 group-hover:text-k24-yellow transition-colors">
                        {category.name}
                      </span>
                      <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full">
                        {category.productCount} товарів
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-linear-to-br from-k24-yellow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>


        {/* New Arrivals Section */}
        <section className="py-16 bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Нові надходження</h2>
              <Link href="/catalog?sort=date_desc" className="text-k24-yellow hover:text-k24-yellow flex items-center gap-1 text-sm font-medium">
                Дивитись всі новинки
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[300px] bg-zinc-900 rounded-xl" />
                ))
              ) : (
                newProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="group h-full">
                    <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col hover:border-k24-yellow/40 transition-colors cursor-pointer h-full">
                      <div className="relative aspect-4/3 bg-zinc-950">
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
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
                          <Badge variant="outline" className={statusColors[product.status] || statusColors.discontinued}>
                            {product.status === 'in_stock' ? 'В наявності' :
                              product.status === 'on_order' ? 'Під замовлення' :
                                product.status === 'out_of_stock' ? 'Немає в наявності' : 'Знято з виробництва'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <h3 className="text-base font-semibold leading-tight text-white">{product.name}</h3>
                            <div className="flex gap-4">
                              <div className="flex gap-1 text-xs">
                                <span className="text-zinc-600">Артикул:</span>
                                <span className="text-zinc-400 font-mono">
                                  {product.partNumber || '—'}
                                </span>
                              </div>
                              <div className="flex gap-1 text-xs">
                                <span className="text-zinc-600">Виробник:</span>
                                <span className="text-zinc-400">
                                  {product.brand || '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-k24-yellow font-semibold block">
                              {product.price.toLocaleString()} ₴
                            </span>
                            {product.originalPrice && (
                              <span className="text-xs text-zinc-500 line-through">
                                {product.originalPrice.toLocaleString()} ₴
                              </span>
                            )}
                          </div>
                        </div>
                        {product.status === 'in_stock' && (
                          <Button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-medium text-sm h-9"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            В корзину
                          </Button>
                        )}
                        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                          <span>{product.views || 0} переглядів</span>
                          <span>
                            {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* About Section Snippet */}
        <section className="py-16 bg-zinc-900 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold text-white">Про магазин K24 Shop</h2>
              <p className="text-zinc-400 leading-relaxed">
                Наш магазин спеціалізується на продажу автозапчастин для будь-яких марок автомобілів.
                Ми пропонуємо широкий асортимент оригінальних деталей та якісних аналогів.
                Завдяки власному складу в Дніпрі та налагодженій логістиці, ми забезпечуємо швидку доставку
                замовлень по всій Україні. Наші фахівці завжди готові надати професійну консультацію
                та допомогти з вибором необхідних запчастин.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-k24-yellow" asChild>
                  <Link href="/about">Дізнатись більше</Link>
                </Button>
                <Button className="bg-k24-yellow hover:bg-k24-yellow text-black font-semibold" asChild>
                  <Link href="/contacts">Зв&apos;язатись з нами</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ShopFooter />
    </div>
  );
}
