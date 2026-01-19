'use client';

import {
  useEffect,
  useState,
} from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle,
  FolderTree,
  MessageSquare,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Header } from '@/components/admin/header';
import { StatsCard } from '@/components/admin/statsCard';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getDailyStats,
  getDashboardStats,
} from '@/lib/services/stats';
import {
  DashboardStats,
  PRODUCT_STATUSES,
} from '@/lib/types';

const chartConfig = {
  products: {
    label: 'Товари',
    color: '#f59e0b',
  },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ date: string; products: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [dashboardStats, dailyStats] = await Promise.all([
          getDashboardStats(),
          getDailyStats(14),
        ]);
        setStats(dashboardStats);
        setChartData(dailyStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const getStatusLabel = (status: string) => {
    return PRODUCT_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'on_order':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'out_of_stock':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'discontinued':
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Дашборд" />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 bg-zinc-800" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 bg-zinc-800" />
            <Skeleton className="h-80 bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Дашборд" />
      
      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Всього товарів"
            value={stats?.totalProducts || 0}
            icon={Package}
            description="у каталозі"
          />
          <StatsCard
            title="В наявності"
            value={stats?.inStockProducts || 0}
            icon={CheckCircle}
            description="готові до продажу"
          />
          <StatsCard
            title="Категорій"
            value={stats?.totalCategories || 0}
            icon={FolderTree}
            description="активних"
          />
          <StatsCard
            title="Звернень"
            value={stats?.totalInquiries || 0}
            icon={MessageSquare}
            description="всього"
          />
        </div>

        {/* Charts and lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Chart */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-k24-yellow" />
                Активність
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Додано товарів за останні 14 днів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="products"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#colorProducts)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Products by status */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-k24-yellow" />
                Товари за статусом
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Розподіл товарів по статусах
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.productsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-k24-yellow rounded-full"
                          style={{
                            width: `${stats?.totalProducts ? (item.count / stats.totalProducts) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent products and categories */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent products */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-k24-yellow" />
                Останні товари
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Нещодавно додані товари
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{product.name}</span>
                      <span className="text-xs text-zinc-500">Код: {product.partNumber || '—'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-k24-yellow">
                        {product.price.toLocaleString()} ₴
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(product.createdAt, {
                          addSuffix: true,
                          locale: uk,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.recentProducts || stats.recentProducts.length === 0) && (
                  <div className="text-center text-zinc-500 py-8">
                    Немає товарів
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products by category */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-k24-yellow" />
                Товари по категоріях
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Розподіл товарів по категоріях
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.productsByCategory
                  .filter((c) => c.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.categoryId} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">{item.categoryName}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-k24-yellow rounded-full"
                            style={{
                              width: `${stats?.totalProducts ? (item.count / stats.totalProducts) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                {(!stats?.productsByCategory || stats.productsByCategory.filter((c) => c.count > 0).length === 0) && (
                  <div className="text-center text-zinc-500 py-8">
                    Немає категорій з товарами
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

