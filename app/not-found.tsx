import { Metadata } from 'next';
import Link from 'next/link';
import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';
import { AlertCircle, ArrowLeft, Home, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Сторінку не знайдено (404) — K24 Parts',
  description: 'Помилка 404. Запитувану сторінку на сайті магазину автозапчастин K24 Parts не знайдено. Перейдіть до каталогу товарів або на головну.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <ShopHeader />
      
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full text-center space-y-8 animate-fade-in">
          {/* Visual Alert Badge / Icon */}
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-zinc-900 border border-zinc-800 text-k24-yellow shadow-[0_0_15px_rgba(254,206,3,0.1)]">
              <AlertCircle className="h-12 w-12" />
            </div>
          </div>

          {/* Error Code & Main Headings */}
          <div className="space-y-3">
            <p className="text-k24-yellow font-mono text-sm tracking-widest uppercase">Помилка 404</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Сторінку не знайдено
            </h1>
            <h2 className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
              На жаль, сторінка, яку ви шукаєте, не існує, була видалена або перенесена на іншу адресу.
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-k24-yellow hover:bg-[#e0b602] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-k24-yellow/10"
            >
              <Search className="h-5 w-5" />
              <span>Перейти до каталогу</span>
            </Link>
            
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
            >
              <Home className="h-5 w-5" />
              <span>На головну</span>
            </Link>
          </div>

          {/* Additional Help Links */}
          <div className="border-t border-zinc-900 pt-8 mt-8">
            <p className="text-zinc-500 text-sm">
              Потрібна допомога з пошуком автозапчастин?{' '}
              <Link href="/contacts" className="text-k24-yellow hover:underline transition-colors">
                Зв&apos;яжіться з нами
              </Link>
            </p>
          </div>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
