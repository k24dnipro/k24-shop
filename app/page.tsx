import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';
import { UsdToUahPrice } from '@/components/shop/usd-to-uah-price';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProductImage } from '@/components/ui/product-image';
import { hasDisplayableUsdPrice } from '@/lib/currency/format';
import { generateOrganizationStructuredData } from '@/lib/seo/utils';
import { getCategories } from '@/modules/categories/services/categories.service';
import { getProducts } from '@/modules/products/services/products.service';
import { Metadata } from 'next';
import { HomeAddToCart } from '@/components/shop/home-add-to-cart';

export const metadata: Metadata = {
  title: {
    absolute: 'K24 Parts – Автозапчастини в Дніпрі | Купити запчастини для авто',
  },
  description: 'Купити автозапчастини в Дніпрі та по Україні. Оригінальні запчастини та якісні аналоги для всіх марок авто. Швидка доставка. K24 Parts – надійний магазин автозапчастин.',
};

const statusColors: Record<string, string> = {
  in_stock: 'text-emerald-400',
  on_order: 'text-blue-400',
  out_of_stock: 'text-red-400',
  discontinued: 'text-zinc-400',
};

export default async function Home() {
  const categories = await getCategories();
  const { products: newProducts } = await getProducts({
    pageSize: 4,
    sortBy: 'date_desc',
    isVisibleOnly: true,
  });

  // Filter root categories for the main grid
  const rootCategories = categories
    .filter((c) => !c.parentId && c.isActive !== false)
    .slice(0, 8);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';
  const organizationData = generateOrganizationStructuredData(siteUrl);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Prevent script-tag injection even if values come from env/DB
          __html: JSON.stringify(organizationData).replace(/</g, '\\u003c'),
        }}
      />

      <ShopHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative border-b border-zinc-800 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0" aria-hidden>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/bg-main.jpg')" }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-zinc-950/90 via-zinc-950/82 to-zinc-950/92" />
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

              {/* Main Search - pure HTML form with action='/catalog' for instant, JavaScript-free execution */}
              <form action="/catalog" method="GET" className="relative max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute bg-linear-to-r from-k24-yellow to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                  <div className="relative flex">
                    <Input
                      id="hero-search"
                      name="q"
                      type="search"
                      placeholder="Назва, бренд, код, OEM, марка або модель авто..."
                      autoComplete="off"
                      className="h-14 pl-12 pr-28 rounded-lg border-none text-lg shadow-xl focus-visible:ring-k24-yellow transition-all placeholder:text-sm bg-k24-yellow/50 backdrop-blur-md text-white placeholder:text-white/90"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white/90 pointer-events-none" />
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
              {rootCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalog/${category.slug}`}
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
              ))}
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
              {newProducts.map((product) => (
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
                                <span className="text-zinc-500">Код деталі:</span>{' '}
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
                              <UsdToUahPrice usd={product.price} />
                            </span>
                            {hasDisplayableUsdPrice(product.originalPrice) && (
                              <span className="text-[13px] sm:text-sm text-zinc-500 line-through block">
                                <UsdToUahPrice usd={product.originalPrice!} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {product.status === 'in_stock' && (
                        <HomeAddToCart product={product} />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-zinc-900/40 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto space-y-12">

              {/* Introduction Card */}
              <div className="relative rounded-2xl bg-zinc-900/70 border border-zinc-800 p-8 md:p-10 overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-k24-yellow/10 text-k24-yellow text-xs font-semibold uppercase tracking-wider">
                    Про компанію
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    K24 Parts — Ваш надійний магазин автозапчастин
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-zinc-400 text-sm md:text-[15px] leading-relaxed">
                    <p>
                      K24 Parts — це інтернет-магазин автозапчастин, який спеціалізується на постачанні комплектуючих для легкових автомобілів різних марок і моделей. Ми працюємо для того, щоб кожен автовласник міг швидко знайти потрібні деталі для ремонту, обслуговування або відновлення свого автомобіля.
                    </p>
                    <p>
                      Наша мета — зробити підбір автозапчастин максимально простим, точним і зручним. Ми пропонуємо як оригінальні деталі, так і перевірені аналоги від надійних виробників, що дозволяє підібрати оптимальне рішення під будь-який бюджет і технічні вимоги.
                    </p>
                    <p>
                      Завдяки власному складу в Дніпрі ми підтримуємо широкий асортимент товарів у наявності. Це дозволяє оперативно комплектувати замовлення та відправляти їх у найкоротші терміни. Налагоджена логістика забезпечує швидку доставку по всій Україні, включаючи великі міста та невеликі населені пункти.
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Column Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Column 1: Wide Selection */}
                <div className="flex flex-col justify-between p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300">
                  <div className="space-y-6">
                    <div className="p-3 w-fit rounded-lg bg-k24-yellow/10 text-k24-yellow">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Широкий вибір автозапчастин для будь-яких потреб
                    </h3>
                    <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                      <p>
                        У каталозі K24 Parts представлені автозапчастини для різних систем автомобіля: підвіски, гальмівної системи, двигуна, кузова, охолодження та електроніки. Ми постійно оновлюємо асортимент, щоб відповідати потребам сучасного ринку та запитам клієнтів.
                      </p>
                      <p>
                        Кожна деталь проходить перевірку якості та підбирається з урахуванням надійності та сумісності. Це дозволяє зменшити ризик помилок під час встановлення та забезпечити стабільну роботу автомобіля після ремонту.
                      </p>
                    </div>

                    {/* List Items */}
                    <ul className="space-y-2.5 pt-2">
                      {[
                        "оригінальні автозапчастини;",
                        "якісні аналоги від перевірених брендів;",
                        "наявність товарів на складі;",
                        "широкий асортимент для різних марок авто;",
                        "швидке оновлення каталогу."
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-sm text-zinc-300">
                          <CheckCircle2 className="h-4 w-4 text-k24-yellow shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-zinc-800/60 mt-6 text-xs text-zinc-500 italic">
                    Ми розуміємо, що правильний вибір автозапчастин напряму впливає на безпеку та комфорт водіння. Саме тому в нашому каталозі зібрані лише перевірені рішення, які відповідають сучасним вимогам якості.
                  </div>
                </div>

                {/* Column 2: Support & Delivery */}
                <div className="flex flex-col justify-between p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300">
                  <div className="space-y-6">
                    <div className="p-3 w-fit rounded-lg bg-k24-yellow/10 text-k24-yellow">
                      <Truck className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Професійна підтримка та швидка доставка по Україні
                    </h3>
                    <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                      <p>
                        Команда K24 Parts складається з фахівців, які мають практичний досвід у сфері автозапчастин. Ми допомагаємо клієнтам з підбором деталей, консультуємо щодо сумісності та надаємо рекомендації щодо оптимальних рішень.
                      </p>
                      <p>
                        Наша підтримка дозволяє швидко знайти потрібну деталь навіть у складних випадках, коли потрібна точна ідентифікація за параметрами або VIN-кодом. Це економить час і зменшує ризик помилкового замовлення.
                      </p>
                    </div>

                    {/* List Items */}
                    <ul className="space-y-2.5 pt-2">
                      {[
                        "професійна консультація спеціалістів;",
                        "допомога у підборі запчастин;",
                        "оперативне оформлення замовлень;",
                        "швидка доставка по Україні;",
                        "зручні умови співпраці."
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-sm text-zinc-300">
                          <CheckCircle2 className="h-4 w-4 text-k24-yellow shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-zinc-800/60 mt-6 text-xs text-zinc-500 italic">
                    Ми прагнемо зробити покупку автозапчастин простою та доступною для кожного клієнта. Завдяки поєднанню великого асортименту, швидкої логістики та професійної підтримки K24 Parts є надійним партнером для автовласників по всій Україні.
                  </div>
                </div>

              </div>

              {/* Banner/Footer within About Section */}
              <div className="relative rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <p className="text-k24-yellow font-bold text-lg md:text-xl">
                    K24 Parts — це якість, швидкість і впевненість у кожній деталі.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Обирайте найкращі запчастини для свого авто вже сьогодні
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button variant="outline" className="border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-k24-yellow" asChild>
                    <Link href="/about">Дізнатись більше</Link>
                  </Button>
                  <Button className="bg-k24-yellow hover:bg-k24-yellow/95 text-black font-semibold transition-all" asChild>
                    <Link href="/contacts">Зв&apos;язатись з нами</Link>
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <ShopFooter />
    </div>
  );
}
