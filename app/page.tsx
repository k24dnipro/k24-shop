"use client";

import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/lib/hooks/useCart';
import { generateOrganizationStructuredData } from '@/lib/seo/utils';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import { useProducts } from '@/modules/products/hooks/use-products';
import { Product } from '@/modules/products/types';

const statusColors: Record<string, string> = {
  in_stock: 'text-emerald-400',
  on_order: 'text-blue-400',
  out_of_stock: 'text-red-400',
  discontinued: 'text-zinc-400',
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

  // Use a constant to avoid hydration mismatch
  const siteUrl = 'https://k24-shop.com';
  const organizationData = generateOrganizationStructuredData(siteUrl);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      
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
                Більше 4 років досвіду. Оригінальні запчастини та якісні аналоги для вашого авто.
              </p>

              {/* Main Search */}
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-linear-to-r from-k24-yellow to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                  <div className="relative flex">
                    <Input
                      type="text"
                      placeholder="Назва, бренд, артикул або OEM..."
                      className="h-14 pl-12 pr-4 bg-zinc-950 border-none text-lg shadow-xl focus-visible:ring-k24-yellow transition-all placeholder:text-sm"
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

            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {productsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[300px] bg-zinc-900 rounded-xl" />
                ))
              ) : (
                newProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="group h-full">
                    <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden flex flex-col hover:border-k24-yellow/40 transition-colors cursor-pointer h-full pt-0 pb-0">
                      <div className="relative aspect-4/3 bg-zinc-950 shrink-0">
                        {product.images?.[0]?.url ? (
                          <ProductImage
                            src={product.images[0].url}
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
                            className={`text-[12px] sm:text-xs ${statusColors[product.status] || statusColors.discontinued}`}
                          >
                            {product.status === 'in_stock'
                              ? 'В наявності'
                              : product.status === 'on_order'
                                ? 'Під замовлення'
                                : product.status === 'out_of_stock'
                                  ? 'Немає в наявності'
                                  : 'Знято з виробництва'}
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
