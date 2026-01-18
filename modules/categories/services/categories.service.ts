import {
  collection,
  getDocs,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  db,
  storage,
} from '@/firebase';
import { Category } from '@/lib/types';
import {
  batchUpdateCategoryCounts,
  countCategories,
  createCategoryDoc,
  deleteCategoryDoc,
  deleteCategoryImage,
  ensureCategoryExists,
  fetchCategories,
  fetchCategoryById,
  fetchCategoryBySlug,
  fetchRootCategories,
  fetchSubcategories,
  getCategoriesPath,
  updateCategoriesOrder,
  updateCategoryDoc,
} from '../gateways/categories.gateway';

// Default uncategorized category constants
export const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';
export const UNCATEGORIZED_CATEGORY_NAME = 'Без категорії';

// Ensure the "Без категорії" category exists in Firestore
export async function ensureUncategorizedCategoryExists(): Promise<void> {
  await ensureCategoryExists(UNCATEGORIZED_CATEGORY_ID, {
    name: UNCATEGORIZED_CATEGORY_NAME,
    slug: 'bez-kategorii',
    description: 'Товари без визначеної категорії',
    parentId: null,
    order: 9999, // Put at the end
    isActive: true,
    productCount: 0,
    seo: {
      metaTitle: UNCATEGORIZED_CATEGORY_NAME,
      metaDescription: 'Товари без визначеної категорії',
      metaKeywords: [],
    },
  });
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  return fetchCategories();
}

// Get root categories (no parent)
export async function getRootCategories(): Promise<Category[]> {
  return fetchRootCategories();
}

// Get subcategories by parent ID
export async function getSubcategories(parentId: string): Promise<Category[]> {
  return fetchSubcategories(parentId);
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  return fetchCategoryById(id);
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return fetchCategoryBySlug(slug);
}

// Create category
export async function createCategory(
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>
): Promise<string> {
  return createCategoryDoc(categoryData);
}

// Update category
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  return updateCategoryDoc(id, updates);
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
  const category = await getCategoryById(id);
  if (!category) return;

  // Delete category image from storage
  if (category.image) {
    await deleteCategoryImage(id);
  }

  // Get all subcategories and delete them
  const subcategories = await getSubcategories(id);
  for (const sub of subcategories) {
    await deleteCategory(sub.id);
  }

  await deleteCategoryDoc(id);
}

// Upload category image
export async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
  const imageId = uuidv4();
  const extension = file.name.split('.').pop();
  const path = `categories/${categoryId}/${imageId}.${extension}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// Reorder categories
export async function reorderCategories(categories: { id: string; order: number }[]): Promise<void> {
  return updateCategoriesOrder(categories);
}

// Get categories tree (hierarchical)
export async function getCategoriesTree(): Promise<(Category & { children: Category[] })[]> {
  // Recalculate product counts to ensure they're accurate
  await recalculateCategoryProductCounts();

  const categories = await getCategories();

  const rootCategories = categories.filter(c => c.parentId === null);

  return rootCategories.map(root => ({
    ...root,
    children: categories.filter(c => c.parentId === root.id),
  }));
}

// Get categories count
export async function getCategoriesCount(): Promise<number> {
  return countCategories();
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Recalculate product counts for all categories
export async function recalculateCategoryProductCounts(): Promise<void> {
  const categoriesSnapshot = await getDocs(collection(db, getCategoriesPath()));
  const productsSnapshot = await getDocs(collection(db, 'products'));

  // Count products per category
  const counts: Record<string, number> = {};
  productsSnapshot.docs.forEach((doc) => {
    const categoryId = doc.data().categoryId;
    if (categoryId) {
      counts[categoryId] = (counts[categoryId] || 0) + 1;
    }
  });

  // Update each category with the correct count
  // We need to pass counts for ALL categories, including those with 0 products if they exist in the snapshot but not in counts map.
  // Actually, the previous implementation iterated over categories and updated them.
  // Let's create a map for updates.
  
  const updates: Record<string, number> = {};
  categoriesSnapshot.docs.forEach((categoryDoc) => {
    updates[categoryDoc.id] = counts[categoryDoc.id] || 0;
  });

  await batchUpdateCategoryCounts(updates);
}
