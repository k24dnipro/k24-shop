"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  buildCatalogHrefFromProductQuery,
  CATALOG_RETURN_HREF_KEY,
} from "@/lib/shop/catalog-navigation";

/**
 * Link target for «Каталог» on product routes: query on /products/[id]?q=…&batch=…
 * or sessionStorage fallback from vitrina.
 */
export function useShopCatalogHref(): string {
  const pathname = usePathname();

  return useMemo(() => {
    if (!pathname.startsWith("/products/")) {
      return "/catalog";
    }
    if (typeof window === "undefined") {
      return "/catalog";
    }
    const built = buildCatalogHrefFromProductQuery(
      new URLSearchParams(window.location.search.slice(1))
    );
    if (built !== "/catalog") {
      return built;
    }
    try {
      const s = sessionStorage.getItem(CATALOG_RETURN_HREF_KEY);
      if (s?.startsWith("/catalog")) return s;
    } catch {
      /* ignore */
    }
    return "/catalog";
  }, [pathname]);
}
