import { v4 as uuidv4 } from 'uuid';

/**
 * Утиліти для роботи з SKU (унікальний артикул товару).
 *
 * Семантика трьох полів товару, навколо яких побудована система:
 *   - `sku`        — наш внутрішній артикул, ОБОВ'ЯЗКОВО унікальний.
 *                    Усі апдейти/імпорт/експорт ходять по ньому.
 *   - `partNumber` — код деталі постачальника (каталожний номер). МОЖЕ
 *                    повторюватись (наприклад, та ж двері в синьому і
 *                    червоному варіанті часто мають той самий код).
 *   - `oem`        — оригінальний код виробника авто. МОЖЕ повторюватись.
 */

const SKU_MAX_LENGTH = 64;
const MANUAL_PREFIX = 'MAN-';
const MANUAL_RANDOM_LENGTH = 8;

/**
 * Нормалізує довільний рядок у формат, придатний для SKU:
 *   - upper-case (щоб `1234567ав` і `1234567АВ` були тим самим артикулом),
 *   - дозволені символи: латинські літери, кирилиця, цифри, `_` і `-`,
 *   - усі інші символи (пробіли, крапки, скісні риски тощо) замінюються на `-`,
 *   - повторні `-` стискаються, обрізаються по краях,
 *   - максимум {@link SKU_MAX_LENGTH} символів.
 */
export function normalizeSku(input: string | null | undefined): string {
  if (!input) return '';
  const upper = String(input).trim().toUpperCase();
  // Зберігаємо літери (Unicode), цифри, `_` і `-`. Інше — у `-`.
  const cleaned = upper
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.slice(0, SKU_MAX_LENGTH);
}

/**
 * Генерує SKU для нового товару.
 *
 * - Якщо передано `partNumber` — використовуємо його (нормалізовано).
 * - Інакше повертаємо `MAN-<8 hex>` (manual). Колізії розв'язує транзакційний
 *   реєстр `productCodes/{sku}` — див. {@link claimProductCode}.
 *
 * Це БАЗОВИЙ кандидат на SKU. Унікальність гарантується вже на рівні запису
 * в Firestore (через транзакцію), де у разі конфлікту викликається
 * {@link withSuffix}.
 */
export function generateSku(opts: { partNumber?: string | null }): string {
  const fromPart = normalizeSku(opts.partNumber || '');
  if (fromPart) return fromPart;
  return `${MANUAL_PREFIX}${shortRandom(MANUAL_RANDOM_LENGTH)}`;
}

/**
 * Повертає кандидата на SKU з числовим суфіксом для розв'язання колізій:
 *   `1234` → `1234-2`, `1234-2` → `1234-3` і т.д.
 *
 * Якщо вже є коректний суфікс — інкрементує його. Якщо ні — додає `-2`.
 * Дотримується ліміту {@link SKU_MAX_LENGTH}.
 */
export function withSuffix(sku: string, attempt: number): string {
  if (attempt < 2) return sku;
  const suffix = `-${attempt}`;
  // Якщо вже був суфікс `-N` від попередньої спроби — знімемо його.
  const base = sku.replace(/-\d+$/, '');
  const candidate = `${base}${suffix}`;
  return candidate.slice(0, SKU_MAX_LENGTH);
}

/**
 * Короткий випадковий рядок з uuid. Беремо з вже встановленого `uuid`
 * (без додаткових залежностей).
 */
function shortRandom(length: number): string {
  return uuidv4().replace(/-/g, '').slice(0, length).toUpperCase();
}

export const SKU_LIMITS = {
  maxLength: SKU_MAX_LENGTH,
  manualPrefix: MANUAL_PREFIX,
} as const;
