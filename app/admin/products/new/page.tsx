'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { ProductForm } from '@/components/admin/productForm';
import {
  adminProductsListPath,
  pageIndexFromPageSearchParam,
} from '@/lib/admin/products-navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProductMutations } from '@/modules/products/hooks/use-products';
import { Product } from '@/modules/products/types';

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-zinc-950 text-zinc-400">
          Завантаження...
        </div>
      }
    >
      <NewProductPageInner />
    </Suspense>
  );
}

function NewProductPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listPageIndex = pageIndexFromPageSearchParam(searchParams);
  const productsListPath = adminProductsListPath(listPageIndex);
  const listPageQuery = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const { create, loading } = useProductMutations();
  const { user } = useAuth();

  const handleSubmit = async (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'inquiries'>
  ) => {
    try {
      const productId = await create({
        ...data,
        createdBy: user?.id || '',
      });
      toast.success('Товар створено');
      router.push(`/admin/products/${productId}${listPageQuery}`);
      return productId;
    } catch (error) {
      toast.error('Помилка створення товару');
      throw error;
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Новий товар" />
      <div className="p-6">
        <ProductForm
          onSubmit={handleSubmit}
          loading={loading}
          cancelHref={`${productsListPath}${listPageQuery}`}
        />
      </div>
    </div>
  );
}
