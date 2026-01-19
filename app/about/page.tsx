"use client";

import { ShopHeader } from '@/components/shop/header';
import { ShopFooter } from '@/components/shop/footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8 text-zinc-300">
        <h1 className="text-3xl font-bold text-white mb-6">Про нас</h1>
        <div className="prose prose-invert max-w-none space-y-4">
          <p>
            Інтернет-магазин K24 Shop - це ваш надійний партнер у пошуку та придбанні автозапчастин для будь-яких автомобілів.
            Ми працюємо на ринку автозапчастин вже більше 10 років і за цей час здобули довіру тисяч клієнтів.
          </p>
          <p>
            Наша місія - забезпечити власників автомобілів якісними запчастинами за доступними цінами.
            Ми пропонуємо як оригінальні запчастини, так і сертифіковані аналоги від провідних виробників.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">Наші переваги:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Широкий асортимент товарів в наявності</li>
            <li>Професійна консультація та допомога у підборі</li>
            <li>Швидка відправка замовлень</li>
            <li>Гарантія на всі товари</li>
            <li>Власна розбірка та склад запчастин</li>
          </ul>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
