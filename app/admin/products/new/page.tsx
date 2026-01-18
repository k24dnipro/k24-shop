'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { ProductForm } from '@/components/admin/productForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProductMutations } from '@/modules/products/hooks/use-products';

export default function NewProductPage() {
  const router = useRouter();
  const { create, loading } = useProductMutations();
  const { user } = useAuth();

  const handleSubmit = async (data: any) => {
    try {
      const productId = await create({
        ...data,
        createdBy: user?.id || '',
      });
      toast.success('Товар створено');
      router.push(`/admin/products/${productId}`);
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
        <ProductForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}

