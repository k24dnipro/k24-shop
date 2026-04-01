'use client';

import { Suspense, use } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { ProductForm } from '@/components/admin/productForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  adminProductsListPath,
  adminProductsListPageQuery,
  pageIndexFromPageSearchParam,
} from '@/lib/admin/products-navigation';
import { Product } from '@/lib/types';
import {
  useProduct,
  useProductMutations,
} from '@/modules/products/hooks/use-products';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-zinc-950 text-zinc-400">
          Завантаження...
        </div>
      }
    >
      <EditProductPageInner params={params} />
    </Suspense>
  );
}

function EditProductPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const listPageIndex = pageIndexFromPageSearchParam(searchParams);
  const productsListPath = adminProductsListPath(listPageIndex);
  const listPageQuery = adminProductsListPageQuery(listPageIndex);
  const cancelHref = `/admin/products/${id}${listPageQuery}`;

  const { product, loading: productLoading } = useProduct(id);
  const { update, loading: mutationLoading } = useProductMutations();

  const handleSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'inquiries'>) => {
    try {
      await update(id, data);
      toast.success('Товар оновлено');
      router.push(`/admin/products/${id}${listPageQuery}`);
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
            onClick={() => router.push(productsListPath)}
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
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          loading={mutationLoading}
          cancelHref={cancelHref}
        />
      </div>
    </div>
  );
}
