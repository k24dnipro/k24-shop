'use client';

import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/hooks/useCart';
import { Product } from '@/modules/products/types';

interface HomeAddToCartProps {
  product: Product;
}

export function HomeAddToCart({ product }: HomeAddToCartProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.status === 'discontinued' || product.status === 'on_order') {
      toast.error('Цей товар недоступний для додавання до кошика.');
      return;
    }

    addItem(product);
    toast.success('Товар додано до корзини!', {
      description: product.name,
    });
  };

  return (
    <Button
      onClick={handleAddToCart}
      className="w-full bg-k24-yellow hover:bg-k24-yellow text-black font-medium text-[13px] sm:text-sm h-10 shrink-0 rounded-lg"
    >
      <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
      В корзину
    </Button>
  );
}
