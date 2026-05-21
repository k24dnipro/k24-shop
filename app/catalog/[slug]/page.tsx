import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogView } from '@/components/shop/catalog-view';
import { buildCategoryMetadata } from '@/lib/seo/category-metadata';
import { isCategoryPubliclyVisible } from '@/lib/shop/catalog-urls';
import { getCategoryBySlug } from '@/modules/categories/services/categories.service';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || !isCategoryPubliclyVisible(category)) {
    return {
      title: 'Категорія не знайдена',
      description: 'Запитувана категорія не знайдена на сайті K24 Parts',
    };
  }

  return buildCategoryMetadata(category);
}

export default async function CategoryCatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || !isCategoryPubliclyVisible(category)) {
    notFound();
  }

  return (
    <CatalogView categorySlug={slug} initialCategoryId={category.id} />
  );
}
