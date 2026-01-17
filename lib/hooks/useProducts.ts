"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  createProduct,
  deleteProduct,
  deleteProducts,
  getProductById,
  getProducts,
  getProductsCount,
  searchProducts,
  updateProduct,
} from '../services/products';
import {
  Product,
  ProductStatus,
} from '../types';

interface UseProductsOptions {
  pageSize?: number;
  categoryId?: string;
  status?: ProductStatus;
  autoFetch?: boolean;
  sortBy?: 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}

export function useProducts(options: UseProductsOptions = {}) {
  const { pageSize = 20, categoryId, status, autoFetch = true, sortBy } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch total count with filters
  const fetchCount = useCallback(async () => {
    try {
      const count = await getProductsCount({
        categoryId,
        status,
      });
      setTotalCount(count);
    } catch (err) {
      console.error("Error fetching product count:", err);
    }
  }, [categoryId, status]);

  const fetchProducts = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getProducts({
          pageSize,
          categoryId,
          status,
          sortBy,
          lastDoc: reset ? undefined : lastDocRef.current || undefined,
        });

        if (reset) {
          setProducts(result.products);
        } else {
          setProducts((prev) => [...prev, ...result.products]);
        }

        lastDocRef.current = result.lastVisible || null;
        setHasMore(result.hasMore);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка завантаження товарів";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, categoryId, status, sortBy]
  );

  const search = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        lastDocRef.current = null;
        fetchProducts(true);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const results = await searchProducts(searchTerm, {
          categoryId,
          status,
        });
        setProducts(results);
        setHasMore(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Помилка пошуку";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, status, fetchProducts]
  );

  const refresh = useCallback(() => {
    lastDocRef.current = null;
    setHasMore(true);
    fetchCount();
    search("");
  }, [search, fetchCount]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchProducts(false);
    }
  }, [hasMore, loading, fetchProducts]);

  useEffect(() => {
    if (autoFetch) {
      // Reset pagination when filters or sort change
      lastDocRef.current = null;
      setHasMore(true);
      // Fetch count and products
      fetchCount();
      fetchProducts(true);
    }
  }, [categoryId, status, sortBy, autoFetch, fetchCount, fetchProducts]);

  const filteredProducts = products.filter((product) =>
    categoryId ? product.categoryId === categoryId : true
  );

  return {
    products: filteredProducts,
    totalCount,
    loading,
    error,
    hasMore,
    fetchProducts: () => fetchProducts(true),
    search,
    refresh,
    loadMore,
  };
}

