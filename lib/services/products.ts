import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  startAfter,
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
import {
  CSVProductRow,
  ImportResult,
  Product,
  ProductImage,
  ProductSEO,
  ProductStatus,
} from '../types';

const PRODUCTS_COLLECTION = 'products';

// Convert Firestore document to Product
const convertToProduct = (doc: DocumentSnapshot): Product => {
  const data = doc.data();
  if (!data) throw new Error('Document not found');
  
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Product;
};

// Get all products with pagination
export async function getProducts(options?: {
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
}) {
  const { pageSize = 20, lastDoc, categoryId, status } = options || {};
  
  let q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (categoryId) {
    q = query(q, where('categoryId', '==', categoryId));
  }

  if (status) {
    q = query(q, where('status', '==', status));
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(convertToProduct);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];

  return { products, lastVisible, hasMore: snapshot.docs.length === pageSize };
}

// Search products
export async function searchProducts(searchTerm: string) {
  // Firestore doesn't support full-text search natively
  // For production, consider using Algolia or Elasticsearch
  // This is a simple implementation using SKU and name prefix
  const normalizedSearch = searchTerm.toLowerCase();
  
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const products = snapshot.docs
    .map(convertToProduct)
    .filter(
      (product) =>
        (product.name?.toLowerCase() || '').includes(normalizedSearch) ||
        (product.sku?.toLowerCase() || '').includes(normalizedSearch)
    );

  return products;
}

// Get single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return convertToProduct(docSnap);
}

// Get product by SKU
export async function getProductBySku(sku: string): Promise<Product | null> {
  const q = query(collection(db, PRODUCTS_COLLECTION), where('sku', '==', sku));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return convertToProduct(snapshot.docs[0]);
}

// Create new product
export async function createProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'inquiries'>
): Promise<string> {
  const now = Timestamp.now();
  
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    views: 0,
    inquiries: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Update category product count
  if (productData.categoryId) {
    const categoryRef = doc(db, 'categories', productData.categoryId);
    await updateDoc(categoryRef, {
      productCount: increment(1),
    });
  }

  return docRef.id;
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  const product = await getProductById(id);
  if (!product) return;

  // Delete images from storage
  for (const image of product.images) {
    try {
      const imageRef = ref(storage, `products/${id}/${image.id}`);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  // Update category product count
  if (product.categoryId) {
    const categoryRef = doc(db, 'categories', product.categoryId);
    await updateDoc(categoryRef, {
      productCount: increment(-1),
    });
  }

  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}

// Batch delete products
export async function deleteProducts(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  
  for (const id of ids) {
    batch.delete(doc(db, PRODUCTS_COLLECTION, id));
  }

  await batch.commit();
}

// Upload product image
export async function uploadProductImage(
  productId: string,
  file: File,
  order: number
): Promise<ProductImage> {
  const imageId = uuidv4();
  const extension = file.name.split('.').pop();
  const path = `products/${productId}/${imageId}.${extension}`;
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    id: imageId,
    url,
    alt: file.name,
    order,
  };
}

// Delete product image
export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  const storageRef = ref(storage, `products/${productId}/${imageId}`);
  await deleteObject(storageRef);
}

// Increment views
export async function incrementProductViews(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    views: increment(1),
  });
}

// Increment inquiries
export async function incrementProductInquiries(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    inquiries: increment(1),
  });
}

// Import products from CSV
export async function importProductsFromCSV(rows: CSVProductRow[], userId: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  const batch = writeBatch(db);
  let batchCount = 0;
  const maxBatchSize = 500;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Check if product exists by SKU
      const existingProduct = await getProductBySku(row.sku);
      
      const productData = {
        sku: row.sku,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price) || 0,
        originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
        categoryId: row.categoryId,
        subcategoryId: row.subcategoryId || undefined,
        status: (row.status as ProductStatus) || 'in_stock',
        brand: row.brand || '',
        partNumber: row.partNumber || '',
        oem: row.oem ? row.oem.split(',').map(s => s.trim()) : [],
        compatibility: row.compatibility ? row.compatibility.split(',').map(s => s.trim()) : [],
        condition: (row.condition as 'new' | 'used' | 'refurbished') || 'used',
        year: row.year,
        carBrand: row.carBrand,
        carModel: row.carModel,
        seo: {
          metaTitle: row.metaTitle || row.name,
          metaDescription: row.metaDescription || row.description?.substring(0, 160) || '',
          metaKeywords: row.metaKeywords ? row.metaKeywords.split(',').map(s => s.trim()) : [],
          ogTitle: row.metaTitle || row.name,
          ogDescription: row.metaDescription || row.description?.substring(0, 160) || '',
          ogImage: '',
          canonicalUrl: '',
          slug: row.slug || row.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        } as ProductSEO,
        images: [],
        createdBy: userId,
        updatedAt: Timestamp.now(),
      };

      if (existingProduct) {
        // Update existing product
        const docRef = doc(db, PRODUCTS_COLLECTION, existingProduct.id);
        batch.update(docRef, productData);
        result.updated++;
      } else {
        // Create new product
        const docRef = doc(collection(db, PRODUCTS_COLLECTION));
        batch.set(docRef, {
          ...productData,
          views: 0,
          inquiries: 0,
          createdAt: Timestamp.now(),
        });
        result.success++;
      }

      batchCount++;

      // Commit batch if it reaches max size
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        batchCount = 0;
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Commit remaining items
  if (batchCount > 0) {
    await batch.commit();
  }

  return result;
}

// Export products to CSV format
export async function exportProductsToCSV(): Promise<CSVProductRow[]> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  
  return snapshot.docs.map((doc) => {
    const product = convertToProduct(doc);
    return {
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString(),
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      status: product.status,
      brand: product.brand,
      partNumber: product.partNumber,
      oem: product.oem.join(','),
      compatibility: product.compatibility.join(','),
      condition: product.condition,
      year: product.year,
      carBrand: product.carBrand,
      carModel: product.carModel,
      metaTitle: product.seo.metaTitle,
      metaDescription: product.seo.metaDescription,
      metaKeywords: product.seo.metaKeywords.join(','),
      slug: product.seo.slug,
    };
  });
}

// Get products count
export async function getProductsCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.size;
}

// Get products by status count
export async function getProductsByStatusCount(): Promise<Record<ProductStatus, number>> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  
  const counts: Record<ProductStatus, number> = {
    in_stock: 0,
    on_order: 0,
    out_of_stock: 0,
    discontinued: 0,
  };

  snapshot.docs.forEach((doc) => {
    const status = doc.data().status as ProductStatus;
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  });

  return counts;
}

