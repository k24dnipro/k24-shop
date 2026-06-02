/* eslint-disable @typescript-eslint/no-require-imports */
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
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL') || getEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = getEnv('FIREBASE_PRIVATE_KEY');
  const storageBucket = getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase Admin env vars: FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY');
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

async function seed() {
  loadEnvLocal();
  const firebaseAdmin = getFirebaseAdmin();
  const db = firebaseAdmin.firestore();

  const blogCol = db.collection('blog_posts');

  const firstPost = {
    title: 'Як правильно підібрати автозапчастини за VIN-кодом автомобіля',
    slug: 'pidbir-avtozapchastyn-za-vin-kodom-yak-ne-pomylitysia',
    summary: 'Дізнайтесь, як правильно підібрати автозапчастини за VIN-кодом автомобіля. Простий гайд, поради та переваги точного підбору деталей в K24 Parts.',
    content: `<p>
Підбір автозапчастин за VIN-кодом автомобіля — це один із найточніших способів знайти потрібні деталі без помилок. VIN-код містить унікальну інформацію про кожен автомобіль, включаючи рік випуску, комплектацію та технічні характеристики.
</p>

<p>
Такий підхід дозволяє уникнути ситуацій, коли деталь візуально схожа, але не підходить за параметрами. Особливо це важливо для сучасних автомобілів із великою кількістю модифікацій.
</p>

<h2>Що таке VIN-код і де його знайти</h2>

<p>
VIN-код (Vehicle Identification Number) — це унікальний 17-значний ідентифікатор автомобіля. Він присвоюється виробником і залишається незмінним протягом усього терміну експлуатації авто.
</p>

<p>
Знайти VIN-код можна у кількох місцях автомобіля:
</p>

<ul>
<li>на панелі приладів біля лобового скла;</li>
<li>на стійці дверей водія;</li>
<li>у технічному паспорті автомобіля;</li>
<li>під капотом (залежно від моделі).</li>
</ul>

<p>
Цей код дозволяє точно визначити всі заводські параметри автомобіля, що є критично важливим при підборі запчастин.
</p>

<h2>Переваги підбору автозапчастин за VIN-кодом</h2>

<p>
Використання VIN-коду значно спрощує процес пошуку деталей і знижує ризик помилки. Це особливо актуально, коли одна модель автомобіля має кілька варіантів комплектації.
</p>

<p>
Основні переваги такого підбору:
</p>

<ul>
<li>точна сумісність деталей;</li>
<li>мінімізація помилок при замовленні;</li>
<li>економія часу на пошук;</li>
<li>підбір оригінальних та аналогових запчастин;</li>
<li>зменшення ризику повернення товару.</li>
</ul>

<p>
Завдяки VIN-коду можна підібрати навіть складні елементи, такі як деталі підвіски, електронні блоки або елементи двигуна.
</p>

<h2>Як правильно використовувати VIN-код при підборі деталей</h2>

<p>
Щоб отримати точний результат, достатньо передати VIN-код спеціалісту або ввести його у форму підбору запчастин на сайті.
</p>

<p>
Після цього система або менеджер визначає точну комплектацію автомобіля та підбирає відповідні деталі. Це особливо зручно при ремонті сучасних автомобілів зі складною електронікою.
</p>

<ul>
<li>передайте VIN-код консультанту;</li>
<li>або введіть його у форму підбору;</li>
<li>перевірте запропоновані варіанти;</li>
<li>оберіть оригінал або аналог;</li>
<li>оформіть замовлення онлайн.</li>
</ul>

<p>
Такий процес дозволяє уникнути помилок і гарантує, що деталь точно підійде до вашого автомобіля.
</p>

<h2>Висновок</h2>

<p>
Підбір автозапчастин за VIN-кодом — це найнадійніший спосіб уникнути помилок і заощадити час. Він особливо корисний для сучасних автомобілів з великою кількістю модифікацій.
</p>

<p>
Використовуючи цей метод, ви отримуєте точність, зручність та впевненість у правильному виборі деталей для вашого автомобіля.
</p>`,
    coverImage: null,
    status: 'published',
    metaTitle: 'Підбір автозапчастин за VIN-кодом – як не помилитися | K24 Parts',
    metaDescription: 'Дізнайтесь, як правильно підібрати автозапчастини за VIN-кодом автомобіля. Простий гайд, поради та переваги точного підбору деталей в K24 Parts.',
    views: 0,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  console.log('Seeding first blog post...');
  
  // Check if post already exists
  const existing = await blogCol.where('slug', '==', firstPost.slug).get();
  if (!existing.empty) {
    console.log('Blog post already seeded.');
  } else {
    await blogCol.add(firstPost);
    console.log('Blog post seeded successfully!');
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
