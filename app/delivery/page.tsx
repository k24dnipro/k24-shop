"use client";

import {
  ClipboardList,
  CreditCard,
  RotateCcw,
  Truck,
} from "lucide-react";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8 mb-12">
          <h1 className="text-3xl font-bold text-white">
            Доставка та оплата
          </h1>
          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <Truck className="h-6 w-6" />
            </div>
            <div className="space-y-3 text-zinc-400 min-w-0">
              <h2 className="text-xl font-bold text-white">Доставка</h2>
              <p>Ми пропонуємо зручні способи отримання замовлення:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <span className="text-zinc-300">Нова Пошта</span> —
                  основний та найшвидший спосіб доставки по Україні
                </li>
                <li>
                  <span className="text-zinc-300">Delivery</span> — можливе
                  відправлення за попереднім узгодженням
                </li>
                <li>
                  <span className="text-zinc-300">Самовивіз</span> — ви можете
                  самостійно забрати замовлення з нашого складу
                </li>
              </ul>
              <p className="border-l-4 border-k24-yellow pl-4 py-2 bg-zinc-950/50 rounded-r-lg text-sm text-zinc-300">
                📦 Зверніть увагу: відправка товарів транспортними компаніями
                здійснюється за передоплатою у розмірі 10% від суми замовлення
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
              <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Оплата</h2>
              <div className="space-y-2 text-zinc-400 text-sm">
                <p>Доступні наступні способи оплати:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Накладений платіж (оплата при отриманні у відділенні
                    перевізника)
                  </li>
                  <li>Оплата за банківськими реквізитами</li>
                </ul>
              </div>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
              <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Обробка замовлення
              </h2>
              <div className="space-y-2 text-zinc-400 text-sm">
                <p>Після оформлення замовлення:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>з вами зв’яжеться наш менеджер для уточнення деталей</li>
                  <li>погодить зручний спосіб доставки</li>
                  <li>надасть рахунок для оплати</li>
                </ul>
              </div>
            </section>
          </div>

          <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
            <div className="w-12 h-12 shrink-0 bg-k24-yellow/10 rounded-lg flex items-center justify-center text-k24-yellow">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div className="space-y-2 text-zinc-400 text-sm min-w-0">
              <h2 className="text-xl font-bold text-white">Повернення</h2>
              <p>
                Ви можете повернути товар протягом 14 днів відповідно до
                закону.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Товар не був у використанні</li>
                <li>Збережена упаковка та товарний вигляд</li>
                <li>Наявність чеку або накладної</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
