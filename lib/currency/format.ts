export function toIntegerUAH(uah: number): number {
  if (!Number.isFinite(uah)) return 0;
  // Всегда округляем в большую сторону (для цін без копійок).
  return Math.ceil(uah);
}

export function toIntegerUAHFromUsd(usd: number, rate: number): number {
  return toIntegerUAH(usd * rate);
}

/**
 * Формат для вывода пользователю: без копеек и с точкой в конце.
 * Пример: `1 234 грн.`
 */
export function formatUAH(uah: number): string {
  const rounded = toIntegerUAH(uah);
  return `${rounded.toLocaleString('uk-UA')} грн.`;
}

export function formatUsdToUAH(usd: number, rate: number): string {
  return formatUAH(usd * rate);
}

/** Strikethrough / «стара ціна» — показуємо лише якщо число скінченне і > 0 */
export function hasDisplayableUsdPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Поля з форм (react-hook-form valueAsNumber на порожньому інпуті дає NaN).
 * Повертає null, якщо значення немає або воно некоректне.
 */
export function normalizeOptionalUsd(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Основна ціна товару — завжди скінченне число ≥ 0 */
export function sanitizeUsdPrice(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

