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
  sku: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  subcategoryId?: string;
  status: ProductStatus;
  images: ProductImage[];
  seo: ProductSEO;
  // Auto parts specific fields
  brand: string;
  partNumber: string;
  oem: string[];
  compatibility: string[];
  condition: 'new' | 'used' | 'refurbished';
  year?: string;
  carBrand?: string;
  carModel?: string;
  // Stats
  views: number;
  inquiries: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parentId: string | null;
  order: number;
  isActive: boolean;
  productCount: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// User types
export type UserRole = 'admin' | 'manager' | 'viewer';

export interface UserPermissions {
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canManageCategories: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canViewStats: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Stats types
export interface DashboardStats {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  totalViews: number;
  totalInquiries: number;
  recentProducts: Product[];
  productsByCategory: { categoryId: string; categoryName: string; count: number }[];
  productsByStatus: { status: ProductStatus; count: number }[];
}

// CSV Import types
export interface CSVProductRow {
  sku: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  categoryId: string;
  subcategoryId?: string;
  status: string;
  brand: string;
  partNumber: string;
  oem?: string;
  compatibility?: string;
  condition: string;
  year?: string;
  carBrand?: string;
  carModel?: string;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  slug?: string;
}

export interface ImportResult {
  success: number;
  updated: number;
  failed: number;
  errors: { row: number; message: string }[];
}

// Inquiry types
export interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
}

// Default values
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canManageCategories: true,
    canManageUsers: true,
    canExportData: true,
    canImportData: true,
    canViewStats: true,
  },
  manager: {
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canManageCategories: false,
    canManageUsers: false,
    canExportData: true,
    canImportData: true,
    canViewStats: true,
  },
  viewer: {
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canManageCategories: false,
    canManageUsers: false,
    canExportData: false,
    canImportData: false,
    canViewStats: true,
  },
};

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

