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
  or,
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
  recalculateCategoryProductCounts,
} from '@/modules/categories/services/categories.service';
import {
  CSVProductRow,
  ImportResult,
  Product,
  ProductImage,
  ProductSEO,
  ProductStatus,
} from '../types';

const PRODUCTS_COLLECTION = "products";

// Convert Firestore document to Product
const convertToProduct = (doc: DocumentSnapshot): Product => {
  const data = doc.data();
  if (!data) throw new Error("Document not found");

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
  sortBy?: 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}) {
  const { pageSize = 20, lastDoc, categoryId, status, sortBy = 'date_desc' } = options || {};

  // Determine sort field and direction
  let sortField: string;
  let sortDirection: 'asc' | 'desc';

  switch (sortBy) {
    case 'price_asc':
      sortField = 'price';
      sortDirection = 'asc';
      break;
    case 'price_desc':
      sortField = 'price';
      sortDirection = 'desc';
      break;
    case 'date_asc':
      sortField = 'createdAt';
      sortDirection = 'asc';
      break;
    case 'date_desc':
    default:
      sortField = 'createdAt';
      sortDirection = 'desc';
      break;
    case 'name_asc':
      sortField = 'name';
      sortDirection = 'asc';
      break;
    case 'name_desc':
      sortField = 'name';
      sortDirection = 'desc';
      break;
  }

  // Build query with correct order: where filters first, then orderBy, then limit
  // When filtering by category, include products where categoryId OR subcategoryId matches (parent or child category)
  let q = query(collection(db, PRODUCTS_COLLECTION));

  if (categoryId) {
    q = query(
      q,
      or(
        where("categoryId", "==", categoryId),
        where("subcategoryId", "==", categoryId)
      )
    );
  }

  if (status) {
    q = query(q, where("status", "==", status));
  }

  // Then apply orderBy
  q = query(q, orderBy(sortField, sortDirection));

  // Then apply pagination
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  q = query(q, limit(pageSize));

  try {
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(convertToProduct);
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

    // For name sorting, Firestore sorts lexicographically, so we need client-side sorting for proper locale-aware sorting
    if (sortBy === 'name_asc' || sortBy === 'name_desc') {
      products.sort((a, b) => {
        return sortBy === 'name_asc'
          ? a.name.localeCompare(b.name, 'uk')
          : b.name.localeCompare(a.name, 'uk');
      });
    }

    const hasMore = snapshot.docs.length === pageSize;
    console.log('getProducts result:', {
      requestedPageSize: pageSize,
      receivedDocs: snapshot.docs.length,
      productsCount: products.length,
      hasMore,
      status,
      categoryId
    });

    return { products, lastVisible, hasMore };
  } catch (error) {
    // Log Firestore errors (e.g., missing index)
    console.error('Firestore query error:', error);
    // If it's an index error, try without status filter as fallback
    if (error instanceof Error && error.message.includes('index')) {
      console.warn('Firestore index missing, trying query without status filter');
      // Retry without status filter
      let fallbackQ = query(collection(db, PRODUCTS_COLLECTION));
      if (categoryId) {
        fallbackQ = query(
          fallbackQ,
          or(
            where("categoryId", "==", categoryId),
            where("subcategoryId", "==", categoryId)
          )
        );
      }
      fallbackQ = query(fallbackQ, orderBy(sortField, sortDirection));
      if (lastDoc) {
        fallbackQ = query(fallbackQ, startAfter(lastDoc));
      }
      fallbackQ = query(fallbackQ, limit(pageSize));
      const fallbackSnapshot = await getDocs(fallbackQ);
      let fallbackProducts = fallbackSnapshot.docs.map(convertToProduct);
      // Filter by status on client side as fallback
      if (status) {
        fallbackProducts = fallbackProducts.filter(p => p.status === status);
      }
      // For name sorting
      if (sortBy === 'name_asc' || sortBy === 'name_desc') {
        fallbackProducts.sort((a, b) => {
          return sortBy === 'name_asc'
            ? a.name.localeCompare(b.name, 'uk')
            : b.name.localeCompare(a.name, 'uk');
        });
      }
      const fallbackLastVisible = fallbackSnapshot.docs.length > 0 ? fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1] : undefined;
      // hasMore should be based on original snapshot, not filtered products
      // If we got less than pageSize from Firestore, there's no more
      // If we got pageSize but after filtering have less, we might still have more in Firestore
      const hasMore = fallbackSnapshot.docs.length === pageSize;
      return { products: fallbackProducts, lastVisible: fallbackLastVisible, hasMore };
    }
    throw error;
  }
}

