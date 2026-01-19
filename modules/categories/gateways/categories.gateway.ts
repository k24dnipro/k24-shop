import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  ref,
} from 'firebase/storage';
import {
  db,
  storage,
} from '@/firebase';
import {
  Category,
} from '@/lib/types'; // Using lib/types for now as they are re-exported

const CATEGORIES_COLLECTION = 'categories';

export const getCategoriesPath = () => CATEGORIES_COLLECTION;
export const getCategoryPath = (categoryId: string) => `${getCategoriesPath()}/${categoryId}`;

// Gateways
export const fetchCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, getCategoriesPath()), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  } as Category));
};

export const fetchRootCategories = async (): Promise<Category[]> => {
  const q = query(
    collection(db, getCategoriesPath()),
    where('parentId', '==', null),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  } as Category));
};

export const fetchSubcategories = async (parentId: string): Promise<Category[]> => {
  const q = query(
    collection(db, getCategoriesPath()),
    where('parentId', '==', parentId),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  } as Category));
};

export const fetchCategoryById = async (id: string): Promise<Category | null> => {
  const docRef = doc(db, getCategoryPath(id));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Category;
};

export const fetchCategoryBySlug = async (slug: string): Promise<Category | null> => {
  const q = query(collection(db, getCategoriesPath()), where('slug', '==', slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Category;
};

export const createCategoryDoc = async (
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>
): Promise<string> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, getCategoriesPath()), {
    ...categoryData,
    productCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateCategoryDoc = async (id: string, updates: Partial<Category>): Promise<void> => {
  const docRef = doc(db, getCategoryPath(id));
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCategoryDoc = async (id: string): Promise<void> => {
  const docRef = doc(db, getCategoryPath(id));
  await deleteDoc(docRef);
};

export const deleteCategoryImage = async (id: string): Promise<void> => {
  try {
    const imageRef = ref(storage, `categories/${id}`);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting category image:', error);
  }
};

export const updateCategoriesOrder = async (categories: { id: string; order: number }[]): Promise<void> => {
  const batch = writeBatch(db);
  for (const { id, order } of categories) {
    const docRef = doc(db, getCategoryPath(id));
    batch.update(docRef, { order, updatedAt: Timestamp.now() });
  }
  await batch.commit();
};

export const countCategories = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, getCategoriesPath()));
  return snapshot.size;
};

export const ensureCategoryExists = async (id: string, data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  const docRef = doc(db, getCategoryPath(id));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    const now = Timestamp.now();
    await setDoc(docRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }
};

export const batchUpdateCategoryCounts = async (counts: Record<string, number>): Promise<void> => {
  const batch = writeBatch(db);
  Object.keys(counts).forEach((categoryId) => {
    batch.update(doc(db, getCategoryPath(categoryId)), {
      productCount: counts[categoryId],
    });
  });
  await batch.commit();
};

// Fetch categories with real-time calculated product counts (without writing to DB)
export const fetchCategoriesWithCounts = async (): Promise<Category[]> => {
  // Fetch categories and products in parallel
  const [categoriesSnapshot, productsSnapshot] = await Promise.all([
    getDocs(query(collection(db, getCategoriesPath()), orderBy('order', 'asc'))),
    getDocs(collection(db, 'products')),
  ]);

  // Count products per category (use subcategoryId if available, otherwise categoryId)
  const counts: Record<string, number> = {};
  productsSnapshot.docs.forEach((productDoc) => {
    const data = productDoc.data();
    const effectiveCategoryId = data.subcategoryId || data.categoryId;
    if (effectiveCategoryId) {
      counts[effectiveCategoryId] = (counts[effectiveCategoryId] || 0) + 1;
    }
  });

  // Map categories with calculated counts
  return categoriesSnapshot.docs.map(catDoc => ({
    id: catDoc.id,
    ...catDoc.data(),
    productCount: counts[catDoc.id] || 0, // Override with calculated count
    createdAt: catDoc.data().createdAt?.toDate() || new Date(),
    updatedAt: catDoc.data().updatedAt?.toDate() || new Date(),
  } as Category));
};
