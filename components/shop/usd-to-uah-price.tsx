'use client';

import { useUsdToUahRate } from '@/lib/hooks/useUsdToUahRate';
import { formatUAH } from '@/lib/currency/format';

export function UsdToUahPrice({ usd, initialRate }: { usd: number; initialRate?: number }) {
  const { rate } = useUsdToUahRate({ initialRate });

  if (rate == null) {
    // Не показуємо "$" у SSR/першому рендері: це може конфліктувати з JSON-LD/SEO.
    return '— грн.';
  }

  return formatUAH(usd * rate);
}