// Normalize text for smart search (removes special chars, normalizes spaces).
// Accepts string or number (Firestore may store OEM/partNumber as number).
function normalizeForSearch(text: string | number | null | undefined): string {
  const s = text === null || text === undefined ? "" : String(text);
  return s
    .toLowerCase()
    .replace(/[-_.,;:!?'"()\[\]{}\/\\]/g, " ") // Replace special chars with space
    .replace(/\s+/g, " ") // Normalize multiple spaces to single
    .trim();
}

// Search products with optional filters (returns all results for backward compatibility)
export async function searchProducts(
  searchTerm: string,
  options?: { categoryId?: string; status?: ProductStatus }
) {
  const result = await searchProductsInternal(searchTerm, options);
  return result.products;
}

// Internal search function that returns all matching products
async function searchProductsInternal(
  searchTerm: string,
  options?: { categoryId?: string; status?: ProductStatus }
): Promise<{ products: Product[]; totalCount: number }> {
  // Firestore doesn't support full-text search natively
  // For production, consider using Algolia or Elasticsearch
  // Smart search: normalize both search term and product fields
  const normalizedSearch = normalizeForSearch(searchTerm);
  const searchWords = normalizedSearch.split(" ").filter(Boolean);
  const { categoryId, status } = options || {};

  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  let products = snapshot.docs.map(convertToProduct);

  // Search by: name, brand, store article (partNumber), and original number (OEM).
  // Partial match on all fields; OEM is never ignored (each word can match inside OEM).
  const trimmedTerm = searchTerm.trim();
  if (trimmedTerm) {
    if (searchWords.length === 0) {
      // Only special chars/spaces in term → no match
      products = [];
    } else {
      products = products.filter((product) => {
        const normalizedName = normalizeForSearch(product.name);
        const normalizedPartNumber = normalizeForSearch(product.partNumber);
        const normalizedBrand = normalizeForSearch(product.brand);
        const normalizedOem = normalizeForSearch(product.oem);

        return searchWords.every(
          (word) =>
            normalizedName.includes(word) ||
            normalizedPartNumber.includes(word) ||
            normalizedBrand.includes(word) ||
            normalizedOem.includes(word)
        );
      });
    }
  }

  // Apply category filter (categoryId or subcategoryId for parent/child categories)
  if (categoryId) {
    products = products.filter(
      (product) =>
        product.categoryId === categoryId ||
        product.subcategoryId === categoryId
    );
  }

  // Apply status filter
  if (status) {
    products = products.filter((product) => product.status === status);
  }

  // Sort by createdAt desc
  products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return { products, totalCount: products.length };
}

// Paginated search - first call fetches all, subsequent calls use cached results
export async function searchProductsPaginated(
  searchTerm: string,
  options?: {
    categoryId?: string;
    status?: ProductStatus;
    pageSize?: number;
    offset?: number;
    sortBy?: 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  }
): Promise<{
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  allProducts: Product[]; // Return all products for caching on client
}> {
  const { categoryId, status, pageSize = 12, offset = 0, sortBy = 'date_desc' } = options || {};

  const { products: allProducts } = await searchProductsInternal(searchTerm, { categoryId, status });

  // Sort products based on sortBy option
  const sortedProducts = [...allProducts];
  sortedProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'name_asc':
        return a.name.localeCompare(b.name, 'uk');
      case 'name_desc':
        return b.name.localeCompare(a.name, 'uk');
      case 'date_asc':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'date_desc':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  // Paginate
  const paginatedProducts = sortedProducts.slice(offset, offset + pageSize);
  const hasMore = offset + pageSize < sortedProducts.length;

  return {
    products: paginatedProducts,
    totalCount: sortedProducts.length,
    hasMore,
    allProducts: sortedProducts,
  };
}

// Get search results count (for display before loading all results)
export async function getSearchProductsCount(
  searchTerm: string,
  options?: { categoryId?: string; status?: ProductStatus }
): Promise<number> {
  const { totalCount } = await searchProductsInternal(searchTerm, options);
  return totalCount;
}

// Get single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return convertToProduct(docSnap);
}

// Get product by part number
export async function getProductByPartNumber(partNumber: string): Promise<Product | null> {
  const q = query(collection(db, PRODUCTS_COLLECTION), where("partNumber", "==", partNumber));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  return convertToProduct(snapshot.docs[0]);
}

// Create new product
export async function createProduct(
  productData: Omit<
    Product,
    "id" | "createdAt" | "updatedAt" | "views" | "inquiries"
  >
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
    const categoryRef = doc(db, "categories", productData.categoryId);
    await updateDoc(categoryRef, {
      productCount: increment(1),
    });
  }

  return docRef.id;
}

