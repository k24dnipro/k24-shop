import { Metadata } from 'next';
import { Category } from '@/lib/types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export function buildCategoryMetadata(category: Category): Metadata {
  const metaTitle =
    category.seo?.metaTitle?.trim() ||
    `${category.name} | K24 Parts`;
  const metaDescription =
    category.seo?.metaDescription?.trim() ||
    `Купити запчастини ${category.name} у Дніпрі та з доставкою по Україні. K24 Parts.`;
  const keywords = category.seo?.metaKeywords?.filter(Boolean) ?? [];
  const categoryUrl = `${siteUrl}/catalog/${category.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      type: 'website',
      url: categoryUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: 'K24 Parts',
    },
    twitter: {
      card: 'summary',
      title: metaTitle,
      description: metaDescription,
    },
    alternates: {
      canonical: categoryUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

