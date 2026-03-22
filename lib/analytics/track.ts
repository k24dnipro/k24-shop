'use client';

import { sendGAEvent } from '@next/third-parties/google';
import { hasAnalyticsCookieConsent } from '@/lib/analytics/consent';

/**
 * Подія GA4 лише якщо є згода на cookie (і ініціалізований dataLayer).
 * Приклад: `trackGaEvent('purchase', { transaction_id: '...', value: 1, currency: 'USD' });`
 */
export function trackGaEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!hasAnalyticsCookieConsent()) return;
  sendGAEvent('event', name, params ?? {});
}
