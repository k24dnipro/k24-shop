import { MetadataRoute } from 'next';
import {
  getProductsForSitemap,
} from '@/modules/products/services/products.service';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

// ISR для sitemap: ревалідація кожні 24 годи
export const revalidate = 86400;

// Додатковий вбудований кеш на рівні процесу
let sitemapCache: { routes: MetadataRoute.Sitemap; fetchedAt: number } | null = null;
const SITEMAP_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 годи

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = Date.now();
  if (sitemapCache && now - sitemapCache.fetchedAt < SITEMAP_CACHE_TTL_MS) {
    return sitemapCache.routes;
  }

  const generatedAt = new Date();

  // Основні статичні сторінки
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/catalog`,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: generatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contacts`,
      lastModified: generatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/delivery`,
      lastModified: generatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // Додаємо сторінки товарів (виключаємо discontinued)
    const products = await getProductsForSitemap();
    products
      .filter((p) => p.status !== 'discontinued')
      .forEach((product) => {
        routes.push({
          url: `${siteUrl}/products/${product.id}`,
          // Не використовуємо generatedAt як fallback — Google не повинен думати що кожен товар змінювався щодня
          lastModified: product.updatedAt ?? new Date('2025-01-01'),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });

    sitemapCache = {
      routes,
      fetchedAt: now,
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
