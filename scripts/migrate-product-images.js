/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Migration: restore missing Firestore product images from Firebase Storage.
 *
 * Run:
 *   node scripts/migrate-product-images.js
 *
 * It reads env vars from .env.local in repo root (FIREBASE_PRIVATE_KEY, etc).
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

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
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL') || getEnv('FIREBASE_CLIENT_EMAIL'.toString());
  const privateKeyRaw = getEnv('FIREBASE_PRIVATE_KEY');
  const storageBucket = getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase Admin env vars: FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
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

async function migrate() {
  loadEnvLocal();
  const firebaseAdmin = getFirebaseAdmin();

  const db = firebaseAdmin.firestore();
  const bucket = firebaseAdmin.storage().bucket();

  const productsCol = db.collection('products');

  console.log('Listing product images in Storage...');
  // Storage layout: products/<productId>/<filename>
  const [files] = await bucket.getFiles({ prefix: 'products/' });

  const filesByProductId = new Map();
  for (const file of files) {
    const parts = file.name.split('/');
    // parts: ['products', '<productId>', '<filename>']
    if (parts.length < 3) continue;
    const productId = parts[1];
    if (!productId) continue;
    if (!filesByProductId.has(productId)) filesByProductId.set(productId, []);
    filesByProductId.get(productId).push(file);
  }

  // Sort files by path for stable order.
  for (const [productId, productFiles] of filesByProductId.entries()) {
    productFiles.sort((a, b) => a.name.localeCompare(b.name));
    filesByProductId.set(productId, productFiles);
  }

  const expires = new Date('2491-09-03T00:00:00.000Z');

  console.log('Fetching products...');
  const snap = await productsCol.get();
  const total = snap.size;

  let restored = 0;
  let skipped = 0;
  let noStorageFiles = 0;

  // Firestore batch limit is 500; but we use sequential updates for simplicity.
  let idx = 0;
  for (const doc of snap.docs) {
    idx += 1;
    const productId = doc.id;
    const data = doc.data() || {};

    const images = Array.isArray(data.images) ? data.images : [];
    const hasAnyUrl = images.some((img) => img && typeof img.url === 'string' && img.url.trim().length > 0);

    // Restore only when images are empty or all urls are empty.
    if (hasAnyUrl) {
      skipped += 1;
      continue;
    }

    const productFiles = filesByProductId.get(productId) || [];
    if (productFiles.length === 0) {
      noStorageFiles += 1;
      continue;
    }

    const newImages = [];
    for (let i = 0; i < productFiles.length; i += 1) {
      const file = productFiles[i];
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires });

      // Use object basename as id key (stable enough for UI keys).
      const filename = file.name.split('/').pop() || '';
      const imageId = filename.includes('.') ? filename.split('.')[0] : filename || `${productId}-${i}`;

      newImages.push({
        id: imageId,
        url: signedUrl,
        alt: data.name || 'Product image',
        order: i,
      });
    }

    const ogImage = newImages[0]?.url || '';
    await doc.ref.update({
      images: newImages,
      'seo.ogImage': ogImage,
      updatedAt: firebaseAdmin.firestore.Timestamp.now(),
    });

    restored += 1;

    if (restored % 25 === 0) {
      console.log(`Progress: restored=${restored}, skipped=${skipped}, noFiles=${noStorageFiles} (${idx}/${total})`);
    }
  }

  console.log('Migration finished.');
  console.log({ restored, skipped, noStorageFiles, total });
}

// Execute migration
// migrate()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error('Migration failed:', err);
//     process.exit(1);
//   });

