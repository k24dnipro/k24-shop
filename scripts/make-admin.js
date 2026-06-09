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

loadEnvLocal();

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

const db = admin.firestore();

async function run() {
  const email = 'testadmin@example.com';
  console.log(`Searching for user with email: ${email}...`);
  const snapshot = await db.collection('users').where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log(`User ${email} not found. Please register this user in the login/register form first!`);
    return;
  }

  const userDoc = snapshot.docs[0];
  console.log(`Found user: ${userDoc.id}. Updating permissions to Admin...`);
  
  await userDoc.ref.update({
    role: 'admin',
    isActive: true,
    approvalStatus: 'approved',
    permissions: {
      canViewStats: true,
      canCreateProducts: true,
      canDeleteProducts: true,
      canEditProducts: true,
      canExportData: true,
      canImportData: true,
      canManageCategories: true,
      canManageUsers: true
    }
  });
  console.log(`User ${email} successfully updated to Admin!`);
}

run().catch(console.error);
