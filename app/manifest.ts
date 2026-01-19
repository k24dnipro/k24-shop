import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24-shop.com';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'K24 Shop - Автозапчастини в Дніпрі',
    short_name: 'K24 Shop',
    description: 'Автозапчастини в Дніпрі. Широкий асортимент оригінальних запчастин та якісних аналогів.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#fbbf24',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['automotive', 'shopping'],
    lang: 'uk',
    dir: 'ltr',
  };
}
