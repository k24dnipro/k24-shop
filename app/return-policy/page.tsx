import { Metadata } from 'next';
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SITE_PHONE_PRIMARY_TEL } from '@/lib/constants/contact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Повернення та обмін | K24 Parts',
  },
  description:
    'Умови повернення та обміну автозапчастин у K24 Parts. Порядок оформлення, повернення коштів та контакти для звернень.',
  alternates: {
    canonical: `${siteUrl}/return-policy`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/return-policy`,
    title: 'Повернення та обмін | K24 Parts',
    description:
      'Умови повернення та обміну автозапчастин у K24 Parts. Порядок оформлення, повернення коштів та контакти для звернень.',
    siteName: 'K24 Parts',
  },
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10 text-zinc-400">
          <h1 className="text-3xl font-bold text-white mb-2">Повернення та обмін</h1>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <p>
              Ми дбаємо про якість товарів та сервісу. Якщо придбаний товар вам не підійшов або
              був отриманий з дефектом, ви можете оформити повернення або обмін відповідно до
              чинного законодавства України.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Умови повернення товару</h2>
              <p>
                Відповідно до Закону України «Про захист прав споживачів», покупець має право
                повернути товар протягом 14 календарних днів з моменту отримання.
              </p>
              <p>Повернення можливе за умови, що:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>товар не був у використанні;</li>
                <li>збережено товарний вигляд та споживчі властивості;</li>
                <li>збережено повну комплектацію;</li>
                <li>збережено заводську упаковку;</li>
                <li>наявний документ, що підтверджує покупку.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Обмін товару</h2>
              <p>
                Якщо отриманий товар не підійшов або необхідно замінити його на інший, зверніться
                до наших менеджерів для узгодження процедури обміну.
              </p>
              <p>
                Обмін можливий за наявності необхідного товару на складі та за умови дотримання
                правил повернення.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Товари неналежної якості</h2>
              <p>
                Якщо ви отримали товар із заводським дефектом або пошкодженням, повідомте нас
                якомога швидше після отримання замовлення.
              </p>
              <p>У такому випадку ми проведемо перевірку та запропонуємо один із варіантів вирішення:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>заміну товару;</li>
                <li>повернення коштів;</li>
                <li>інший спосіб вирішення за погодженням сторін.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Порядок оформлення повернення</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  Зв&apos;яжіться з нашим менеджером за телефоном або через форму зворотного
                  зв&apos;язку.
                </li>
                <li>Повідомте номер замовлення та причину повернення.</li>
                <li>Після погодження відправте товар за вказаними реквізитами.</li>
                <li>
                  Після отримання та перевірки товару буде прийнято рішення щодо повернення коштів
                  або обміну.
                </li>
              </ol>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Повернення коштів</h2>
              <p>
                Повернення коштів здійснюється після перевірки товару та підтвердження дотримання
                умов повернення.
              </p>
              <p>
                Термін повернення коштів залежить від способу оплати та зазвичай становить до 7
                робочих днів з моменту прийняття рішення про повернення.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Витрати на доставку</h2>
              <p>
                У разі повернення товару належної якості витрати на доставку несе покупець.
              </p>
              <p>
                Якщо повернення пов&apos;язане з помилкою комплектації, дефектом товару або іншою
                помилкою з нашого боку, витрати на доставку компенсуються продавцем.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Контакти для оформлення повернення</h2>
              <p>
                Телефон:{' '}
                <a href={SITE_PHONE_PRIMARY_TEL} className="text-k24-yellow hover:underline">
                  +38 (093) 959-05-05
                </a>
              </p>
              <p>Адреса: Дніпропетровська область, м. Підгородне, 52001</p>
              <p>
                Графік роботи:
                <br />
                Пн–Пт: 09:00–18:00
                <br />
                Сб–Нд: вихідний
              </p>
              <p>
                Якщо у вас виникли питання щодо повернення або обміну товару, звертайтеся до наших
                менеджерів. Ми завжди готові допомогти знайти оптимальне рішення.
              </p>
            </section>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
