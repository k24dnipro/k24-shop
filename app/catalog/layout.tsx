import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24-shop.com';

export const metadata: Metadata = {
  title: 'Каталог автозапчастин | K24 Shop Дніпро',
  description: 'Широкий асортимент автозапчастин для всіх марок автомобілів. Оригінальні запчастини та якісні аналоги. Швидка доставка по Україні. K24 Shop Дніпро.',
  keywords: [
    'каталог автозапчастин',
    'автозапчастини Дніпро',
    'запчастини для авто',
    'автозапчастини Україна',
    'K24 Shop',
  ],
  openGraph: {
    type: 'website',
    url: `${siteUrl}/catalog`,
    title: 'Каталог автозапчастин | K24 Shop Дніпро',
    description: 'Широкий асортимент автозапчастин для всіх марок автомобілів',
    siteName: 'K24 Shop',
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
