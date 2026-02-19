'use client';

import CookieConsentLib from 'react-cookie-consent';

const COOKIE_NAME = 'k24-cookie-consent';

export function CookieConsent() {
  return (
    <CookieConsentLib
      location="bottom"
      cookieName={COOKIE_NAME}
      buttonText="Прийняти"
      declineButtonText="Відхилити"
      enableDeclineButton
      setDeclineCookie
      declineCookieValue="rejected"
      expires={365}
      disableStyles
      containerClasses="fixed bottom-0 left-0 right-0 z-[100] flex w-full max-w-[100vw] flex-col gap-4 border-t border-border bg-card/95 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:flex-row sm:items-center sm:justify-center sm:gap-6 sm:px-6"
      contentClasses="max-w-2xl text-sm text-foreground sm:mr-4"
      buttonWrapperClasses="flex shrink-0 flex-wrap justify-center gap-2 sm:justify-start sm:gap-3"
      buttonClasses="inline-flex h-9 min-w-[120px] items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      declineButtonClasses="inline-flex h-9 min-w-[120px] items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      ariaAcceptLabel="Прийняти cookie"
      ariaDeclineLabel="Відхилити cookie"
    >
      Цей сайт використовує файли cookie для покращення роботи, зручності та
      аналітики. Продовжуючи перегляд, ви погоджуєтесь з використанням cookie.
    </CookieConsentLib>
  );
}

export {
  getCookieConsentValue,
  resetCookieConsentValue,
} from 'react-cookie-consent';

/** Ім'я cookie для перевірки згоди в інших місцях (наприклад, перед підключенням аналітики). */
export const COOKIE_CONSENT_NAME = COOKIE_NAME;