// Update product
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
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
      console.error("Error deleting image:", error);
    }
  }

  // Update category product count
  if (product.categoryId) {
    const categoryRef = doc(db, "categories", product.categoryId);
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
  const extension = file.name.split(".").pop();
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
export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<void> {
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
export async function importProductsFromCSV(
  rows: CSVProductRow[],
  userId: string,
  mode: 'smart' | 'strict' = 'smart'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    updated: 0,
    failed: 0,
    deleted: 0,
    errors: [],
  };

  let batch = writeBatch(db);
  let batchCount = 0;
  const maxBatchSize = 500;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Check if product exists by part number
      const existingProduct = row.partNumber ? await getProductByPartNumber(row.partNumber) : null;

      const newPrice = parseFloat(row.price) || 0;

      // Determine originalPrice based on price comparison with existing product
      let originalPrice: number | null | undefined = row.originalPrice
        ? parseFloat(row.originalPrice)
        : undefined;

      if (existingProduct) {
        const oldPrice = existingProduct.price;

        if (newPrice > oldPrice) {
          // New price is higher - clear originalPrice (no discount)
          originalPrice = null;
        } else if (newPrice < oldPrice) {
          // New price is lower - set originalPrice to old price (showing discount)
          originalPrice = oldPrice;
        }
        // If prices are equal, keep the originalPrice from CSV or existing
      }

      const productData = {
        name: row.name,
        description: row.description || "",
        price: newPrice,
        originalPrice: originalPrice,
        categoryId: row.categoryId,
        subcategoryId: row.subcategoryId || undefined,
        status: (row.status as ProductStatus) || "in_stock",
        brand: row.brand || "",
        partNumber: row.partNumber || "",
        oem: row.oem ?? null,
        compatibility: row.compatibility
          ? row.compatibility.split(",").map((s) => s.trim())
          : [],
        condition: (row.condition as "new" | "used" | "refurbished") || "used",
        year: row.year,
        carBrand: row.carBrand,
        carModel: row.carModel,
        seo: {
          metaTitle: row.metaTitle || row.name,
          metaDescription:
            row.metaDescription || row.description?.substring(0, 160) || "",
          metaKeywords: row.metaKeywords
            ? row.metaKeywords.split(",").map((s) => s.trim())
            : [],
          ogTitle: row.metaTitle || row.name,
          ogDescription:
            row.metaDescription || row.description?.substring(0, 160) || "",
          ogImage: "",
          canonicalUrl: "",
          slug: row.slug || (row.partNumber ? row.partNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""),
        } as ProductSEO,
        images: [],
        createdBy: userId,
        updatedAt: Timestamp.now(),
      };

      // Convert undefined fields to null to prevent Firestore errors
      Object.keys(productData).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((productData as any)[key] === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (productData as any)[key] = null;
        }
      });

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

      // Commit batch if it reaches max size and create a new one
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Commit remaining items
  if (batchCount > 0) {
    await batch.commit();
  }

  // In strict mode, delete products not in CSV
  if (mode === 'strict') {
    // Collect all part numbers from CSV
    const csvPartNumbers = new Set(
      rows
        .map((row) => row.partNumber)
        .filter((pn): pn is string => Boolean(pn))
    );

    // Get all products from database
    const allProductsSnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const productsToDelete: string[] = [];

    // Find products not in CSV
    allProductsSnapshot.docs.forEach((doc) => {
      const product = convertToProduct(doc);
      if (product.partNumber && !csvPartNumbers.has(product.partNumber)) {
        productsToDelete.push(doc.id);
      }
    });

    // Delete products in batches
    if (productsToDelete.length > 0) {
      let deleteBatch = writeBatch(db);
      let deleteBatchCount = 0;

      for (const productId of productsToDelete) {
        const docRef = doc(db, PRODUCTS_COLLECTION, productId);
        deleteBatch.delete(docRef);
        deleteBatchCount++;
        result.deleted = (result.deleted || 0) + 1;

        if (deleteBatchCount >= maxBatchSize) {
          await deleteBatch.commit();
          deleteBatch = writeBatch(db);
          deleteBatchCount = 0;
        }
      }

      // Commit remaining deletions
      if (deleteBatchCount > 0) {
        await deleteBatch.commit();
      }
    }
  }

  // Recalculate category product counts after import
  await recalculateCategoryProductCounts();

  return result;
}

