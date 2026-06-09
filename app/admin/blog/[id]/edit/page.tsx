"use client";

import { use, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { BlogForm } from '@/components/admin/blogForm';
import { useBlog, useBlogMutations } from '@/modules/blog/hooks/use-blog';
import { BlogPost } from '@/modules/blog/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-zinc-950 text-zinc-400">
          Завантаження...
        </div>
      }
    >
      <EditBlogPostPageInner params={params} />
    </Suspense>
  );
}

function EditBlogPostPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { post, loading: postLoading, error: postError } = useBlog(id);
  const { update, loading: mutationLoading, error: mutationError } = useBlogMutations();

  useEffect(() => {
    if (postError) {
      console.error('Error fetching blog post:', postError);
    }
  }, [postError]);

  useEffect(() => {
    if (mutationError) {
      console.error('Error updating blog post:', mutationError);
    }
  }, [mutationError]);

  const handleSubmit = async (
    data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>
  ) => {
    try {
      await update(id, data);
      toast.success('Статтю оновлено');
      router.push('/admin/blog');
    } catch (error) {
      toast.error('Помилка оновлення статті');
      throw error;
    }
  };

  if (postLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Завантаження..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-96 bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (postError) {
    return (
      <div className="flex flex-col">
        <Header title="Помилка завантаження" />
        <div className="p-6">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Помилка завантаження статті: {postError}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col">
        <Header title="Статтю не знайдено" />
        <div className="p-6">
          <p className="text-zinc-500">Запитувану статтю не знайдено.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title={`Редагування статті: ${post.title}`} />
      <div className="p-6 space-y-6">
        {mutationError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Помилка оновлення статті: {mutationError}
          </div>
        )}
        <BlogForm
          post={post}
          onSubmit={handleSubmit}
          loading={mutationLoading}
          cancelHref="/admin/blog"
        />
      </div>
    </div>
  );
}
