import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: 'Каталог автозапчастин | K24 Parts Дніпро',
  description: 'Широкий асортимент автозапчастин для всіх марок автомобілів. Оригінальні запчастини та якісні аналоги. Швидка доставка по Україні. K24 Parts Дніпро.',
  keywords: [
    'каталог автозапчастин',
    'автозапчастини Дніпро',
    'запчастини для авто',
    'автозапчастини Україна',
    'K24 Parts',
    'k24.parts',
  ],
  openGraph: {
    type: 'website',
    url: `${siteUrl}/catalog`,
    title: 'Каталог автозапчастин | K24 Parts Дніпро',
    description: 'Широкий асортимент автозапчастин для всіх марок автомобілів',
    siteName: 'K24 Parts',
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
