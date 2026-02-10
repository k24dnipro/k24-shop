// Product types
export type ProductStatus = 'in_stock' | 'on_order' | 'discontinued' | 'out_of_stock';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export interface ProductSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  categoryId: string;
  subcategoryId?: string | null;
  status: ProductStatus;
  images: ProductImage[];
  seo: ProductSEO;
  // Auto parts specific fields
  brand: string;
  partNumber: string;
  oem?: string | null;
  compatibility: string[];
  condition: 'new' | 'used' | 'refurbished';
  year?: string | null;
  carBrand?: string | null;
  carModel?: string | null;
  // Stats
  views: number;
  inquiries: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CSVProductRow {
  partNumber: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string | null;
  categoryId: string;
  subcategoryId?: string | null;
  status: string;
  brand: string;
  oem?: string | null;
  compatibility?: string | null;
  condition: string;
  year?: string | null;
  carBrand?: string | null;
  carModel?: string | null;
  // URL головного зображення товару (для імпорту/експорту з таблиці)
  imageUrl?: string | null;
  // SEO fields
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  slug?: string | null;
}

export interface ImportResult {
  success: number;
  updated: number;
  failed: number;
  deleted?: number;
  errors: { row: number; message: string }[];
}

export const PRODUCT_STATUSES: { value: ProductStatus; label: string }[] = [
  { value: 'in_stock', label: 'В наявності' },
  { value: 'on_order', label: 'Під замовлення' },
  { value: 'out_of_stock', label: 'Немає в наявності' },
  { value: 'discontinued', label: 'Знято з виробництва' },
];

export const PRODUCT_CONDITIONS = [
  { value: 'new', label: 'Нова' },
  { value: 'used', label: 'Б/У' },
  { value: 'refurbished', label: 'Відновлена' },
];
