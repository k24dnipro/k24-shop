import {
  collection,
  doc,
  DocumentSnapshot,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  or,
  orderBy,
  query,
  runTransaction,
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
  normalizeOptionalUsd,
  sanitizeUsdPrice,
} from '@/lib/currency/format';
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
import {
  claimSkuInTransaction,
  releaseSkuInTransaction,
  reserveUniqueSku,
} from './product-codes';
import {
  generateSku,
  normalizeSku,
} from './sku';

const PRODUCTS_COLLECTION = "products";

// Cache all products on the client to avoid repeating full-collection reads
// during smart search. This massively reduces read ops for multiple searches.
let allProductsCache: Product[] | null = null;
let allProductsCacheFetchedAt = 0;
const ALL_PRODUCTS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cache product counts to reduce repeated `AGGREGATE COUNT` reads
// (e.g. sitemap/catalog crawlers or frequent re-renders).
const PRODUCTS_COUNT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const productsCountCache = new Map<string, { value: number; fetchedAt: number }>();

// Роздільник кількох URL фото в одній комірці таблиці (CSV/Excel)
const IMAGE_URL_DELIMITER = "|";

const CATEGORIES_COLLECTION = 'categories';

/**
 * Increment/decrement `categories.productCount` only if that category document exists.
 * Avoids FirebaseError: No document to update (orphan IDs, deleted categories, bad imports).
 */
async function adjustCategoryProductCount(
  categoryId: string | null | undefined,
  delta: number
): Promise<void> {
  if (!categoryId) return;
  const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
  const snap = await getDoc(categoryRef);
  if (!snap.exists()) {
    console.warn(
      `[products] categories/${categoryId} is missing; skip productCount ${delta >= 0 ? '+' : ''}${delta}`
    );
    return;
  }
  await updateDoc(categoryRef, {
    productCount: increment(delta),
  });
}

// Convert Firestore document to Product
const convertToProduct = (doc: DocumentSnapshot): Product => {
  const data = doc.data();
  if (!data) throw new Error("Document not found");

  return {
    ...data,
    id: doc.id,
    price: sanitizeUsdPrice(data.price),
    originalPrice: normalizeOptionalUsd(data.originalPrice),
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

  let products: Product[];
  const now = Date.now();
  const isCacheFresh = allProductsCache && now - allProductsCacheFetchedAt < ALL_PRODUCTS_CACHE_TTL_MS;

  if (isCacheFresh && allProductsCache) {
    products = allProductsCache;
  } else {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    products = snapshot.docs.map(convertToProduct);
    allProductsCache = products;
    allProductsCacheFetchedAt = now;
  }

  // Search by: name, brand (виробник деталі), part code, OEM, марка/модель авто.
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
        const normalizedCarBrand = normalizeForSearch(product.carBrand);
        const normalizedCarModel = normalizeForSearch(product.carModel);

        return searchWords.every(
          (word) =>
            normalizedName.includes(word) ||
            normalizedPartNumber.includes(word) ||
            normalizedBrand.includes(word) ||
            normalizedOem.includes(word) ||
            normalizedCarBrand.includes(word) ||
            normalizedCarModel.includes(word)
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

// Get product by part number. УВАГА: `partNumber` НЕ є унікальним. Використовуйте
// тільки для зворотної сумісності зі старими CSV-файлами, де SKU не було.
// Для нової логіки використовуйте `getProductBySku`.
export async function getProductByPartNumber(partNumber: string): Promise<Product | null> {
  const matches = await getProductsByPartNumber(partNumber);
  return matches[0] ?? null;
}

// Get all products with given part number. Може повернути 0..N документів.
export async function getProductsByPartNumber(partNumber: string): Promise<Product[]> {
  const q = query(collection(db, PRODUCTS_COLLECTION), where("partNumber", "==", partNumber));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertToProduct);
}

// Get product by SKU (наш унікальний артикул). Повертає 0 або 1 документ.
export async function getProductBySku(sku: string): Promise<Product | null> {
  const normalized = normalizeSku(sku);
  if (!normalized) return null;
  const q = query(collection(db, PRODUCTS_COLLECTION), where("sku", "==", normalized));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return convertToProduct(snapshot.docs[0]);
}

// Create new product. Атомарно резервує `sku` у `productCodes/{sku}` —
// гарантія унікальності артикула. Якщо `sku` не передано або є колізія,
// підбирається вільний кандидат (`base`, `base-2`, `base-3`, …).
export async function createProduct(
  productData: Omit<
    Product,
    "id" | "createdAt" | "updatedAt" | "views" | "inquiries"
  >
): Promise<string> {
  const now = Timestamp.now();
  const newDocRef = doc(collection(db, PRODUCTS_COLLECTION));

  const requestedSku = normalizeSku(productData.sku || '');
  const baseSku = requestedSku || generateSku({ partNumber: productData.partNumber });
  const finalSku = await reserveUniqueSku({ productId: newDocRef.id, base: baseSku });

  try {
    await runTransaction(db, async (tx) => {
      // Подвійна перевірка: переконатись, що мітка все ще наша.
      await claimSkuInTransaction(tx, finalSku, newDocRef.id);
      tx.set(newDocRef, {
        ...productData,
        sku: finalSku,
        views: 0,
        inquiries: 0,
        createdAt: now,
        updatedAt: now,
      });
    });
  } catch (err) {
    // Якщо запис не вдався — звільняємо мітку, інакше лишиться "сирота".
    await safeReleaseCode(finalSku, newDocRef.id);
    throw err;
  }

  if (productData.categoryId) {
    await adjustCategoryProductCount(productData.categoryId, 1);
  }

  return newDocRef.id;
}

async function safeReleaseCode(sku: string, productId: string): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      await releaseSkuInTransaction(tx, sku, productId);
    });
  } catch (releaseErr) {
    console.warn(`[products] Не вдалось звільнити sku=${sku}:`, releaseErr);
  }
}

