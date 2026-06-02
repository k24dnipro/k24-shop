import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export const metadata: Metadata = {
  title: {
    absolute: 'Каталог автозапчастин – Запчастини для всіх авто | K24 Parts',
  },
  description: 'Каталог автозапчастин K24 Parts: великий вибір деталей для всіх марок авто. Зручний пошук, оригінальні запчастини та аналоги. Замовляйте з доставкою по Україні.',
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
    title: 'Каталог автозапчастин – Запчастини для всіх авто | K24 Parts',
    description: 'Каталог автозапчастин K24 Parts: великий вибір деталей для всіх марок авто. Зручний пошук, оригінальні запчастини та аналоги. Замовляйте з доставкою по Україні.',
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
