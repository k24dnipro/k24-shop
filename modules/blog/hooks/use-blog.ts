"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  getBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../services/blog.service';
import { BlogPost } from '../types';

export function useBlogPosts(options?: { status?: 'all' | 'published' | 'draft' }) {
  const status = options?.status;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogPosts({ status });
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження статей');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    refresh: fetchPosts,
  };
}

export function useBlog(id: string | null) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) {
      setPost(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getBlogPostById(id);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження статті');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return {
    post,
    loading,
    error,
    refresh: fetchPost,
  };
}

export function useBlogMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>) => {
      setLoading(true);
      setError(null);
      try {
        const id = await createBlogPost(data);
        return id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка створення статті');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const update = useCallback(async (id: string, updates: Partial<BlogPost>) => {
    setLoading(true);
    setError(null);
    try {
      await updateBlogPost(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка оновлення статті');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteBlogPost(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка видалення статті');
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
  };
}
