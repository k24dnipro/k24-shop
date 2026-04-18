import {
  doc,
  DocumentReference,
  runTransaction,
  Transaction,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  generateSku,
  normalizeSku,
  SKU_LIMITS,
  withSuffix,
} from './sku';

/**
 * Реєстр унікальних артикулів. Firestore не вміє UNIQUE-індексів, тому
 * атомарність забезпечується окремою колекцією `productCodes/{sku}`, у яку
 * пишемо всередині тієї ж транзакції, що й сам товар.
 *
 * Документ: `{ productId: string, updatedAt: Date }`.
 */

export const PRODUCT_CODES_COLLECTION = 'productCodes';

const MAX_CLAIM_ATTEMPTS = 50;

export class ProductCodeConflictError extends Error {
  readonly sku: string;
  readonly ownerId: string;
  constructor(sku: string, ownerId: string) {
    super(`SKU "${sku}" вже використовується іншим товаром (${ownerId}).`);
    this.name = 'ProductCodeConflictError';
    this.sku = sku;
    this.ownerId = ownerId;
  }
}

function codeRef(sku: string): DocumentReference {
  return doc(db, PRODUCT_CODES_COLLECTION, sku);
}

/**
 * Базова перевірка валідності SKU перед записом.
 */
export function assertValidSku(sku: string): void {
  if (!sku) throw new Error('SKU не може бути порожнім');
  if (sku.length > SKU_LIMITS.maxLength) {
    throw new Error(`SKU довший за ${SKU_LIMITS.maxLength} символів`);
  }
  if (sku !== normalizeSku(sku)) {
    throw new Error(
      `SKU "${sku}" не у канонічному форматі (очікувалось "${normalizeSku(sku)}")`
    );
  }
}

/**
 * Усередині транзакції перевіряє, чи мітка вільна або належить тому ж товару.
 * Якщо вільна — створює її. Якщо зайнята іншим — кидає {@link ProductCodeConflictError}.
 */
export async function claimSkuInTransaction(
  tx: Transaction,
  sku: string,
  productId: string
): Promise<void> {
  assertValidSku(sku);
  const ref = codeRef(sku);
  const snap = await tx.get(ref);
  if (snap.exists()) {
    const data = snap.data() as { productId?: string } | undefined;
    if (data?.productId && data.productId !== productId) {
      throw new ProductCodeConflictError(sku, data.productId);
    }
    return; // already ours
  }
  tx.set(ref, { productId, updatedAt: new Date() });
}

/**
 * Усередині транзакції видаляє мітку, якщо вона належить вказаному товару.
 * Не падає, якщо мітки нема або вона належить комусь іншому (це може
 * статись, якщо ми у race-condition; той, хто заклеймив пізніше — її і
 * звільнить).
 */
export async function releaseSkuInTransaction(
  tx: Transaction,
  sku: string,
  productId: string
): Promise<void> {
  if (!sku) return;
  const ref = codeRef(sku);
  const snap = await tx.get(ref);
  if (!snap.exists()) return;
  const data = snap.data() as { productId?: string } | undefined;
  if (data?.productId !== productId) return;
  tx.delete(ref);
}

/**
 * Підбирає вільний SKU, починаючи з кандидата `base`. У разі конфлікту
 * додає суфікси `-2`, `-3`, … (до {@link MAX_CLAIM_ATTEMPTS} спроб) і
 * на кожній спробі робить окрему транзакцію (бо в одній транзакції після
 * конфлікту не можна продовжити).
 *
 * Повертає реально заклеймлений SKU. Запис самого товару треба робити
 * окремо — мітка ВЖЕ створена в {@link PRODUCT_CODES_COLLECTION} і вказує
 * на `productId`.
 */
export async function reserveUniqueSku(opts: {
  productId: string;
  base: string;
}): Promise<string> {
  const baseNormalized = normalizeSku(opts.base) || generateSku({});
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_CLAIM_ATTEMPTS; attempt++) {
    const candidate = withSuffix(baseNormalized, attempt);
    try {
      await runTransaction(db, async (tx) => {
        await claimSkuInTransaction(tx, candidate, opts.productId);
      });
      return candidate;
    } catch (err) {
      if (err instanceof ProductCodeConflictError) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  // Усе ще нема вільного — стрибаємо у MAN- простір.
  const fallback = generateSku({});
  await runTransaction(db, async (tx) => {
    await claimSkuInTransaction(tx, fallback, opts.productId);
  });
  if (lastError) {
    console.warn(
      `[productCodes] Не вдалось зайняти "${baseNormalized}" за ${MAX_CLAIM_ATTEMPTS} спроб, використано "${fallback}".`
    );
  }
  return fallback;
}