// Update product; when images change, delete removed images from Storage.
// Якщо змінюється `sku`, нова мітка резервується атомарно у `productCodes`,
// стара звільняється у тій же транзакції (або у наступному кроці, якщо
// колізії довелось обходити суфіксами).
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  const skuRequested =
    updates.sku !== undefined ? normalizeSku(updates.sku || '') : undefined;

  // Завжди підвантажуємо існуючий документ, якщо потрібно знати поточний sku
  // (щоб коректно звільнити стару мітку), категорію або фото.
  const needsExisting =
    updates.categoryId !== undefined ||
    updates.images !== undefined ||
    skuRequested !== undefined;

  const existing = needsExisting ? await getProductById(id) : null;

  const oldCategoryId = existing?.categoryId;
  const newCategoryId = updates.categoryId !== undefined ? updates.categoryId : oldCategoryId;

  if (existing) {
    if (oldCategoryId && newCategoryId && oldCategoryId !== newCategoryId) {
      await adjustCategoryProductCount(oldCategoryId, -1);
      await adjustCategoryProductCount(newCategoryId, 1);
    } else if (!oldCategoryId && newCategoryId) {
      await adjustCategoryProductCount(newCategoryId, 1);
    } else if (oldCategoryId && !newCategoryId) {
      await adjustCategoryProductCount(oldCategoryId, -1);
    }
  }

  if (updates.images !== undefined && existing) {
    const newUrls = new Set(updates.images.map((img) => img.url));
    for (const image of existing.images) {
      if (!newUrls.has(image.url)) {
        try {
          await deleteProductImage(image.url);
        } catch (error) {
          console.error("Error deleting removed image from storage:", error);
        }
      }
    }
  }

  const oldSku = existing?.sku || '';
  let finalSku: string | undefined = skuRequested;

  // Якщо запит на зміну sku є і він фактично відрізняється від поточного —
  // резервуємо нову мітку. У разі колізії підберемо вільний суфікс, як це
  // робить `reserveUniqueSku`.
  if (skuRequested !== undefined && skuRequested !== oldSku) {
    if (!skuRequested) {
      throw new Error('SKU не може бути порожнім при оновленні товару');
    }
    finalSku = await reserveUniqueSku({ productId: id, base: skuRequested });
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, id);

  try {
    await runTransaction(db, async (tx) => {
      if (finalSku !== undefined && finalSku !== oldSku) {
        await claimSkuInTransaction(tx, finalSku, id);
        if (oldSku) {
          await releaseSkuInTransaction(tx, oldSku, id);
        }
      }
      tx.update(docRef, {
        ...updates,
        ...(finalSku !== undefined ? { sku: finalSku } : {}),
        updatedAt: Timestamp.now(),
      });
    });
  } catch (err) {
    // Якщо транзакція впала після успішного reserveUniqueSku — нова мітка
    // лишилась би сиротою. Знімемо її.
    if (finalSku !== undefined && finalSku !== oldSku) {
      await safeReleaseCode(finalSku, id);
    }
    throw err;
  }
}

