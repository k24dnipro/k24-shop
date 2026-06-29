import { Metadata } from 'next';
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SITE_PHONE_PRIMARY_TEL } from '@/lib/constants/contact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Про компанію K24 Parts – Магазин автозапчастин у Дніпрі',
  },
  description:
    'K24 Parts — інтернет-магазин автозапчастин у Дніпрі. Оригінальні, аналогові та б/в запчастини, підбір за VIN-кодом, доставка по Україні.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/about`,
    title: 'Про компанію K24 Parts – Магазин автозапчастин у Дніпрі',
    description:
      'K24 Parts — інтернет-магазин автозапчастин у Дніпрі. Оригінальні, аналогові та б/в запчастини, підбір за VIN-кодом, доставка по Україні.',
    siteName: 'K24 Parts',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10 text-zinc-400">
          <h1 className="text-3xl font-bold text-white mb-2">Про компанію</h1>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Про компанію K24 Parts</h2>
              <p>
                K24 Parts — інтернет-магазин автозапчастин у Дніпрі, який спеціалізується на
                продажу нових, оригінальних, аналогових та перевірених б/в запчастин для легкових
                автомобілів.
              </p>
              <p>
                Ми працюємо з автовласниками, автосервісами та СТО по всій Україні, допомагаючи
                швидко знаходити необхідні деталі за VIN-кодом, каталожним номером або моделлю
                автомобіля.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Наша місія</h2>
              <p>
                Надавати клієнтам якісні автозапчастини за доступними цінами та забезпечувати
                професійну допомогу у підборі деталей для ремонту й обслуговування автомобілів.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Що ми пропонуємо</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Оригінальні автозапчастини від виробників.</li>
                <li>Якісні аналоги від перевірених постачальників.</li>
                <li>Перевірені б/в автозапчастини.</li>
                <li>Підбір деталей за VIN-кодом.</li>
                <li>Консультації щодо сумісності та встановлення.</li>
                <li>Доставку по всій території України.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Чому обирають K24 Parts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Великий вибір автозапчастин у наявності та під замовлення.</li>
                <li>Швидка обробка замовлень.</li>
                <li>Контроль якості перед відправленням.</li>
                <li>Професійна допомога у підборі деталей.</li>
                <li>Вигідні ціни без зайвих націнок.</li>
                <li>Надійна доставка по Україні.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Гарантія якості</h2>
              <p>
                Ми прагнемо надавати клієнтам достовірну інформацію про товари та забезпечувати
                якісний сервіс. Перед відправленням кожна деталь проходить перевірку відповідності
                замовленню.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Доставка та повернення</h2>
              <p>
                Інформація про способи доставки, оплати, гарантійні умови та порядок повернення
                товарів доступна на відповідних сторінках сайту. Ми працюємо відповідно до чинного
                законодавства України щодо захисту прав споживачів.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Контактна інформація</h2>
              <p className="font-semibold text-white">K24 Parts</p>
              <p>
                Адреса: Дніпропетровська область, м. Підгородне, 52001
                <br />
                Телефон:{' '}
                <a href={SITE_PHONE_PRIMARY_TEL} className="text-k24-yellow hover:underline">
                  +38 (093) 959-05-05
                </a>
              </p>
              <p>
                Графік роботи:
                <br />
                Пн–Пт: 09:00–18:00
                <br />
                Сб–Нд: вихідний
              </p>
              <p>
                Якщо вам потрібна допомога у підборі автозапчастин, зв&apos;яжіться з нами
                будь-яким зручним способом. Ми завжди готові допомогти знайти оптимальне рішення
                для вашого автомобіля.
              </p>
            </section>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
