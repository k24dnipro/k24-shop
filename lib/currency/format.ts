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

