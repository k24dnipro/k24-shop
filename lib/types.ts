// Stats types
import {
  Product,
  ProductStatus,
} from '@/modules/products/types';

// Re-export product types from the module
export * from '@/modules/products/types';

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

/** Статус заявки на доступ до адмінки: очікує підтвердження / одобрено */
export type UserApprovalStatus = 'pending' | 'approved';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  /** Чи одобрена заявка (для реєстрації в адмінці). Якщо відсутнє — вважається approved. */
  approvalStatus?: UserApprovalStatus;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

// Storefront order types
export interface OrderItem {
  productId: string;
  name: string;
  partNumber?: string;
  brand?: string;
  price: number;
  quantity: number;
}

export interface OrderCustomerInfo {
  name: string;
  phone: string;
  email?: string;
  comment?: string;
}

export type OrderStatus = 'new' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  /** Firebase auth uid, якщо користувач оформив замовлення будучи залогіненим */
  customerId?: string;
  /** Email з Firebase або з форми, для історії */
  customerEmail?: string;
  customerInfo: OrderCustomerInfo;
  items: OrderItem[];
  totalPrice: number;
  totalItems: number;
  status: OrderStatus;
  createdAt: Date;
}

// Customer profile (особистий кабінет покупця)
export interface CustomerProfile {
  id: string; // Firebase uid
  name: string;
  phone?: string;
  city?: string;
  address?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
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
    canManageUsers: true, // може керувати користувачами та одобрювати заявки
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
