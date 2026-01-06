import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import {
  DashboardStats,
  Product,
  ProductStatus,
} from '../types';

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  // Get all products
  const productsSnapshot = await getDocs(collection(db, 'products'));
  const products = productsSnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Product[];

  // Get categories
  const categoriesSnapshot = await getDocs(collection(db, 'categories'));
  const categories = categoriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Calculate stats
  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.status === 'in_stock').length;
  const outOfStockProducts = products.filter((p) => p.status === 'out_of_stock').length;
  const totalCategories = categories.length;
  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalInquiries = products.reduce((sum, p) => sum + (p.inquiries || 0), 0);

  // Recent products (last 10)
  const recentProducts = [...products]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Products by category
  const productsByCategory = categories.map((cat) => ({
    categoryId: cat.id,
    categoryName: (cat as any).name || 'Unknown',
    count: products.filter((p) => p.categoryId === cat.id).length,
  }));

  // Products by status
  const statusCounts: Record<ProductStatus, number> = {
    in_stock: 0,
    on_order: 0,
    out_of_stock: 0,
    discontinued: 0,
  };

  products.forEach((p) => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++;
    }
  });

  const productsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as ProductStatus,
    count,
  }));

  return {
    totalProducts,
    inStockProducts,
    outOfStockProducts,
    totalCategories,
    totalViews,
    totalInquiries,
    recentProducts,
    productsByCategory,
    productsByStatus,
  };
}

// Get products added in last N days
export async function getProductsAddedInPeriod(days: number): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    collection(db, 'products'),
    where('createdAt', '>=', Timestamp.fromDate(startDate))
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Get top viewed products
export async function getTopViewedProducts(count: number = 10): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    orderBy('views', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Product[];
}

// Get top inquired products
export async function getTopInquiredProducts(count: number = 10): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    orderBy('inquiries', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Product[];
}

// Get daily stats for the chart (last N days)
export async function getDailyStats(days: number = 30): Promise<{
  date: string;
  products: number;
  views: number;
}[]> {
  const stats: { date: string; products: number; views: number }[] = [];
  
  // Get all products
  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map((doc) => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  }));

  // Generate stats for each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const productsOnDay = products.filter(
      (p) => p.createdAt >= dayStart && p.createdAt <= dayEnd
    ).length;

    stats.push({
      date: dateStr,
      products: productsOnDay,
      views: 0, // Views tracking would need a separate collection with timestamps
    });
  }

  return stats;
}