export function useProduct(id: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setProduct(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getProductById(id);
      setProduct(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка завантаження товару";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const update = useCallback(
    async (updates: Partial<Product>) => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        await updateProduct(id, updates);
        await fetchProduct();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка оновлення товару";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [id, fetchProduct]
  );

  const remove = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      await deleteProduct(id);
      setProduct(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка видалення товару";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  return {
    product,
    loading,
    error,
    refresh: fetchProduct,
    update,
    remove,
  };
}

export function useProductMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      productData: Omit<
        Product,
        "id" | "createdAt" | "updatedAt" | "views" | "inquiries"
      >
    ) => {
      setLoading(true);
      setError(null);
      try {
        const id = await createProduct(productData);
        return id;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка створення товару";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const update = useCallback(async (id: string, updates: Partial<Product>) => {
    setLoading(true);
    setError(null);
    try {
      await updateProduct(id, updates);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка оновлення товару";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProduct(id);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка видалення товару";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMany = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProducts(ids);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка видалення товарів";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    create,
    update,
    remove,
    removeMany,
  };
}

// Hook for admin products with server-side pagination
interface UseProductsPaginatedOptions {
  pageSize?: number;
  categoryId?: string;
  status?: ProductStatus;
}

export function useProductsPaginated(options: UseProductsPaginatedOptions = {}) {
  const { pageSize = 20, categoryId, status } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Store all search results for client-side pagination
  const searchResultsRef = useRef<Product[]>([]);
  const isSearchingRef = useRef(false);
  
  // Store document snapshots for each page to enable efficient navigation
  const pageSnapshotsRef = useRef<Map<number, DocumentSnapshot>>(new Map());
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  // Fetch total count
  const fetchCount = useCallback(async () => {
    try {
      const count = await getProductsCount({
        categoryId,
        status,
      });
      setTotalCount(count);
    } catch (err) {
      console.error("Error fetching product count:", err);
    }
  }, [categoryId, status]);

  // Fetch products for a specific page
  const fetchProducts = useCallback(
    async (page: number, reset = false) => {
      // Don't fetch if currently searching
      if (isSearchingRef.current) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // If searching, paginate search results client-side
        if (isSearching && searchTerm.trim()) {
          const allResults = searchResultsRef.current;
          const start = page * pageSize;
          const end = start + pageSize;
          const paginatedResults = allResults.slice(start, end);
          
          setProducts(paginatedResults);
          setTotalCount(allResults.length);
          setHasMore(end < allResults.length);
          return;
        }

        // For server-side pagination, we need to navigate to the requested page
        // If reset or going to page 0, start from beginning
        let lastDoc: DocumentSnapshot | undefined = undefined;
        
        if (!reset && page > 0) {
          // Check if we have a snapshot for the previous page
          const prevPageSnapshot = pageSnapshotsRef.current.get(page - 1);
          if (prevPageSnapshot) {
            lastDoc = prevPageSnapshot;
          } else {
            // Find the closest cached snapshot before this page
            let closestPage = -1;
            let closestSnapshot: DocumentSnapshot | undefined = undefined;
            
            for (let i = page - 1; i >= 0; i--) {
              const cached = pageSnapshotsRef.current.get(i);
              if (cached) {
                closestPage = i;
                closestSnapshot = cached;
                break;
              }
            }
            
            // Start from the closest cached page or from the beginning
            let currentDoc = closestSnapshot;
            const startPage = closestPage + 1;
            
            // Fetch pages from the closest cached point to the target page
            for (let i = startPage; i < page; i++) {
              const result = await getProducts({
                pageSize,
                categoryId,
                status,
                lastDoc: currentDoc,
              });
              if (result.products.length > 0 && result.lastVisible) {
                currentDoc = result.lastVisible;
                pageSnapshotsRef.current.set(i, currentDoc);
              } else {
                break;
              }
            }
            
            lastDoc = currentDoc;
          }
        }

        const result = await getProducts({
          pageSize,
          categoryId,
          status,
          lastDoc,
        });

        setProducts(result.products);
        setHasMore(result.hasMore);
        
        // Store snapshot for next page
        if (result.lastVisible) {
          pageSnapshotsRef.current.set(page, result.lastVisible);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка завантаження товарів";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, categoryId, status, isSearching, searchTerm]
  );

  // Search products
  const search = useCallback(
    async (term: string) => {
      const trimmedTerm = term.trim();
      const searching = trimmedTerm.length > 0;
      
      // Update search state immediately to prevent other effects from interfering
      isSearchingRef.current = searching;
      setIsSearching(searching);
      setSearchTerm(term);
      
      if (!trimmedTerm) {
        // Reset to page 0 when clearing search
        setCurrentPage(0);
        searchResultsRef.current = [];
        pageSnapshotsRef.current.clear();
        lastDocRef.current = null;
        isSearchingRef.current = false;
        setIsSearching(false);
        await fetchCount();
        await fetchProducts(0, true);
        return;
      }

      setLoading(true);
      setError(null);
      setCurrentPage(0); // Reset to first page when searching
      try {
        const results = await searchProducts(trimmedTerm, { categoryId, status });
        // Store all search results for client-side pagination
        searchResultsRef.current = results;
        
        // Show first page of search results
        const paginatedResults = results.slice(0, pageSize);
        setProducts(paginatedResults);
        setTotalCount(results.length);
        setHasMore(results.length > pageSize);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Помилка пошуку";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, status, pageSize, fetchCount, fetchProducts]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      
      // If searching, paginate search results client-side
      if (isSearchingRef.current && searchResultsRef.current.length > 0) {
        const allResults = searchResultsRef.current;
        const start = newPage * pageSize;
        const end = start + pageSize;
        const paginatedResults = allResults.slice(start, end);
        
        setProducts(paginatedResults);
        setTotalCount(allResults.length);
        setHasMore(end < allResults.length);
        return;
      }
      
      // Otherwise, fetch from server
      fetchProducts(newPage, newPage === 0);
    },
    [fetchProducts, pageSize]
  );

  // Initial fetch and when filters change (but not when searching)
  useEffect(() => {
    // Only reset if not currently searching
    if (!isSearchingRef.current) {
      // Reset pagination when filters change
      setCurrentPage(0);
      searchResultsRef.current = [];
      pageSnapshotsRef.current.clear();
      lastDocRef.current = null;
      setIsSearching(false);
      setSearchTerm("");
      fetchCount();
      fetchProducts(0, true);
    }
  }, [categoryId, status, fetchCount, fetchProducts]);

  // Refresh function
  const refresh = useCallback(() => {
    if (isSearching && searchTerm.trim()) {
      // Re-run search
      search(searchTerm);
    } else {
      pageSnapshotsRef.current.clear();
      lastDocRef.current = null;
      fetchCount();
      fetchProducts(currentPage, currentPage === 0);
    }
  }, [currentPage, fetchCount, fetchProducts, isSearching, searchTerm, search]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    products,
    totalCount,
    loading,
    error,
    search,
    refresh,
    handlePageChange,
    isSearching,
    currentPage,
    totalPages,
    hasMore,
  };
}
