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
}

export function useProducts(options: UseProductsOptions = {}) {
  const { pageSize = 20, categoryId, status, autoFetch = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getProducts({
          pageSize,
          categoryId,
          status,
          lastDoc: reset ? undefined : lastDocRef.current || undefined,
        });

        if (reset) {
          setProducts(result.products);
        } else {
          setProducts((prev) => [...prev, ...result.products]);
        }

        lastDocRef.current = result.lastVisible;
        setHasMore(result.hasMore);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка завантаження товарів";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, categoryId, status]
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
    [categoryId, status]
  );

  const refresh = useCallback(() => {
    lastDocRef.current = null;
    setHasMore(true);
    search("");
  }, [search]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchProducts(false);
    }
  }, [hasMore, loading, fetchProducts]);

  useEffect(() => {
    if (autoFetch) {
      // Use search which handles filters client-side
      search("");
    }
  }, [categoryId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProducts = products.filter((product) =>
    categoryId ? product.categoryId === categoryId : true
  );

  return {
    products: filteredProducts,
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
