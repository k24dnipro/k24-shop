/** Persist last full catalog URL when opening a product (fallback if product URL has no return query). */
export const CATALOG_RETURN_HREF_KEY = "k24-catalog-return-href";

const CATALOG_RETURN_KEYS = ["q", "category", "batch"] as const;

/** Build `/catalog?...` from product page query (same keys as vitrina). */
export function buildCatalogHrefFromProductQuery(searchParams: URLSearchParams): string {
  const p = new URLSearchParams();
  for (const key of CATALOG_RETURN_KEYS) {
    const v = searchParams.get(key);
    if (v != null && v !== "") {
      p.set(key, v);
    }
  }
  const qs = p.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

/** How many "Показати більше" batches are reflected in the catalog URL (1 = first page only). */
export const CATALOG_BATCH_PARAM = "batch";

const MAX_CATALOG_BATCH = 100;

export function getCatalogBatchCount(searchParams: URLSearchParams): number {
  const raw = searchParams.get(CATALOG_BATCH_PARAM);
  if (raw == null || raw === "") {
    return 1;
  }
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(n, MAX_CATALOG_BATCH);
}

export function setCatalogBatchInUrl(
  router: { replace: (href: string) => void },
  pathname: string,
  searchParams: URLSearchParams,
  batch: number
): void {
  const p = new URLSearchParams(searchParams.toString());
  if (batch <= 1) {
    p.delete(CATALOG_BATCH_PARAM);
  } else {
    p.set(CATALOG_BATCH_PARAM, String(batch));
  }
  const qs = p.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname);
}
