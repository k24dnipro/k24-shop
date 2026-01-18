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
