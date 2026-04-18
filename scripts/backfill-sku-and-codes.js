/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Бекфіл унікальних SKU для всіх товарів + наповнення реєстру `productCodes/{sku}`.
 *
 * Алгоритм:
 *   1) Прочитати всі products.
 *   2) Зібрати вже існуючі sku в Set (щоб не дублювати).
 *   3) Для кожного товару БЕЗ sku:
 *        - якщо partNumber непорожній → кандидат = normalizeSku(partNumber);
 *        - інакше → кандидат = MAN-<8 hex>.
 *      У разі колізії (вже існує в Set або в реєстрі) — додаємо суфікс
 *      `-2`, `-3`, …
 *   4) Для дублікатів partNumber, де sku формується з нього: найстарший
 *      (за createdAt) забирає базовий sku, наступні — з суфіксами.
 *   5) Записати sku у самі документи products.
 *   6) Створити документи productCodes/{sku} = { productId, updatedAt }.
 *
 * Скрипт ідемпотентний: повторний запуск нічого не робить, якщо все вже на місці.
 *
 * Запуск:
 *   node scripts/backfill-sku-and-codes.js                # alias dry-run
 *   node scripts/backfill-sku-and-codes.js --dry-run
 *   node scripts/backfill-sku-and-codes.js --confirm
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const PRODUCTS_COLLECTION = 'products';
const PRODUCT_CODES_COLLECTION = 'productCodes';

