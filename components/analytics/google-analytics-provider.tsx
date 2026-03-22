'use client';

import {
  Suspense,
} from 'react';
import {
  GoogleAnalytics,
  sendGAEvent,
} from '@next/third-parties/google';
import {
  usePathname,
  useSearchParams,
} from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { hasAnalyticsCookieConsent } from '@/lib/analytics/consent';
import { COOKIE_CONSENT_CHANGE_EVENT } from '@/lib/analytics/events';

/**
 * GA4 після згоди на cookie + оновлення page_path при клієнтській навігації (App Router).
 */
function GoogleAnalyticsPagePath({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPathEffect = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    // Перший перегляд вже враховує `<GoogleAnalytics />`; оновлюємо лише при навігації SPA
    if (isFirstPathEffect.current) {
      isFirstPathEffect.current = false;
      return;
    }
    const qs = searchParams?.toString();
    const pagePath = qs ? `${pathname}?${qs}` : pathname;
    sendGAEvent('config', gaId, { page_path: pagePath });
  }, [pathname, searchParams, gaId]);

  return null;
}

export function GoogleAnalyticsProvider({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const sync = () => setConsent(hasAnalyticsCookieConsent());
    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, sync);
  }, []);

  if (!consent) return null;

  return (
    <>
      <GoogleAnalytics gaId={gaId} />
      <Suspense fallback={null}>
        <GoogleAnalyticsPagePath gaId={gaId} />
      </Suspense>
    </>
  );
}
