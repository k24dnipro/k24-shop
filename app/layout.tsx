import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { FloatingCart } from '@/components/shop/floating-cart';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24-shop.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "K24 Shop - Автозапчастини в Дніпрі | Магазин запчастин",
    template: "%s | K24 Shop"
  },
  description: "Купити автозапчастини в Дніпрі. Широкий асортимент оригінальних запчастин та якісних аналогів для будь-яких марок автомобілів. Швидка доставка по Україні. K24 Shop - ваш надійний партнер в автозапчастях.",
  keywords: [
    "автозапчастини",
    "запчастини Дніпро",
    "автозапчастини Дніпро",
    "автозапчастини Україна",
    "запчастини для авто",
    "автомобільні запчастини",
    "оригінальні запчастини",
    "аналогові запчастини",
    "розбірка",
    "K24 Shop",
    "автозапчастини Дніпропетровськ"
  ],
  authors: [{ name: "K24 Shop" }],
  creator: "K24 Shop",
  publisher: "K24 Shop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: siteUrl,
    siteName: "K24 Shop",
    title: "K24 Shop - Автозапчастини в Дніпрі | Магазин запчастин",
    description: "Купити автозапчастини в Дніпрі. Широкий асортимент оригінальних запчастин та якісних аналогів для будь-яких марок автомобілів.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "K24 Shop - Автозапчастини в Дніпрі",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "K24 Shop - Автозапчастини в Дніпрі",
    description: "Купити автозапчастини в Дніпрі. Широкий асортимент оригінальних запчастин та якісних аналогів.",
    images: [`${siteUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here when available
    // google: "your-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Automotive Parts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <FloatingCart />
        </Providers>
      </body>
    </html>
  );
}
