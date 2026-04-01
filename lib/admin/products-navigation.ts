/**
 * Shared helpers for admin product list pagination in the URL (`?page=` is 1-based).
 */

export function pageIndexFromPageSearchParam(searchParams: URLSearchParams): number {
  const raw = searchParams.get("page");
  if (raw == null || raw === "") {
    return 0;
  }
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return 0;
  }
  return n - 1;
}

export function adminProductsListPath(pageIndexZeroBased: number): string {
  if (pageIndexZeroBased <= 0) {
    return "/admin/products";
  }
  return `/admin/products?page=${pageIndexZeroBased + 1}`;
}

/** `?page=N` or empty string — append when opening a product/edit/new from the list. */
export function adminProductsListPageQuery(pageIndexZeroBased: number): string {
  if (pageIndexZeroBased <= 0) {
    return "";
  }
  return `?page=${pageIndexZeroBased + 1}`;
}