// Export products to CSV format (matching import format)
export async function exportProductsToCSV(): Promise<
  Record<string, string | number | null>[]
> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));

  return snapshot.docs.map((doc) => {
    const product = convertToProduct(doc);

    // Determine quantity based on status (in_stock = 1, otherwise 0)
    const quantity =
      product.status === "in_stock" || product.status === "on_order" ? 1 : 0;

    // Determine if used (1 = used, 0 = new)
    const isUsed = product.condition === "used" ? 1 : 0;

    return {
      // Primary columns (matching import format)
      partNumber: product.partNumber || "",
      brand: product.brand || "",
      carBrand: product.carBrand || product.brand || "",
      name: product.name || "",
      quantity: quantity,
      isUsed: isUsed,
      price: product.price || 0,
      // Additional columns
      originalPrice: product.originalPrice ?? null,
      categoryId: product.categoryId || "",
      subcategoryId: product.subcategoryId ?? "",
      status: product.status || "in_stock",
      carModel: product.carModel ?? "",
      compatibility: (product.compatibility || []).join(","),
      condition: product.condition || "used",
      oem: product.oem ?? "",
      year: product.year ?? "",
      description: product.description || "",
      metaTitle: product.seo?.metaTitle || "",
      metaDescription: product.seo?.metaDescription || "",
      metaKeywords: (product.seo?.metaKeywords || []).join(","),
      slug: product.seo?.slug || "",
    };
  });
}

// Get products count with optional filters (categoryId = parent or child category id)
export async function getProductsCount(options?: {
  categoryId?: string;
  status?: ProductStatus;
}): Promise<number> {
  const { categoryId, status } = options || {};

  let q = query(collection(db, PRODUCTS_COLLECTION));

  if (categoryId) {
    q = query(
      q,
      or(
        where("categoryId", "==", categoryId),
        where("subcategoryId", "==", categoryId)
      )
    );
  }

  if (status) {
    q = query(q, where("status", "==", status));
  }

  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Get products by status count
export async function getProductsByStatusCount(): Promise<
  Record<ProductStatus, number>
> {
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

// Get all product IDs for static generation
export async function getAllProductIds(): Promise<string[]> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map((doc) => doc.id);
}
