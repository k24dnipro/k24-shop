import { MetadataRoute } from 'next';
import {
  getCategories,
} from '@/modules/categories/services/categories.service';
import {
  getProductsForSitemap,
} from '@/modules/products/services/products.service';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

// ISR для sitemap
// Довший revalidate + додатковий кеш нижче => менше шансів на повторні важкі reads
export const revalidate = 86800; // 24 години

// Додатковий вбудований кеш на рівні процесу (на випадок, якщо ISR не встигає/не кешує як очікується).
let sitemapCache: { routes: MetadataRoute.Sitemap; fetchedAt: number } | null = null;
const SITEMAP_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 23 години

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = Date.now();
  if (sitemapCache && now - sitemapCache.fetchedAt < SITEMAP_CACHE_TTL_MS) {
    return sitemapCache.routes;
  }

  const generatedAt = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
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
    // Add category pages (тільки активні категорії)
    const categories = await getCategories();
    categories
      .filter(cat => cat.isActive)
      .forEach((category) => {
        routes.push({
          url: `${siteUrl}/catalog?category=${category.id}`,
          lastModified: generatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });

    // Додаємо всі товари (всі статуси включно з discontinued)
    const products = await getProductsForSitemap();
    products.forEach((product) => {
      routes.push({
        url: `${siteUrl}/products/${product.id}`,
        lastModified: product.updatedAt || generatedAt,
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
