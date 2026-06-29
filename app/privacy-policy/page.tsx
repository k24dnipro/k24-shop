import { Metadata } from 'next';
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { SITE_PHONE_PRIMARY_TEL } from '@/lib/constants/contact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Політика конфіденційності | K24 Parts',
  },
  description:
    'Політика конфіденційності інтернет-магазину K24 Parts. Які дані збираємо, як використовуємо та які права мають користувачі.',
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/privacy-policy`,
    title: 'Політика конфіденційності | K24 Parts',
    description:
      'Політика конфіденційності інтернет-магазину K24 Parts. Які дані збираємо, як використовуємо та які права мають користувачі.',
    siteName: 'K24 Parts',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10 text-zinc-400">
          <h1 className="text-3xl font-bold text-white mb-2">Політика конфіденційності</h1>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <p>
              Інтернет-магазин K24 Parts поважає право кожного користувача на конфіденційність та
              захист персональних даних. Ця Політика конфіденційності пояснює, які дані ми збираємо,
              як їх використовуємо та які права мають користувачі сайту.
            </p>
            <p>
              Користуючись сайтом, ви погоджуєтесь з умовами цієї Політики конфіденційності.
            </p>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">1. Які дані ми збираємо</h2>
              <p>Під час оформлення замовлення або звернення до нас ми можемо отримувати такі дані:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>ім&apos;я та прізвище;</li>
                <li>номер телефону;</li>
                <li>адресу електронної пошти;</li>
                <li>адресу доставки;</li>
                <li>інформацію про замовлення;</li>
                <li>інші дані, які користувач добровільно надає через форми на сайті.</li>
              </ul>
              <p>Також сайт може автоматично збирати технічну інформацію:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP-адресу;</li>
                <li>тип браузера та пристрою;</li>
                <li>інформацію про відвідування сторінок;</li>
                <li>файли Cookie.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">2. Мета обробки персональних даних</h2>
              <p>Отримані дані використовуються для:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>оформлення та виконання замовлень;</li>
                <li>зв&apos;язку з клієнтами;</li>
                <li>надання консультацій;</li>
                <li>покращення роботи сайту та якості обслуговування;</li>
                <li>виконання вимог законодавства України.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">3. Передача даних третім особам</h2>
              <p>
                Ми не продаємо та не передаємо персональні дані третім особам, за винятком випадків,
                коли це необхідно для виконання замовлення або передбачено законодавством.
              </p>
              <p>Зокрема, дані можуть передаватися:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>службам доставки;</li>
                <li>платіжним сервісам;</li>
                <li>державним органам у випадках, передбачених законом.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">4. Захист персональних даних</h2>
              <p>
                Ми вживаємо необхідних організаційних та технічних заходів для захисту персональних
                даних від несанкціонованого доступу, втрати, зміни або поширення.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">5. Використання Cookie</h2>
              <p>Сайт може використовувати файли Cookie для:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>коректної роботи сайту;</li>
                <li>збереження налаштувань користувача;</li>
                <li>аналізу відвідуваності;</li>
                <li>покращення користувацького досвіду.</li>
              </ul>
              <p>
                Користувач може самостійно обмежити або відключити використання Cookie у
                налаштуваннях свого браузера.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">6. Права користувача</h2>
              <p>Користувач має право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>отримати інформацію про свої персональні дані;</li>
                <li>вимагати виправлення неточних даних;</li>
                <li>
                  вимагати видалення своїх персональних даних у випадках, передбачених
                  законодавством;
                </li>
                <li>відкликати згоду на обробку персональних даних.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">7. Посилання на сторонні ресурси</h2>
              <p>
                Сайт може містити посилання на сторонні веб-сайти. Ми не несемо відповідальності за
                зміст та політику конфіденційності таких ресурсів.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">8. Зміни до Політики конфіденційності</h2>
              <p>
                Ми залишаємо за собою право вносити зміни до цієї Політики конфіденційності.
                Актуальна редакція завжди доступна на цій сторінці.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">9. Контактна інформація</h2>
              <p>
                Якщо у вас виникли питання щодо обробки персональних даних або цієї Політики
                конфіденційності, ви можете звернутися до нас:
              </p>
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
            </section>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
