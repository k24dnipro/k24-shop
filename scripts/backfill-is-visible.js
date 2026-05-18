/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Бекфіл поля `isVisible` для всіх товарів в Firestore.
 * Всі наявні товари отримають значення `isVisible: true` за замовчуванням.
 *
 * Запуск:
 *   node scripts/backfill-is-visible.js                # dry-run (лише перевірка)
 *   node scripts/backfill-is-visible.js --confirm      # застосувати зміни
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const PRODUCTS_COLLECTION = 'products';
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
  return { execute: args.includes('--confirm') };
}

async function main() {
  const { execute } = parseArgs();

  loadEnvLocal();
  const firebaseAdmin = getFirebaseAdmin();
  const db = firebaseAdmin.firestore();

  const productsCol = db.collection(PRODUCTS_COLLECTION);

  console.log('Завантажую товари з бази Firestore...');
  const productsSnap = await productsCol.get();
  console.log(`Знайдено товарів: ${productsSnap.size}`);

  const toUpdate = [];
  productsSnap.docs.forEach((doc) => {
    const data = doc.data() || {};
    if (data.isVisible === undefined) {
      toUpdate.push({
        id: doc.id,
        name: data.name || 'Без назви',
        ref: doc.ref,
      });
    }
  });

  console.log(`\nТоварів, що потребують бекфілу (isVisible === undefined): ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log('Усі товари вже мають встановлене поле isVisible.');
    process.exit(0);
  }

  if (!execute) {
    console.log('\nПлан змін (Dry-run):');
    toUpdate.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.id}] ${p.name.slice(0, 50)} → встановити isVisible: true`);
    });
    if (toUpdate.length > 10) {
      console.log(`  ... і ще ${toUpdate.length - 10} товар(ів)`);
    }
    console.log('\nDry-run: Жодних змін не було записано. Запустіть скрипт з прапорцем `--confirm`, щоб оновити базу.');
    process.exit(0);
  }

  console.log('\nЗастосовую зміни до бази даних...');

  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const p of chunk) {
      batch.update(p.ref, { isVisible: true });
    }
    await batch.commit();
    console.log(`  Оновлено товарів: ${Math.min(i + BATCH_SIZE, toUpdate.length)}/${toUpdate.length}`);
  }

  console.log('\nБекфіл завершено успішно!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Помилка виконання скрипта:', err);
    process.exit(1);
  });
