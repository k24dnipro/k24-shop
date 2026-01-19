import {
  Instagram,
  MapPin,
  Music2,
  Phone,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function ShopFooter() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="K24 Dnipro"
                width={140}
                height={48}
                className="h-12 w-auto rounded-md"
                priority
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">K24 Shop</span>
                <span className="text-xs text-zinc-500">Автозапчастини</span>
              </div>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Ваш надійний партнер у світі автозапчастин. Широкий асортимент,
              швидка доставка та професійна консультація.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/k24.dnipro"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-zinc-400 hover:text-k24-yellow text-2xl transition-colors"
              >
                <Instagram />
              </a>

              <a
                href="https://www.tiktok.com/@k24.dnipro"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-zinc-400 hover:text-k24-yellow text-2xl transition-colors"
              >
                <Music2 />
              </a>
            </div>
          </div>

          {/* Catalog Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Каталог</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Запчастини для іномарок
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Запчастини для вантажівок
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Універсальні товари
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Рідини та масла
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Аксесуари
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Info */}
          <div>
            <h3 className="text-white font-semibold mb-6">Клієнтам</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Про нас
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Доставка та оплата
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                  Контакти
                </Link>
              </li>

            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-6">Контакти</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-k24-yellow shrink-0 mt-0.5" />
                <span className="text-zinc-400 text-sm">
                  м. Дніпро, вул. Нижньодніпровська
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-k24-yellow shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+380987774401" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                    +38 (098) 777-44-01
                  </a>
                  <a href="tel:+380979590505" className="text-zinc-400 hover:text-k24-yellow text-sm transition-colors">
                    +38 (097) 959-05-05
                  </a>
                </div>
              </li>

            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} K24 Shop. Всі права захищені.
          </p>
        </div>
      </div>
    </footer>
  );
}