// Delete product and all its image files from Storage. Звільняємо мітку у
// `productCodes/{sku}` у тій самій транзакції, що й видалення документа.
export async function deleteProduct(id: string): Promise<void> {
  const product = await getProductById(id);
  if (!product) return;

  for (const image of product.images) {
    try {
      await deleteProductImage(image.url);
    } catch (error) {
      console.error("Error deleting image from storage:", error);
    }
  }

  if (product.categoryId) {
    await adjustCategoryProductCount(product.categoryId, -1);
  }

  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await runTransaction(db, async (tx) => {
    if (product.sku) {
      await releaseSkuInTransaction(tx, product.sku, id);
    }
    tx.delete(docRef);
  });
}

// Batch delete products and their image files from Storage.
// Видалення йде через batch (як і раніше), мітки в `productCodes` чистимо
// окремими транзакціями (інакше batch не може координуватись із read-залежним
// release). Помилки звільнення лише логуються — мітка-сирота не блокує жодну
// функціональність, її прибере наступний запуск backfill-скрипта.
export async function deleteProducts(ids: string[]): Promise<void> {
  const products: Product[] = [];
  for (const id of ids) {
    const product = await getProductById(id);
    if (!product) continue;
    products.push(product);
    for (const image of product.images) {
      try {
        await deleteProductImage(image.url);
      } catch (error) {
        console.error("Error deleting image from storage:", error);
      }
    }
    if (product.categoryId) {
      await adjustCategoryProductCount(product.categoryId, -1);
    }
  }

  const batch = writeBatch(db);
  for (const id of ids) {
    batch.delete(doc(db, PRODUCTS_COLLECTION, id));
  }
  await batch.commit();

  for (const product of products) {
    if (!product.sku) continue;
    await safeReleaseCode(product.sku, product.id);
  }
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

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

// Only delete from our Firebase Storage; external URLs (e.g. from import) are skipped
function isFirebaseStorageUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('firebasestorage.googleapis.com');
  } catch {
    return false;
  }
}

// Delete product image by its download URL (or by productId + imageId fallback)
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!isFirebaseStorageUrl(imageUrl)) return;

  const url = new URL(imageUrl);
  const pathPart = url.pathname.includes('/o/')
    ? url.pathname.split('/o/')[1]
    : '';
  const objectPathEncoded = pathPart || url.searchParams.get('name') || '';
  const objectPath = decodeURIComponent(objectPathEncoded);

  if (!objectPath) return;

  const pathsToTry: string[] = [objectPath];
  const hasExtension = /\.[a-z0-9]+$/i.test(objectPath);
  if (!hasExtension) {
    pathsToTry.push(
      ...IMAGE_EXTENSIONS.map((ext) => objectPath + ext)
    );
  }

  let lastError: unknown;
  for (const path of pathsToTry) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return;
    } catch (err) {
      lastError = err;
      const msg = err && typeof (err as Error).message === 'string' ? (err as Error).message : '';
      if (!msg.includes('object-not-found') && !msg.includes('does not exist')) throw err;
    }
  }
  throw lastError;
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

