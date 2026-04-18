"use client";

import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import {
  buildCatalogHrefFromProductQuery,
  CATALOG_RETURN_HREF_KEY,
} from "@/lib/shop/catalog-navigation";

const SERVER_HREF = "/catalog";
const noopSubscribe = () => () => {};
const getServerSnapshot = () => SERVER_HREF;

/**
 * Link target for «Каталог» on product routes: query on /products/[id]?q=…&batch=…
 * or sessionStorage fallback from vitrina.
 *
 * Uses `useSyncExternalStore` so SSR/first hydration always renders
 * "/catalog" (matching the server), and React swaps to the browser-derived
 * href in a single post-hydration commit — no manual setState in an effect.
 */
export function useShopCatalogHref(): string {
  const pathname = usePathname();

  const getSnapshot = useCallback(() => {
    if (!pathname.startsWith("/products/")) return SERVER_HREF;

    const built = buildCatalogHrefFromProductQuery(
      new URLSearchParams(window.location.search.slice(1))
    );
    if (built !== SERVER_HREF) return built;

    try {
      const s = sessionStorage.getItem(CATALOG_RETURN_HREF_KEY);
      if (s?.startsWith("/catalog")) return s;
    } catch {
      /* ignore */
    }

    return SERVER_HREF;
  }, [pathname]);

  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);
}
