"use client";

import { ShopHeader } from '@/components/shop/header';
import { ShopFooter } from '@/components/shop/footer';
import { Truck, CreditCard, RotateCcw } from 'lucide-react';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Доставка та оплата</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <Truck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Доставка</h2>
            <div className="space-y-2 text-zinc-400">
              <p>Ми здійснюємо доставку по всій Україні службою "Нова Пошта".</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Відправка в день замовлення (при замовленні до 16:00)</li>
                <li>Безкоштовна доставка для замовлень від 3000 грн</li>
                <li>Можливість самовивозу в Києві</li>
              </ul>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <CreditCard className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Оплата</h2>
            <div className="space-y-2 text-zinc-400">
              <p>Обирайте зручний для вас спосіб оплати:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Готівкою при отриманні (накладений платіж)</li>
                <li>Онлайн оплата картою (Visa/Mastercard)</li>
                <li>Безготівковий розрахунок для юридичних осіб</li>
                <li>Оплата частинами від Monobank</li>
              </ul>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Повернення</h2>
            <div className="space-y-2 text-zinc-400">
              <p>Ви можете повернути товар протягом 14 днів відповідно до закону.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Товар не був у використанні</li>
                <li>Збережена упаковка та товарний вигляд</li>
                <li>Наявність чеку або накладної</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
