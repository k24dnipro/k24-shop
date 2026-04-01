"use client";

import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-10 text-zinc-400">
          <h1 className="text-3xl font-bold text-white mb-2">Про нас</h1>

          <div className="space-y-4 text-[15px] leading-relaxed">
            <p>
              Ми спеціалізуємось на продажі автозапчастин у Дніпрі та по всій
              Україні. У нас ви можете купити автозапчастини Дніпро або замовити
              доставку в будь-яке місто України швидко, вигідно та з гарантією.
            </p>

            <h2 className="text-xl font-bold text-white pt-2">
              У нашому асортименті:
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                б/в автозапчастини, перевірені та готові до встановлення
              </li>
              <li>оригінальні автозапчастини від виробників</li>
              <li>
                якісні аналоги з оптимальним співвідношенням ціна/якість
              </li>
            </ul>

            <p>
              Якщо вам потрібно купити запчастини на авто в Дніпрі або Україні,
              ми допоможемо підібрати найкращий варіант під ваш бюджет і
              технічні потреби.
            </p>

            <h2 className="text-xl font-bold text-white pt-2">
              Чому обирають нас:
            </h2>
            <ul className="space-y-2 list-none pl-0">
              <li className="flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ✅
                </span>
                <span>Великий вибір автозапчастин у Дніпрі в наявності</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ✅
                </span>
                <span>Підбір запчастин за VIN-кодом</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ✅
                </span>
                <span>Оригінал, аналоги або перевірені б/в деталі</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ✅
                </span>
                <span>Контроль якості перед відправкою</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ✅
                </span>
                <span>Вигідні ціни без переплат</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0" aria-hidden>
                  ✅
                </span>
                <span>Швидка доставка по Україні</span>
              </li>
            </ul>

            <h2 className="text-xl font-bold text-white pt-4">
              Для кого ми працюємо
            </h2>
            <p>
              Ми співпрацюємо як з автовласниками, так і з СТО, яким важливо
              швидко купити автозапчастини в Дніпрі або з доставкою по Україні
              без ризиків і зайвих витрат.
            </p>

            <h2 className="text-xl font-bold text-white pt-2">Наша мета</h2>
            <p>
              Допомогти вам легко і швидко купити якісні автозапчастини в Дніпрі
              та Україні — від оригіналу до надійного аналога — з професійним
              підбором і сервісом.
            </p>
          </div>
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}