const SKU_MAX_LENGTH = 64;
const MANUAL_PREFIX = 'MAN-';
const MANUAL_RANDOM_LENGTH = 8;
const BATCH_SIZE = 400;

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local not found at ${envPath}`);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function getEnv(name) {
  return process.env[name];
}

function getFirebaseAdmin() {
  const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || getEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = getEnv('FIREBASE_PRIVATE_KEY');
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase Admin env (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }
  return admin;
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--confirm') && args.includes('--dry-run')) {
    console.error('Вкажи або --dry-run, або --confirm (не обидва).');
    process.exit(1);
  }
  return { execute: args.includes('--confirm') };
}

function normalizeSku(input) {
  if (!input) return '';
  const upper = String(input).trim().toUpperCase();
  return upper
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SKU_MAX_LENGTH);
}

function shortRandom(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

function generateManualSku() {
  return `${MANUAL_PREFIX}${shortRandom(MANUAL_RANDOM_LENGTH)}`;
}

function withSuffix(sku, attempt) {
  if (attempt < 2) return sku;
  const base = sku.replace(/-\d+$/, '');
  return `${base}-${attempt}`.slice(0, SKU_MAX_LENGTH);
}

function pickFreeSku(baseSku, taken) {
  const base = baseSku || generateManualSku();
  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = withSuffix(base, attempt);
    if (!taken.has(candidate)) return candidate;
  }
  // Fallback на MAN-<8>
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = generateManualSku();
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`Не вдалось підібрати вільний SKU для бази "${baseSku}"`);
}

async function main() {
  const { execute } = parseArgs();

  loadEnvLocal();
  const firebaseAdmin = getFirebaseAdmin();
  const db = firebaseAdmin.firestore();

  const productsCol = db.collection(PRODUCTS_COLLECTION);
  const codesCol = db.collection(PRODUCT_CODES_COLLECTION);

  console.log('Завантажую products…');
  const productsSnap = await productsCol.get();
  console.log(`  знайдено: ${productsSnap.size}`);

  console.log('Завантажую productCodes…');
  const codesSnap = await codesCol.get();
  console.log(`  існуючих міток: ${codesSnap.size}`);

  // Поточний стан реєстру.
  const codesByProduct = new Map(); // productId -> sku
  const taken = new Set();          // зайняті sku
  for (const doc of codesSnap.docs) {
    const data = doc.data() || {};
    const sku = doc.id;
    taken.add(sku);
    if (data.productId) codesByProduct.set(data.productId, sku);
  }

  // Для дедупу partNumber → беремо найстарший товар першим.
  const products = productsSnap.docs
    .map((doc) => {
      const data = doc.data() || {};
      const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate().getTime()
        : 0;
      return {
        id: doc.id,
        sku: typeof data.sku === 'string' ? data.sku : '',
        partNumber: typeof data.partNumber === 'string' ? data.partNumber : '',
        createdAt,
        ref: doc.ref,
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  // Спершу резервуємо ті, що вже мають коректний sku (нормалізований).
  const productUpdates = []; // { ref, oldSku, newSku, productId }
  const codeUpdates = [];    // { sku, productId } — створити мітку
  const codeReleases = [];   // sku — мітку прибрати, бо вказує на чужий productId

  let stats = { kept: 0, normalized: 0, generatedFromPartNumber: 0, generatedManual: 0, conflictResolved: 0 };

  for (const p of products) {
    const existing = (p.sku || '').trim();
    if (existing) {
      const norm = normalizeSku(existing);
      if (norm === existing && !taken.has(norm)) {
        // sku валідний і ще не зайнятий — резервуємо мітку, якщо її нема.
        taken.add(norm);
        if (codesByProduct.get(p.id) !== norm) {
          codeUpdates.push({ sku: norm, productId: p.id });
        }
        stats.kept++;
        continue;
      }
      if (norm === existing && taken.has(norm) && codesByProduct.get(p.id) === norm) {
        // Все на місці — не робимо нічого.
        stats.kept++;
        continue;
      }
      if (norm !== existing) {
        // sku не у канонічному форматі — нормалізуємо.
        const newSku = pickFreeSku(norm, taken);
        taken.add(newSku);
        productUpdates.push({ ref: p.ref, oldSku: existing, newSku, productId: p.id });
        codeUpdates.push({ sku: newSku, productId: p.id });
        stats.normalized++;
        if (newSku !== norm) stats.conflictResolved++;
        continue;
      }
      if (taken.has(norm) && codesByProduct.get(p.id) !== norm) {
        // sku зайнятий кимось іншим — підбираємо інший.
        const newSku = pickFreeSku(norm, taken);
        taken.add(newSku);
        productUpdates.push({ ref: p.ref, oldSku: existing, newSku, productId: p.id });
        codeUpdates.push({ sku: newSku, productId: p.id });
        stats.conflictResolved++;
        continue;
      }
    }

    // sku порожній → генеруємо.
    const baseFromPart = normalizeSku(p.partNumber);
    if (baseFromPart) {
      const newSku = pickFreeSku(baseFromPart, taken);
      taken.add(newSku);
      productUpdates.push({ ref: p.ref, oldSku: '', newSku, productId: p.id });
      codeUpdates.push({ sku: newSku, productId: p.id });
      stats.generatedFromPartNumber++;
      if (newSku !== baseFromPart) stats.conflictResolved++;
    } else {
      const newSku = pickFreeSku('', taken);
      taken.add(newSku);
      productUpdates.push({ ref: p.ref, oldSku: '', newSku, productId: p.id });
      codeUpdates.push({ sku: newSku, productId: p.id });
      stats.generatedManual++;
    }
  }

  // Знаходимо мітки-сироти (вказують на товар, якого вже немає).
  const productIds = new Set(products.map((p) => p.id));
  for (const [productId, sku] of codesByProduct.entries()) {
    if (!productIds.has(productId)) {
      codeReleases.push(sku);
    }
  }

  console.log('\nПлан змін:');
  console.log(`  залишити як є             : ${stats.kept}`);
  console.log(`  нормалізувати існуючий sku: ${stats.normalized}`);
  console.log(`  згенерувати з partNumber  : ${stats.generatedFromPartNumber}`);
  console.log(`  згенерувати MAN-XXXXXXXX  : ${stats.generatedManual}`);
  console.log(`  розв'язати колізії суфікс.: ${stats.conflictResolved}`);
  console.log(`  оновлень у products       : ${productUpdates.length}`);
  console.log(`  нових міток у productCodes: ${codeUpdates.length}`);
  console.log(`  міток-сиріт до видалення  : ${codeReleases.length}`);

  if (productUpdates.length > 0) {
    console.log('\nПриклад перших 20 змін:');
    productUpdates.slice(0, 20).forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.productId}: "${u.oldSku || '∅'}" → "${u.newSku}"`);
    });
  }

  if (!execute) {
    console.log('\nDry-run: жодних записів. Запусти з --confirm, щоб застосувати.');
    process.exit(0);
  }

  console.log('\nЗастосовую…');

  // Оновлюємо products: проставляємо sku.
  for (let i = 0; i < productUpdates.length; i += BATCH_SIZE) {
    const chunk = productUpdates.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const u of chunk) {
      batch.update(u.ref, { sku: u.newSku });
    }
    await batch.commit();
    console.log(`  products batch: ${Math.min(i + BATCH_SIZE, productUpdates.length)}/${productUpdates.length}`);
  }

  // Створюємо мітки productCodes.
  for (let i = 0; i < codeUpdates.length; i += BATCH_SIZE) {
    const chunk = codeUpdates.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const c of chunk) {
      batch.set(codesCol.doc(c.sku), {
        productId: c.productId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    console.log(`  productCodes batch: ${Math.min(i + BATCH_SIZE, codeUpdates.length)}/${codeUpdates.length}`);
  }

  // Прибираємо мітки-сироти.
  for (let i = 0; i < codeReleases.length; i += BATCH_SIZE) {
    const chunk = codeReleases.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const sku of chunk) {
      batch.delete(codesCol.doc(sku));
    }
    await batch.commit();
    console.log(`  releases batch: ${Math.min(i + BATCH_SIZE, codeReleases.length)}/${codeReleases.length}`);
  }

  console.log('\nГотово.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
