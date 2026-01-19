import { Metadata } from 'next';
import {
  getCategories,
} from '@/modules/categories/services/categories.service';
import { getProductById } from '@/modules/products/services/products.service';

// Не генеруємо статичні шляхи для всіх товарів - використовуємо ISR замість цього
// export async function generateStaticParams() {
//   // Видалено - використовуємо ISR для товарів замість SSG
// }

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24-shop.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const product = await getProductById(id);

    if (!product) {
      return {
        title: 'Товар не знайдено',
        description: 'Запитуваний товар не знайдено на сайті K24 Shop',
      };
    }

    const categories = await getCategories();
    const category = categories.find(c => c.id === product.categoryId);
    const categoryName = category?.name || 'Автозапчастини';

    const metaTitle = product.seo?.metaTitle || `${product.name} - ${categoryName} | K24 Shop Дніпро`;
    const metaDescription = product.seo?.metaDescription || 
      `${product.name} ${product.brand ? `(${product.brand})` : ''}. Артикул: ${product.partNumber || 'N/A'}. ` +
      `Ціна: ${product.price} грн. Доставка по Україні. Купити в K24 Shop Дніпро.`;

    const imageUrl = product.images?.[0]?.url || `${siteUrl}/logo.png`;
    const productUrl = `${siteUrl}/products/${product.id}`;

    return {
      title: metaTitle,
      description: metaDescription,
      keywords: [
        product.name,
        product.brand || '',
        product.partNumber || '',
        categoryName,
        ...(product.seo?.metaKeywords || []),
        'автозапчастини Дніпро',
        'K24 Shop',
        'купити запчастини',
      ].filter(Boolean),
      openGraph: {
        type: 'website',
        url: productUrl,
        title: product.seo?.ogTitle || metaTitle,
        description: product.seo?.ogDescription || metaDescription,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        siteName: 'K24 Shop',
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        images: [imageUrl],
      },
      alternates: {
        canonical: productUrl,
      },
      robots: {
        index: product.status !== 'discontinued',
        follow: true,
        googleBot: {
          index: product.status !== 'discontinued',
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Товар | K24 Shop',
      description: 'Автозапчастини в Дніпрі',
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
