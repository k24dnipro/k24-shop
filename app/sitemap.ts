import { MetadataRoute } from 'next';
import {
  getCategories,
} from '@/modules/categories/services/categories.service';
import { getProducts } from '@/modules/products/services/products.service';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24-shop.com';

// ISR для sitemap - ревалідація кожні 12 годин
export const revalidate = 43200; // 12 годин = 43200 секунд

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contacts`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/delivery`,
      lastModified: new Date(),
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
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      });

    // Додаємо всі товари (всі статуси включно з discontinued)
    // ⚠️ ОБМЕЖЕННЯ: pageSize: 5000 - максимум 5k товарів в sitemap
    // Google рекомендує до 50k URL в одному sitemap, але для продуктивності обмежуємо до 5k
    // Якщо товарів більше 5k - потрібно буде розбити на кілька sitemap файлів або збільшити pageSize
    const { products } = await getProducts({
      pageSize: 10000, // ⚠️ ТУТ ОБМЕЖЕННЯ: максимум 5k товарів в sitemap
      status: undefined, // Всі статуси (включно з discontinued)
    });

    // Додаємо всі товари без фільтрації по статусу
    products.forEach((product) => {
      routes.push({
        url: `${siteUrl}/products/${product.id}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
