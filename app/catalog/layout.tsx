import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24-shop.com';

export const metadata: Metadata = {
  title: 'Каталог автозапчастин | K24 Shop Дніпро',
  description: 'Повний каталог автозапчастин в Дніпрі. Оригінальні запчастини та якісні аналоги для будь-яких марок автомобілів. Швидка доставка по Україні.',
  keywords: [
    'каталог автозапчастин',
    'автозапчастини каталог',
    'запчастини Дніпро каталог',
    'автозапчастини Україна',
    'каталог запчастин',
  ],
  openGraph: {
    title: 'Каталог автозапчастин | K24 Shop Дніпро',
    description: 'Повний каталог автозапчастин в Дніпрі. Оригінальні запчастини та якісні аналоги.',
    url: `${siteUrl}/catalog`,
    type: 'website',
  },
  alternates: {
    canonical: `${siteUrl}/catalog`,
  },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
