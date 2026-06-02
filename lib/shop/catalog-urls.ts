import { Category } from '@/lib/types';

export const CATALOG_BASE_PATH = '/catalog';

/** Treat missing `isActive` as active (legacy Firestore docs). */
export function isCategoryPubliclyVisible(
  category: Pick<Category, 'id' | 'isActive'>
): boolean {
  return category.isActive !== false;
}

export function getCategoryCatalogPath(category: Pick<Category, 'slug'>): string {
  return `${CATALOG_BASE_PATH}/${category.slug}`;
}

export function getCatalogPathForCategoryId(
  categoryId: string,
  categories: Pick<Category, 'id' | 'slug'>[]
): string {
  if (categoryId === 'all') {
    return CATALOG_BASE_PATH;
  }
  const category = categories.find((c) => c.id === categoryId);
  return category?.slug ? getCategoryCatalogPath(category) : CATALOG_BASE_PATH;
}

/** Extract category slug from `/catalog/[slug]` pathname. */
export function getCategorySlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/catalog\/([^/?#]+)$/);
  return match?.[1] ?? null;
}
