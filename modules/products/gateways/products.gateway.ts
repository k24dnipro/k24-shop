import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  Product,
  ProductStatus,
} from '../types';

const PRODUCTS_COLLECTION = "products";

// Paths
export const getProductsPath = () => PRODUCTS_COLLECTION;
export const getProductPath = (productId: string) => `${getProductsPath()}/${productId}`;

// Gateways
export const fetchProducts = async (options?: {
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
  categoryId?: string;
  status?: ProductStatus;
  sortBy?: 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}) => {
  const { pageSize = 20, lastDoc, categoryId, status, sortBy = 'date_desc' } = options || {};

  let sortField = 'createdAt';
  let sortDirection: 'asc' | 'desc' = 'desc';

  switch (sortBy) {
    case 'price_asc': sortField = 'price'; sortDirection = 'asc'; break;
    case 'price_desc': sortField = 'price'; sortDirection = 'desc'; break;
    case 'date_asc': sortField = 'createdAt'; sortDirection = 'asc'; break;
    case 'date_desc': sortField = 'createdAt'; sortDirection = 'desc'; break;
    case 'name_asc': sortField = 'name'; sortDirection = 'asc'; break;
    case 'name_desc': sortField = 'name'; sortDirection = 'desc'; break;
  }

  let q = query(collection(db, getProductsPath()));

  if (categoryId) q = query(q, where("categoryId", "==", categoryId));
  if (status) q = query(q, where("status", "==", status));

  q = query(q, orderBy(sortField, sortDirection));

  if (lastDoc) q = query(q, startAfter(lastDoc));
  
  q = query(q, limit(pageSize));

  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  } as Product));

  const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
  const hasMore = snapshot.docs.length === pageSize;

  return { products, lastVisible, hasMore };
};

export const fetchProductById = async (productId: string): Promise<Product | null> => {
  const docRef = doc(db, getProductPath(productId));
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate() || new Date(),
    updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
  } as Product;
};

export const createProductDoc = async (productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "views" | "inquiries">): Promise<string> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, getProductsPath()), {
    ...productData,
    views: 0,
    inquiries: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateProductDoc = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const docRef = doc(db, getProductPath(productId));
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteProductDoc = async (productId: string): Promise<void> => {
  const docRef = doc(db, getProductPath(productId));
  await deleteDoc(docRef);
};

export const deleteProductsDocs = async (ids: string[]): Promise<void> => {
  const batch = writeBatch(db);
  ids.forEach(id => {
    batch.delete(doc(db, getProductPath(id)));
  });
  await batch.commit();
};
