"use client";

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoriesTree,
  getCategoryById,
  reorderCategories,
  updateCategory,
} from '../services/categories';
import { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка завантаження категорій";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories,
  };
}

export function useCategoriesTree() {
  const [categoriesTree, setCategoriesTree] = useState<
    (Category & { children: Category[] })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategoriesTree();
      setCategoriesTree(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка завантаження категорій";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesTree();
  }, [fetchCategoriesTree]);

  return {
    categoriesTree,
    loading,
    error,
    refresh: fetchCategoriesTree,
  };
}

export function useCategory(id: string | null) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!id) {
      setCategory(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCategoryById(id);
      setCategory(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка завантаження категорії";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return {
    category,
    loading,
    error,
    refresh: fetchCategory,
  };
}

export function useCategoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      categoryData: Omit<
        Category,
        "id" | "createdAt" | "updatedAt" | "productCount"
      >
    ) => {
      setLoading(true);
      setError(null);
      try {
        const id = await createCategory(categoryData);
        return id;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка створення категорії";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const update = useCallback(async (id: string, updates: Partial<Category>) => {
    setLoading(true);
    setError(null);
    try {
      await updateCategory(id, updates);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка оновлення категорії";
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
      await deleteCategory(id);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Помилка видалення категорії";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorder = useCallback(
    async (items: { id: string; order: number }[]) => {
      setLoading(true);
      setError(null);
      try {
        await reorderCategories(items);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Помилка зміни порядку";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    create,
    update,
    remove,
    reorder,
  };
}
