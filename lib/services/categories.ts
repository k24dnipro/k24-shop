import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import {
  db,
  storage,
} from '@/firebase';
import { Category } from '../types';

const CATEGORIES_COLLECTION = 'categories';

// Default uncategorized category constants
export const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';
export const UNCATEGORIZED_CATEGORY_NAME = 'Без категорії';

// Ensure the "Без категорії" category exists in Firestore
export async function ensureUncategorizedCategoryExists(): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, UNCATEGORIZED_CATEGORY_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    const now = Timestamp.now();
    await setDoc(docRef, {
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
      createdAt: now,
      updatedAt: now,
    });
  }
}

// Convert Firestore document to Category
const convertToCategory = (doc: DocumentSnapshot): Category => {
  const data = doc.data();
  if (!data) throw new Error('Document not found');
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Category;
};

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToCategory);
}

// Get root categories (no parent)
export async function getRootCategories(): Promise<Category[]> {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    where('parentId', '==', null),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToCategory);
}

// Get subcategories by parent ID
export async function getSubcategories(parentId: string): Promise<Category[]> {
  const q = query(
    collection(db, CATEGORIES_COLLECTION),
    where('parentId', '==', parentId),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToCategory);
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return convertToCategory(docSnap);
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const q = query(collection(db, CATEGORIES_COLLECTION), where('slug', '==', slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  return convertToCategory(snapshot.docs[0]);
}

// Create category
export async function createCategory(
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>
): Promise<string> {
  const now = Timestamp.now();

  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
    ...categoryData,
    productCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

// Update category
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Delete category
export async function deleteCategory(id: string): Promise<void> {
  const category = await getCategoryById(id);
  if (!category) return;

  // Delete category image from storage
  if (category.image) {
    try {
      const imageRef = ref(storage, `categories/${id}`);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting category image:', error);
    }
  }

  // Get all subcategories and delete them
  const subcategories = await getSubcategories(id);
  for (const sub of subcategories) {
    await deleteCategory(sub.id);
  }

  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
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
  const batch = writeBatch(db);

  for (const { id, order } of categories) {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    batch.update(docRef, { order, updatedAt: Timestamp.now() });
  }

  await batch.commit();
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
  const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
  return snapshot.size;
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
  const categoriesSnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
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
  const batch = writeBatch(db);
  categoriesSnapshot.docs.forEach((categoryDoc) => {
    const count = counts[categoryDoc.id] || 0;
    batch.update(doc(db, CATEGORIES_COLLECTION, categoryDoc.id), {
      productCount: count,
    });
  });

  await batch.commit();
}

