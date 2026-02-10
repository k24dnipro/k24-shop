'use client';

import { ShopFooter } from '@/components/shop/footer';
import { ShopHeader } from '@/components/shop/header';
import { AccountDialogContent } from '@/components/shop/account-dialog-content';

export default function AccountPage() {
  // Особистий кабінет як окрема сторінка магазину (з хедером та футером)
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <ShopHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Особистий кабінет</h1>
        <div className="max-w-xl bg-zinc-900/80 border border-zinc-800 rounded-lg p-6">
          <AccountDialogContent />
        </div>
      </main>
      <ShopFooter />
    </div>
  );
}

