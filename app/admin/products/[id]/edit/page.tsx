'use client';

import { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { ProductForm } from '@/components/admin/productForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProduct,
  useProductMutations,
} from '@/lib/hooks/useProducts';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { product, loading: productLoading } = useProduct(id);
  const { update, loading: mutationLoading } = useProductMutations();

  const handleSubmit = async (data: any) => {
    try {
      await update(id, data);
      toast.success('Товар оновлено');
      router.push(`/admin/products/${id}`);
    } catch (error) {
      toast.error('Помилка оновлення товару');
      throw error;
    }
  };

  if (productLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Завантаження..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-96 bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col">
        <Header title="Товар не знайдено" />
        <div className="p-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
            className="border-zinc-800 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад до списку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title={`Редагування: ${product.name}`} />
      <div className="p-6">
        <ProductForm product={product} onSubmit={handleSubmit} loading={mutationLoading} />
      </div>
    </div>
  );
}

