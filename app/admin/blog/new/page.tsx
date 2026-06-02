"use client";

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { BlogForm } from '@/components/admin/blogForm';
import { useBlogMutations } from '@/modules/blog/hooks/use-blog';
import { BlogPost } from '@/modules/blog/types';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { create, loading } = useBlogMutations();

  const handleSubmit = async (
    data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>
  ) => {
    try {
      await create(data);
      toast.success('Статтю створено');
      router.push('/admin/blog');
    } catch (error) {
      toast.error('Помилка створення статті');
      throw error;
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Нова стаття" />
      <div className="p-6">
        <BlogForm
          onSubmit={handleSubmit}
          loading={loading}
          cancelHref="/admin/blog"
        />
      </div>
    </div>
  );
}
