import { Metadata } from 'next';
import { Category } from '@/lib/types';
import { CATEGORY_SEO_DATA } from './category-content';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://k24.parts';

export function buildCategoryMetadata(category: Category): Metadata {
  const customSeo = CATEGORY_SEO_DATA[category.slug];

  const metaTitle =
    customSeo?.title ||
    category.seo?.metaTitle?.trim() ||
    `${category.name} | K24 Parts`;
  const metaDescription =
    customSeo?.description ||
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

