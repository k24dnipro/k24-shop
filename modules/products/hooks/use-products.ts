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
  searchProductsPaginated,
  updateProduct,
} from '../services/products.service';
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

// Hook for paginated search results (for catalog/shop)
interface UseProductsSearchOptions {
  pageSize?: number;
  categoryId?: string;
  status?: ProductStatus;
  sortBy?: 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}

export function useProductsSearch(options: UseProductsSearchOptions = {}) {
  const { pageSize = 12, categoryId, status, sortBy = 'date_desc' } = options;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Cache all search results (without category filter)
  const allSearchResultsRef = useRef<Product[]>([]);
  // Cache filtered results (with category filter applied)
  const filteredProductsRef = useRef<Product[]>([]);
  const currentOffsetRef = useRef(0);
  const lastSearchTermRef = useRef('');
  const lastStatusRef = useRef(status);

  // Sort products helper
  const sortProducts = useCallback((products: Product[], sort: string) => {
    const sorted = [...products];
    sorted.sort((a, b) => {
      switch (sort) {
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
    return sorted;
  }, []);

  // Calculate category counts from all search results
  // Each product is counted only once - in its most specific category
  const calculateCategoryCounts = useCallback((products: Product[]) => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      // Use subcategoryId if it exists, otherwise use categoryId
      // This ensures each product is counted only once
      const effectiveCategoryId = product.subcategoryId || product.categoryId;
      if (effectiveCategoryId) {
        counts[effectiveCategoryId] = (counts[effectiveCategoryId] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Reset and search with new term
  const search = useCallback(async (term: string) => {
    const trimmedTerm = term.trim();
    setSearchTerm(trimmedTerm);
    
    if (!trimmedTerm) {
      // Clear search
      allSearchResultsRef.current = [];
      filteredProductsRef.current = [];
      currentOffsetRef.current = 0;
      lastSearchTermRef.current = '';
      setDisplayedProducts([]);
      setTotalCount(0);
      setHasMore(false);
      setCategoryCounts({});
      return;
    }

    setLoading(true);
    setError(null);
    currentOffsetRef.current = 0;
    lastSearchTermRef.current = trimmedTerm;
    lastStatusRef.current = status;

    try {
      // Search WITHOUT category filter to get all results for category counts
      const result = await searchProductsPaginated(trimmedTerm, {
        // Don't pass categoryId - we want all results
        status,
        pageSize: 10000, // Get all results
        offset: 0,
        sortBy,
      });
      
      // Store all search results
      allSearchResultsRef.current = result.allProducts;
      
      // Calculate category counts from all results
      const counts = calculateCategoryCounts(result.allProducts);
      setCategoryCounts(counts);
      
      // Now filter by category and paginate
      let filteredProducts = [...result.allProducts];
      if (categoryId) {
        // Filter by categoryId OR subcategoryId to support both parent and child categories
        filteredProducts = filteredProducts.filter(p => 
          p.categoryId === categoryId || p.subcategoryId === categoryId
        );
      }
      
      // Sort and store filtered products
      filteredProducts = sortProducts(filteredProducts, sortBy);
      filteredProductsRef.current = filteredProducts;
      
      // Paginate
      const paginatedProducts = filteredProducts.slice(0, pageSize);
      setDisplayedProducts(paginatedProducts);
      setTotalCount(filteredProducts.length);
      setHasMore(pageSize < filteredProducts.length);
      currentOffsetRef.current = paginatedProducts.length;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Помилка пошуку';
      setError(message);
      setDisplayedProducts([]);
      setTotalCount(0);
      setHasMore(false);
      setCategoryCounts({});
    } finally {
      setLoading(false);
    }
  }, [status, sortBy, pageSize, categoryId, calculateCategoryCounts, sortProducts]);

  // Load more results from cache
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    
    const allProducts = filteredProductsRef.current;
    const currentOffset = currentOffsetRef.current;
    const nextProducts = allProducts.slice(currentOffset, currentOffset + pageSize);
    
    if (nextProducts.length > 0) {
      setDisplayedProducts(prev => [...prev, ...nextProducts]);
      currentOffsetRef.current = currentOffset + nextProducts.length;
      setHasMore(currentOffsetRef.current < allProducts.length);
    } else {
      setHasMore(false);
    }
  }, [hasMore, loading, pageSize]);

  // Re-filter when category changes (use cached results)
  useEffect(() => {
    if (lastSearchTermRef.current && allSearchResultsRef.current.length > 0) {
      // Filter cached results by new category
      let products = [...allSearchResultsRef.current];
      
      // Apply status filter
      if (status) {
        products = products.filter(p => p.status === status);
      }
      
      // Apply category filter (check both categoryId and subcategoryId)
      if (categoryId) {
        products = products.filter(p => 
          p.categoryId === categoryId || p.subcategoryId === categoryId
        );
      }
      
      // Sort
      products = sortProducts(products, sortBy);
      filteredProductsRef.current = products;
      
      // Reset pagination and show first page
      const paginatedProducts = products.slice(0, pageSize);
      setDisplayedProducts(paginatedProducts);
      setTotalCount(products.length);
      setHasMore(pageSize < products.length);
      currentOffsetRef.current = paginatedProducts.length;
    }
  }, [categoryId, sortBy, pageSize, sortProducts, status]);

  // Re-search when status filter changes (need to refetch because status is applied server-side)
  useEffect(() => {
    if (lastSearchTermRef.current && lastStatusRef.current !== status) {
      lastStatusRef.current = status;
      search(lastSearchTermRef.current);
    }
  }, [status, search]);

  // Clear search
  const clearSearch = useCallback(() => {
    allSearchResultsRef.current = [];
    filteredProductsRef.current = [];
    currentOffsetRef.current = 0;
    lastSearchTermRef.current = '';
    setSearchTerm('');
    setDisplayedProducts([]);
    setTotalCount(0);
    setHasMore(false);
    setError(null);
    setCategoryCounts({});
  }, []);

  // Get total count of all search results (without category filter)
  const totalSearchCount = allSearchResultsRef.current.length;

  return {
    searchTerm,
    products: displayedProducts,
    totalCount,
    totalSearchCount, // Total without category filter
    categoryCounts, // Counts per category
    loading,
    error,
    hasMore,
    search,
    loadMore,
    clearSearch,
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
