/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Видаляє тестові товари за форматом коду деталі: лише літери, один дефіс, далі лише цифри
 * (приклад структури: XXX-330293 — літери можуть бути латиницею або іншою абеткою).
 * Реальні коди у базі зазвичай без такого «слова-дефіс-число»: 81190AT000, 350000EJA0 тощо.
 *
 * Увага: якщо є справжні коди у форматі «3 літери бренду-номер» (на кшталт SKF-72569), вони теж
 * потраплять під правило — обов’язково спочатку --dry-run.
 *
 * Перед видаленням:
 *   - видаляє файли в Storage за префіксом products/<productId>/
 *   - зменшує categories.productCount для існуючих категорій
 *
 * Запуск з кореня репозиторію (потрібен .env.local з тими ж ключами, що й migrate-product-images.js):
 *
 *   node scripts/delete-fake-products-by-partnumber.js
 *   node scripts/delete-fake-products-by-partnumber.js --dry-run
 *   node scripts/delete-fake-products-by-partnumber.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

/**
 * Тестовий шаблон: зліва тільки літери (Unicode \p{L}), один "-", справа тільки цифри.
 * Довжини підігнані під типові фейки; за потреби зміни константи нижче.
 */
const FAKE_PART_NUMBER_RE = /^[\p{L}]{2,15}-\d{3,}$/u;

const BATCH_SIZE = 400;

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local not found at ${envPath}`);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
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
  const storageBucket = getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase Admin env: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }
  if (!storageBucket) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket,
    });
  }

  return admin;
}

function isFakePartNumber(partNumber) {
  if (typeof partNumber !== 'string') return false;
  const t = partNumber.trim();
  if (!t) return false;
  return FAKE_PART_NUMBER_RE.test(t);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--confirm') && args.includes('--dry-run')) {
    console.error('Вкажи або --dry-run, або --confirm (не обидва).');
    process.exit(1);
  }
  const execute = args.includes('--confirm');
  return { execute };
}

async function deleteProductStorageFiles(bucket, productId) {
  const prefix = `${PRODUCTS_COLLECTION}/${productId}/`;
  const [files] = await bucket.getFiles({ prefix });
  await Promise.all(files.map((f) => f.delete().catch((err) => {
    const code = err && err.code;
    if (code === 404) return;
    console.warn(`Storage delete warn ${f.name}:`, err.message || err);
  })));
}

async function main() {
  const { execute } = parseArgs();

  loadEnvLocal();
  const firebaseAdmin = getFirebaseAdmin();
  const db = firebaseAdmin.firestore();
  const bucket = firebaseAdmin.storage().bucket();
  const FieldValue = firebaseAdmin.firestore.FieldValue;

  const productsCol = db.collection(PRODUCTS_COLLECTION);
  const snap = await productsCol.get();

  const toDelete = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    const pn = data.partNumber;
    if (isFakePartNumber(pn)) {
      toDelete.push({
        id: docSnap.id,
        partNumber: typeof pn === 'string' ? pn.trim() : String(pn),
        name: data.name || '',
        categoryId: data.categoryId || null,
      });
    }
  }

  console.log(`Знайдено документів у products: ${snap.size}`);
  console.log(`Фейкових за форматом «літери-цифри» (regex у скрипті): ${toDelete.length}`);

  if (toDelete.length === 0) {
    process.exit(0);
  }

  console.log('\nСписок усіх збігів:');
  toDelete.forEach((p, i) => {
    const cat = p.categoryId ? `  categoryId=${p.categoryId}` : '';
    console.log(`  ${i + 1}. ${p.id}  partNumber=${p.partNumber}  name=${p.name}${cat}`);
  });

  if (!execute) {
    console.log('\nРежим dry-run: нічого не видалено. Запусти з --confirm для видалення.');
    process.exit(0);
  }

  console.log('\nВидалення...');

  const categoryDeltas = new Map();
  for (const p of toDelete) {
    if (p.categoryId) {
      categoryDeltas.set(p.categoryId, (categoryDeltas.get(p.categoryId) || 0) + 1);
    }
  }

  let storageOk = 0;
  let storageErr = 0;
  for (let i = 0; i < toDelete.length; i += 1) {
    const p = toDelete[i];
    try {
      await deleteProductStorageFiles(bucket, p.id);
      storageOk += 1;
    } catch (e) {
      storageErr += 1;
      console.warn(`Storage prefix products/${p.id}/:`, e.message || e);
    }
    if ((i + 1) % 100 === 0) {
      console.log(`  storage: ${i + 1}/${toDelete.length}`);
    }
  }
  console.log(`Storage оброблено: ok=${storageOk}, помилок=${storageErr}`);

  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const chunk = toDelete.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const p of chunk) {
      batch.delete(productsCol.doc(p.id));
    }
    await batch.commit();
    console.log(`  Firestore batch: ${Math.min(i + BATCH_SIZE, toDelete.length)}/${toDelete.length}`);
  }

  for (const [categoryId, count] of categoryDeltas.entries()) {
    const ref = db.collection(CATEGORIES_COLLECTION).doc(categoryId);
    const catSnap = await ref.get();
    if (!catSnap.exists) {
      console.warn(`Категорія ${categoryId} не існує — пропуск productCount`);
      continue;
    }
    await ref.update({ productCount: FieldValue.increment(-count) });
    console.log(`  category ${categoryId}: productCount -= ${count}`);
  }

  console.log('\nГотово. Видалено товарів:', toDelete.length);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
