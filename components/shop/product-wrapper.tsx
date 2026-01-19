"use client";

import { useState } from 'react';
import { ShopSidebar } from '@/components/shop/sidebar';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Category } from '@/lib/types';
import { ProductClient } from './product-client';
import { Product } from '@/modules/products/types';

interface ProductWrapperProps {
  product: Product;
  categoryName: string;
  categories: Category[];
}

export function ProductWrapper({ product, categoryName, categories }: ProductWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <ShopSidebar
          categories={categories}
          loading={false}
          selectedCategoryId={product.categoryId}
        />

        <main className="flex-1 overflow-auto">
          <ProductClient product={product} categoryName={categoryName} />
        </main>
      </div>

      {/* Sidebar - Mobile */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-zinc-950 border-zinc-800">
          <ShopSidebar
            categories={categories}
            loading={false}
            selectedCategoryId={product.categoryId}
            isMobile={true}
            onClose={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
