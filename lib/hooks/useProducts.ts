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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, status, sortBy, autoFetch]);

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

// Hook for admin products (fetches all products with filters, client-side pagination)
interface UseProductsPaginatedOptions {
  pageSize?: number;
  categoryId?: string;
  status?: ProductStatus;
}

export function useProductsPaginated(options: UseProductsPaginatedOptions = {}) {
  const { categoryId, status } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use searchProducts with empty string to get all products with filters
      const results = await searchProducts("", { categoryId, status });
      setProducts(results);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка завантаження товарів";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [categoryId, status]);

  // Search products
  const search = useCallback(
    async (term: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchProducts(term, { categoryId, status });
        setProducts(results);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Помилка пошуку";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [categoryId, status]
  );

  // Initial fetch and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    totalCount: products.length,
    loading,
    error,
    search,
    refresh,
    handlePageChange: () => {}, // Not needed - client-side pagination
    isSearching: false,
  };
}
