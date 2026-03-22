'use client';

import { formatUAH } from '@/lib/currency/format';
import { useUsdToUahRate } from '@/lib/hooks/useUsdToUahRate';

export function UsdToUahPrice({ usd, initialRate }: { usd: number; initialRate?: number }) {
  const { rate } = useUsdToUahRate({ initialRate });

  if (!Number.isFinite(usd) || usd < 0) {
    return '— грн.';
  }

  if (rate == null) {
    // Не показуємо "$" у SSR/першому рендері: це може конфліктувати з JSON-LD/SEO.
    return '— грн.';
  }

  return formatUAH(usd * rate);
}

