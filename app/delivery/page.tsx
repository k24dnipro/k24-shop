import { Metadata } from 'next';
import Link from 'next/link';
import {
  ClipboardList,
  CreditCard,
  RotateCcw,
  Truck,
} from "lucide-react";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SITE_PHONE_PRIMARY_TEL } from '@/lib/constants/contact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Доставка та оплата | K24 Parts',
  },
  description:
    'Доставка автозапчастин по Україні: Нова Пошта, Delivery, самовивіз. Способи оплати, обробка замовлень та умови повернення. K24 Parts.',
  alternates: {
    canonical: `${siteUrl}/delivery`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/delivery`,
    title: 'Доставка та оплата | K24 Parts',
    description:
      'Доставка автозапчастин по Україні: Нова Пошта, Delivery, самовивіз. Способи оплати, обробка замовлень та умови повернення. K24 Parts.',
    siteName: 'K24 Parts',
  },
};

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8 mb-12">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">Доставка та оплата</h1>
            <p className="text-zinc-400 text-[15px] leading-relaxed">
              Ми прагнемо зробити процес замовлення автозапчастин максимально простим та зручним
              для кожного клієнта.
            </p>
          </div>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <Truck className="h-6 w-6" />
            </div>
            <div className="space-y-4 text-zinc-400 min-w-0">
              <h2 className="text-xl font-bold text-white">Способи доставки</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-semibold text-zinc-200">Нова Пошта</h3>
                  <p>
                    Доставка здійснюється у відділення, поштомати або кур&apos;єром Нової Пошти по
                    всій території України відповідно до тарифів перевізника.
                  </p>
                  <p className="mt-1">
                    Термін доставки зазвичай становить від 1 до 3 робочих днів залежно від регіону.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-200">Delivery</h3>
                  <p>
                    Відправлення транспортною компанією Delivery можливе за попереднім
                    погодженням з менеджером.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-200">Самовивіз</h3>
                  <p>
                    Ви можете самостійно забрати замовлення з нашого складу після підтвердження
                    готовності товару менеджером.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-white">Вартість доставки</h2>
            <div className="space-y-3 text-zinc-400 text-sm">
              <p>
                Вартість доставки розраховується згідно з тарифами обраної транспортної компанії та
                оплачується покупцем.
              </p>
              <p className="border-l-4 border-k24-yellow pl-4 py-2 bg-zinc-950/50 rounded-r-lg text-zinc-300">
                Для замовлень, що відправляються транспортними компаніями, може знадобитися
                передоплата у розмірі 10% від суми замовлення. Розмір передоплати уточнюється
                менеджером під час підтвердження замовлення.
              </p>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="space-y-3 text-zinc-400 text-sm min-w-0">
              <h2 className="text-xl font-bold text-white">Способи оплати</h2>
              <p>Ми пропонуємо кілька зручних способів оплати:</p>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-zinc-200">Накладений платіж</h3>
                  <p>Оплата замовлення при отриманні у відділенні транспортної компанії.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200">Оплата за банківськими реквізитами</h3>
                  <p>
                    Після підтвердження замовлення менеджер надає реквізити для оплати.
                    Відправлення товару здійснюється після зарахування коштів.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="space-y-3 text-zinc-400 text-sm min-w-0">
              <h2 className="text-xl font-bold text-white">Обробка замовлення</h2>
              <p>Після оформлення замовлення:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Наш менеджер зв&apos;яжеться з вами для підтвердження замовлення.</li>
                <li>Уточнить наявність товару та терміни доставки.</li>
                <li>Допоможе обрати найбільш зручний спосіб доставки та оплати.</li>
                <li>За потреби надасть реквізити для оплати.</li>
                <li>
                  Після відправлення повідомить номер транспортної накладної для відстеження
                  посилки.
                </li>
              </ol>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="space-y-3 text-zinc-400 text-sm min-w-0">
              <h2 className="text-xl font-bold text-white">Гарантія та повернення</h2>
              <p>
                Повернення товару здійснюється відповідно до вимог Закону України «Про захист прав
                споживачів».
              </p>
              <p>
                Покупець має право повернути товар протягом 14 календарних днів з моменту
                отримання за умови, що:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>товар не був у використанні;</li>
                <li>збережено товарний вигляд, споживчі властивості та комплектність;</li>
                <li>збережено заводську упаковку;</li>
                <li>наявний документ, що підтверджує покупку.</li>
              </ul>
              <p>
                Повернення коштів здійснюється після перевірки товару та погодження повернення.
              </p>
              <p>
                Для оформлення повернення або обміну товару зверніться до наших менеджерів за
                контактними даними, зазначеними на сайті. Детальні умови — на сторінці{' '}
                <Link href="/return-policy" className="text-k24-yellow hover:underline">
                  Повернення та обмін
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-3">
            <h2 className="text-xl font-bold text-white">Контакти</h2>
            <div className="text-zinc-400 text-sm space-y-2">
              <p>
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
            </div>
          </section>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
