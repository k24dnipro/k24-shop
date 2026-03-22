import { COOKIE_CONSENT_NAME } from '@/components/shop/cookie-consent';

/**
 * Чи користувач прийняв cookie (значення cookie з react-cookie-consent за замовчуванням — "true").
 * Лише для клієнта.
 */
export function hasAnalyticsCookieConsent(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_CONSENT_NAME}=([^;]*)`)
  );
  if (!match) return false;
  return decodeURIComponent(match[1].trim()) === 'true';
}
