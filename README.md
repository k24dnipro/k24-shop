# K24 Shop - CRM Адмін Панель

Професійна CRM система для онлайн магазину автозапчастин з розбірок.

## 🚀 Технології

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui
- **Backend:** Firebase (Firestore, Auth, Storage)
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **CSV:** PapaParse

## 📦 Функціонал

### Товари
- ✅ CRUD операції (створення, редагування, видалення)
- ✅ Пошук по ID, SKU, назві
- ✅ Фільтрація по категорії та статусу
- ✅ Завантаження фото товарів (Firebase Storage)
- ✅ Статуси: в наявності, під замовлення, знято з виробництва
- ✅ SEO поля: meta title, description, keywords, slug

### Категорії
- ✅ Ієрархічна структура (категорії та підкатегорії)
- ✅ SEO налаштування для категорій
- ✅ Активація/деактивація категорій

### Імпорт/Експорт
- ✅ Імпорт товарів з CSV файлу
- ✅ Автоматичне оновлення існуючих товарів (по SKU)
- ✅ Завантаження шаблону CSV
- ✅ Експорт товарів в CSV з вибором колонок
- ✅ Імпорт SEO полів з CSV

### Користувачі
- ✅ Ролі: Адміністратор, Менеджер, Переглядач
- ✅ Гнучка система прав доступу
- ✅ Активація/деактивація користувачів
- ✅ Перший користувач автоматично стає адміністратором

### Статистика
- ✅ Дашборд з ключовими метриками
- ✅ Кількість товарів по статусах
- ✅ Кількість товарів по категоріях
- ✅ Графік активності (додані товари)
- ✅ Останні додані товари

### Звернення
- ✅ Список звернень клієнтів
- ✅ Статуси: нове, в обробці, завершено, скасовано
- ✅ Фільтрація по статусу

## 🛠 Встановлення

### Вимоги
- Node.js 20.9.0+
- npm або yarn
- Firebase проект

### Кроки

1. **Клонування репозиторію**
```bash
git clone <repo-url>
cd k24-shop
```

2. **Встановлення залежностей**
```bash
npm install
```

3. **Налаштування Firebase**

Створіть файл `.env.local` в корені проекту:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. **Налаштування Firestore Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Перевірка авторизації
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Перевірка ролі користувача
    function hasRole(role) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    // Перевірка чи активний користувач
    function isActive() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
    }

    // Products
    match /products/{productId} {
      allow read: if isAuthenticated() && isActive();
      allow create: if isAuthenticated() && isActive();
      allow update: if isAuthenticated() && isActive();
      allow delete: if hasRole('admin');
    }

    // Categories
    match /categories/{categoryId} {
      allow read: if isAuthenticated() && isActive();
      allow write: if hasRole('admin');
    }

    // Users
    match /users/{userId} {
      allow read: if isAuthenticated() && isActive();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (request.auth.uid == userId || hasRole('admin'));
      allow delete: if hasRole('admin');
    }

    // Inquiries
    match /inquiries/{inquiryId} {
      allow read: if isAuthenticated() && isActive();
      allow create: if true; // Public можуть створювати звернення
      allow update: if isAuthenticated() && isActive();
      allow delete: if hasRole('admin');
    }
  }
}
```

5. **Налаштування Storage Rules**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /categories/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

6. **Запуск проекту**
```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000)

## 📁 Структура проекту

```
k24-shop/
├── app/
│   ├── admin/
│   │   ├── categories/     # Управління категоріями
│   │   ├── export/         # Експорт CSV
│   │   ├── import/         # Імпорт CSV
│   │   ├── inquiries/      # Звернення клієнтів
│   │   ├── products/       # Управління товарами
│   │   │   ├── [id]/       # Перегляд товару
│   │   │   │   └── edit/   # Редагування товару
│   │   │   └── new/        # Новий товар
│   │   ├── settings/       # Налаштування
│   │   ├── users/          # Управління користувачами
│   │   ├── layout.tsx      # Лейаут адмін-панелі
│   │   └── page.tsx        # Дашборд
│   ├── login/              # Сторінка входу
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/              # Компоненти адмін-панелі
│   │   ├── data-table.tsx
│   │   ├── header.tsx
│   │   ├── product-form.tsx
│   │   ├── sidebar.tsx
│   │   └── stats-card.tsx
│   └── ui/                 # shadcn/ui компоненти
├── lib/
│   ├── hooks/              # React хуки
│   │   ├── use-auth.tsx
│   │   ├── use-categories.ts
│   │   └── use-products.ts
│   ├── services/           # Firebase сервіси
│   │   ├── categories.ts
│   │   ├── inquiries.ts
│   │   ├── products.ts
│   │   ├── stats.ts
│   │   └── users.ts
│   ├── firebase.ts         # Firebase конфігурація
│   ├── types.ts            # TypeScript типи
│   └── utils.ts
└── public/
```

## 📋 Формат CSV для імпорту

```csv
sku,name,description,price,originalPrice,categoryId,status,brand,partNumber,oem,compatibility,condition,year,carBrand,carModel,metaTitle,metaDescription,metaKeywords,slug
SKU001,Фара передня ліва,Опис товару,5000,6000,cat_001,in_stock,BMW,63117442647,"123456,789012","BMW X5 2018-2022",used,2020,BMW,X5,SEO Title,SEO Description,"keyword1,keyword2",product-slug
```

### Обов'язкові поля:
- `sku` - унікальний код товару
- `name` - назва товару
- `price` - ціна

### Статуси товарів:
- `in_stock` - в наявності
- `on_order` - під замовлення
- `out_of_stock` - немає в наявності
- `discontinued` - знято з виробництва

### Стан товару:
- `new` - новий
- `used` - б/у
- `refurbished` - відновлений

## 🔐 Ролі та права доступу

| Право | Admin | Manager | Viewer |
|-------|-------|---------|--------|
| Створення товарів | ✅ | ✅ | ❌ |
| Редагування товарів | ✅ | ✅ | ❌ |
| Видалення товарів | ✅ | ❌ | ❌ |
| Управління категоріями | ✅ | ❌ | ❌ |
| Управління користувачами | ✅ | ❌ | ❌ |
| Імпорт даних | ✅ | ✅ | ❌ |
| Експорт даних | ✅ | ✅ | ❌ |
| Перегляд статистики | ✅ | ✅ | ✅ |

## 🎨 UI/UX

- Темна тема за замовчуванням
- Адаптивний дизайн
- Зручна навігація через сайдбар
- Швидкий пошук та фільтрація
- Drag & drop для фото
- Toast повідомлення для зворотного зв'язку

## 📝 Ліцензія

MIT
