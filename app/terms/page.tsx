import { Metadata } from 'next';
import Link from 'next/link';
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SITE_PHONE_PRIMARY_TEL } from '@/lib/constants/contact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Умови використання сайту | K24 Parts',
  },
  description:
    'Умови використання сайту K24 Parts. Правила оформлення замовлень, оплати, доставки та повернення товарів.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/terms`,
    title: 'Умови використання сайту | K24 Parts',
    description:
      'Умови використання сайту K24 Parts. Правила оформлення замовлень, оплати, доставки та повернення товарів.',
    siteName: 'K24 Parts',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10 text-zinc-400">
          <h1 className="text-3xl font-bold text-white mb-2">Умови використання сайту</h1>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <p>
              Ласкаво просимо на сайт K24 Parts. Користуючись сайтом, ви погоджуєтесь із цими
              Умовами використання. Якщо ви не погоджуєтесь з будь-яким положенням цих умов,
              будь ласка, припиніть використання сайту.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">1. Загальні положення</h2>
              <p>
                Сайт K24 Parts створений для надання інформації про товари, оформлення замовлень та
                взаємодії з клієнтами.
              </p>
              <p>
                Використання сайту означає згоду користувача з даними Умовами використання та{' '}
                <Link href="/privacy-policy" className="text-k24-yellow hover:underline">
                  Політикою конфіденційності
                </Link>
                .
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">2. Інформація про товари</h2>
              <p>
                Ми докладаємо всіх зусиль для забезпечення актуальності та достовірності інформації
                про товари, однак не гарантуємо відсутність технічних помилок, неточностей або
                друкарських помилок.
              </p>
              <p>
                Фотографії товарів можуть незначно відрізнятися від фактичного вигляду товару.
              </p>
              <p>
                У разі виявлення помилок у характеристиках, описі або вартості товару ми залишаємо
                за собою право уточнити інформацію до підтвердження замовлення.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">3. Оформлення замовлення</h2>
              <p>
                Замовлення вважається прийнятим до обробки після підтвердження менеджером.
              </p>
              <p>Менеджер може зв&apos;язатися з покупцем для уточнення інформації щодо:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>наявності товару;</li>
                <li>сумісності запчастини;</li>
                <li>способу доставки;</li>
                <li>способу оплати;</li>
                <li>інших деталей замовлення.</li>
              </ul>
              <p>
                Ми залишаємо за собою право відмовити в обробці замовлення у випадках виявлення
                помилкових даних або неможливості виконання замовлення.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">4. Ціни та оплата</h2>
              <p>Усі ціни на сайті вказуються в гривнях.</p>
              <p>
                Ми залишаємо за собою право змінювати ціни без попереднього повідомлення. При цьому
                для підтвердженого замовлення діє ціна, погоджена з покупцем під час оформлення
                замовлення.
              </p>
              <p>
                Доступні способи оплати зазначені на сторінці{' '}
                <Link href="/delivery" className="text-k24-yellow hover:underline">
                  Доставка та оплата
                </Link>
                .
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">5. Доставка</h2>
              <p>
                Умови доставки, строки та способи отримання товару визначаються на сторінці{' '}
                <Link href="/delivery" className="text-k24-yellow hover:underline">
                  Доставка та оплата
                </Link>
                .
              </p>
              <p>
                Терміни доставки можуть залежати від наявності товару, місця доставки та роботи
                транспортних компаній.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">6. Повернення та обмін</h2>
              <p>
                Повернення та обмін товарів здійснюються відповідно до чинного законодавства України
                та правил, зазначених на сторінці{' '}
                <Link href="/return-policy" className="text-k24-yellow hover:underline">
                  Повернення та обмін
                </Link>
                .
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">7. Інтелектуальна власність</h2>
              <p>
                Усі матеріали, розміщені на сайті, включаючи тексти, логотипи, фотографії, графічні
                елементи та інший контент, є власністю K24 Parts або використовуються на законних
                підставах.
              </p>
              <p>
                Забороняється копіювання, поширення або використання матеріалів сайту без
                попереднього письмового дозволу власника.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">8. Обмеження відповідальності</h2>
              <p>Ми не несемо відповідальності за:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>тимчасову недоступність сайту;</li>
                <li>технічні збої в роботі мережі Інтернет;</li>
                <li>дії третіх осіб;</li>
                <li>
                  збитки, що виникли внаслідок неправильного використання товарів або інформації,
                  розміщеної на сайті.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">9. Персональні дані</h2>
              <p>
                Обробка персональних даних здійснюється відповідно до{' '}
                <Link href="/privacy-policy" className="text-k24-yellow hover:underline">
                  Політики конфіденційності
                </Link>
                , розміщеної на сайті.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">10. Зміна умов використання</h2>
              <p>
                Ми залишаємо за собою право змінювати або оновлювати ці Умови використання без
                попереднього повідомлення користувачів.
              </p>
              <p>Актуальна редакція завжди доступна на цій сторінці.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">11. Контактна інформація</h2>
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
                З усіх питань щодо роботи сайту або оформлення замовлень ви можете звернутися до
                наших менеджерів за вказаними контактами.
              </p>
            </section>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