// Import products from CSV.
//
// Логіка matching'у:
//   1) Якщо в рядку є `sku` — шукаємо існуючий товар саме по ньому (точний key).
//   2) Інакше fallback на `partNumber`. Якщо знайдено рівно один — оновлюємо
//      його; якщо знайдено кілька — записуємо помилку у result і пропускаємо
//      рядок (явно, щоб не зруйнувати дані).
//   3) Якщо нічого не знайдено — створюємо новий товар. SKU генерується з
//      `partNumber` (нормалізованого) або як `MAN-<8>` для рядків без коду.
//
// Запис ведеться через писаний пакет (writeBatch), а резервація SKU — через
// окремі транзакції до пакета. Це дає атомарну гарантію унікальності й при
// цьому залишає батч-режим для самого товару (швидкість + єдиний commit).
export async function importProductsFromCSV(
  rows: CSVProductRow[],
  userId: string,
  mode: 'smart' | 'strict' = 'smart',
  options?: { updateImages?: boolean }
): Promise<ImportResult> {
  const updateImages = options?.updateImages ?? false;
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

  // Sku, які вже зайняті в межах поточного імпорту (щоб не "змагалися" два
  // рядки з одним і тим же сгенерованим артикулом).
  const claimedInThisRun = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const requestedSku = normalizeSku(row.sku || '');
      let existingProduct: Product | null = null;

      if (requestedSku) {
        existingProduct = await getProductBySku(requestedSku);
      } else if (row.partNumber) {
        // Back-compat: старі CSV без колонки SKU. Дозволяємо upsert по
        // partNumber, тільки якщо матч однозначний.
        const matches = await getProductsByPartNumber(row.partNumber);
        if (matches.length === 1) {
          existingProduct = matches[0];
        } else if (matches.length > 1) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            message: `Знайдено ${matches.length} товарів з кодом деталі "${row.partNumber}". Додайте колонку SKU, щоб обрати конкретний товар.`,
          });
          continue;
        }
      }

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

      // Images:
      // - By default we keep existing images for updates (price/originalPrice/etc.)
      // - If updateImages=true we overwrite images using CSV `imageUrl`
      // - For new products we still set images from CSV (if provided)
      const shouldOverwriteImages = updateImages || !existingProduct;

      const parsedImages: ProductImage[] = shouldOverwriteImages
        ? row.imageUrl
          ? row.imageUrl
            .split(IMAGE_URL_DELIMITER)
            .map((url) => url.trim())
            .filter(Boolean)
            .map((url, order) => ({
              id: uuidv4(),
              url,
              alt: row.name,
              order,
            })) as ProductImage[]
          : []
        : existingProduct?.images ?? [];

      const ogImageFromImages = parsedImages?.[0]?.url || '';

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
        // Кілька фото: в комірці URL через "|" (наприклад: url1|url2|url3)
        images: parsedImages,
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
          // If we are not overwriting images, keep ogImage aligned with existing product images.
          ogImage: ogImageFromImages,
          canonicalUrl: "",
          slug: row.slug || (row.partNumber ? row.partNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-") : ""),
        } as ProductSEO,
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
        // Оновлення. Якщо в рядку явно вказано інший SKU, ніж у існуючого
        // товару — спробуємо змінити мітку (рідкісний кейс, але сумісно).
        let nextSku = existingProduct.sku;
        if (requestedSku && requestedSku !== existingProduct.sku) {
          if (claimedInThisRun.has(requestedSku)) {
            throw new Error(`SKU "${requestedSku}" уже використано в цьому імпорті`);
          }
          const newSku = await reserveUniqueSku({
            productId: existingProduct.id,
            base: requestedSku,
          });
          claimedInThisRun.add(newSku);
          // Звільнимо стару мітку окремо (поза batch'ем).
          if (existingProduct.sku) {
            await safeReleaseCode(existingProduct.sku, existingProduct.id);
          }
          nextSku = newSku;
        }
        const docRef = doc(db, PRODUCTS_COLLECTION, existingProduct.id);
        batch.update(docRef, { ...productData, sku: nextSku });
        result.updated++;
      } else {
        // Створення нового. Резервуємо вільний SKU перед записом.
        const newDocRef = doc(collection(db, PRODUCTS_COLLECTION));
        const baseSku = requestedSku || generateSku({ partNumber: row.partNumber });
        if (claimedInThisRun.has(baseSku)) {
          // Колізія всередині того самого імпорту — `reserveUniqueSku` сам
          // підбере наступний вільний суфікс.
        }
        const finalSku = await reserveUniqueSku({
          productId: newDocRef.id,
          base: baseSku,
        });
        claimedInThisRun.add(finalSku);
        batch.set(newDocRef, {
          ...productData,
          sku: finalSku,
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

  // In strict mode, delete products not in CSV.
  // Тепер matching ведеться по `sku` (пріоритет) і `partNumber` (back-compat).
  // Це уникає кейсу, коли товари без SKU несподівано стираються через те,
  // що їх partNumber порожній.
  if (mode === 'strict') {
    const csvSkus = new Set(
      rows
        .map((row) => normalizeSku(row.sku || ''))
        .filter((s): s is string => Boolean(s))
    );
    const csvPartNumbers = new Set(
      rows
        .map((row) => row.partNumber)
        .filter((pn): pn is string => Boolean(pn))
    );

    const allProductsSnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const productsToDelete: { id: string; sku: string }[] = [];

    allProductsSnapshot.docs.forEach((doc) => {
      const product = convertToProduct(doc);
      const skuMatch = product.sku && csvSkus.has(product.sku);
      const pnMatch = product.partNumber && csvPartNumbers.has(product.partNumber);
      // Залишаємо товар, якщо він метчиться хоч за SKU, хоч за partNumber.
      if (!skuMatch && !pnMatch) {
        productsToDelete.push({ id: doc.id, sku: product.sku || '' });
      }
    });

    if (productsToDelete.length > 0) {
      let deleteBatch = writeBatch(db);
      let deleteBatchCount = 0;

      for (const { id: productId } of productsToDelete) {
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

      if (deleteBatchCount > 0) {
        await deleteBatch.commit();
      }

      // Звільняємо мітки `productCodes` для видалених товарів.
      for (const { id, sku } of productsToDelete) {
        if (sku) await safeReleaseCode(sku, id);
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
      // Primary key — наш унікальний артикул. Завжди йде першою колонкою.
      sku: product.sku || "",
      // Код деталі від постачальника (може повторюватись).
      partNumber: product.partNumber || "",
      // Усі фото в одній комірці через "|" (наприклад: url1|url2|url3)
      imageUrl:
        product.images?.length
          ? product.images.map((img) => img.url).join(IMAGE_URL_DELIMITER)
          : "",
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

// Minimal data read for sitemap generation.
// We only need `id` and `updatedAt` per product.
export async function getProductsForSitemap(): Promise<
  Array<{ id: string; updatedAt: Date | null }>
> {
  // NOTE: we don't use Firestore `select()` here because it's not available in the current SDK version.
  // Reads are still per document, but we avoid additional logic and only return minimal fields.
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));

  return snapshot.docs.map((doc) => {
    const data = doc.data() as { updatedAt?: { toDate?: () => Date } | null } | undefined;
    const updatedAt = data?.updatedAt?.toDate?.() ?? null;
    return { id: doc.id, updatedAt };
  });
}

// Get products count with optional filters (categoryId = parent or child category id)
export async function getProductsCount(options?: {
  categoryId?: string;
  status?: ProductStatus;
}): Promise<number> {
  const { categoryId, status } = options || {};

  const cacheKey = `${categoryId ?? 'all'}|${status ?? 'all'}`;
  const cached = productsCountCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < PRODUCTS_COUNT_CACHE_TTL_MS) {
    return cached.value;
  }

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

  const snapshot = await getCountFromServer(q);
  const value = snapshot.data().count;
  productsCountCache.set(cacheKey, { value, fetchedAt: now });
  return value;
}

// Get products by status count
export async function getProductsByStatusCount(): Promise<
  Record<ProductStatus, number>
> {
  const counts: Record<ProductStatus, number> = {
    in_stock: 0,
    on_order: 0,
    out_of_stock: 0,
    discontinued: 0,
  };
  
  const statuses: ProductStatus[] = [
    "in_stock",
    "on_order",
    "out_of_stock",
    "discontinued",
  ];

  await Promise.all(
    statuses.map(async (status) => {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("status", "==", status)
      );
      const snapshot = await getCountFromServer(q);
      counts[status] = snapshot.data().count;
    })
  );

  return counts;
}

// Get all product IDs for static generation
export async function getAllProductIds(): Promise<string[]> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  return snapshot.docs.map((doc) => doc.id);
}
