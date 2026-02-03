'use client';

import { use } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import { useProduct } from '@/modules/products/hooks/use-products';
import {
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
} from '@/modules/products/types';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { product, loading, remove } = useProduct(id);
  const { categories } = useCategories();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('canEditProducts');
  const canDelete = hasPermission('canDeleteProducts');

  const handleDelete = async () => {
    try {
      await remove();
      toast.success('Товар видалено');
      router.push('/admin/products');
    } catch {
      toast.error('Помилка видалення товару');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      in_stock: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      on_order: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      out_of_stock: 'bg-red-500/10 text-red-500 border-red-500/20',
      discontinued: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    };

    return (
      <Badge variant="outline" className={statusConfig[status] || statusConfig.discontinued}>
        {PRODUCT_STATUSES.find((s) => s.value === status)?.label || status}
      </Badge>
    );
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const getConditionLabel = (condition: string) => {
    return PRODUCT_CONDITIONS.find((c) => c.value === condition)?.label || condition;
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Завантаження..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-96 bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col">
        <Header title="Товар не знайдено" />
        <div className="p-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
            className="border-zinc-800 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад до списку
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title={product.name} />

      <div className="p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
            className="border-zinc-800 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>

          <div className="flex gap-2">
            {canEdit && (
              <Button
                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                className="bg-k24-yellow hover:bg-k24-yellow text-black"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Редагувати
              </Button>
            )}

            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Видалити
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Видалити товар?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      Ви впевнені, що хочете видалити цей товар? Цю дію неможливо скасувати.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
                      Скасувати
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Видалити
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Фотографії</CardTitle>
              </CardHeader>
              <CardContent>
                {product.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800"
                      >
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="object-cover"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-k24-yellow text-black text-xs px-2 py-1 rounded">
                            Головне
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-zinc-500">
                    Немає фотографій
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Опис</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 whitespace-pre-wrap">
                  {product.description || 'Опис відсутній'}
                </p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Характеристики</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Бренд</span>
                      <span className="text-white">{product.brand || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Номер запчастини</span>
                      <span className="text-white">{product.partNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Стан</span>
                      <span className="text-white">{getConditionLabel(product.condition)}</span>
                    </div>
                    {product.oem && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Оригінальний номер (OEM)</span>
                        <span className="text-white">{product.oem}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Марка авто</span>
                      <span className="text-white">{product.carBrand || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Модель авто</span>
                      <span className="text-white">{product.carModel || '-'}</span>
                    </div>
                  </div>
                </div>


                {product.compatibility.length > 0 && (
                  <>
                    <Separator className="my-4 bg-zinc-800" />
                    <div>
                      <span className="text-zinc-500 block mb-2">Сумісність</span>
                      <div className="flex flex-wrap gap-2">
                        {product.compatibility.map((item) => (
                          <Badge key={item} variant="outline" className="border-zinc-700 text-zinc-300">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-zinc-500 block mb-1">Meta Title</span>
                  <span className="text-white">{product.seo.metaTitle || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Meta Description</span>
                  <span className="text-white">{product.seo.metaDescription || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Keywords</span>
                  <div className="flex flex-wrap gap-2">
                    {product.seo.metaKeywords.length > 0 ? (
                      product.seo.metaKeywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="border-zinc-700 text-zinc-300">
                          {keyword}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">URL Slug</span>
                  <span className="text-k24-yellow">{product.seo.slug || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Код запчастини</span>
                  <span className="font-mono text-k24-yellow">{product.partNumber || '—'}</span>
                </div>
                <Separator className="bg-zinc-800" />
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Ціна</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">
                      {product.price.toLocaleString()} ₴
                    </span>
                    {product.originalPrice && (
                      <span className="block text-sm text-zinc-500 line-through">
                        {product.originalPrice.toLocaleString()} ₴
                      </span>
                    )}
                  </div>
                </div>
                <Separator className="bg-zinc-800" />
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Статус</span>
                  {getStatusBadge(product.status)}
                </div>
                <Separator className="bg-zinc-800" />
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Категорія</span>
                  <span className="text-white">{getCategoryName(product.categoryId)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Eye className="h-4 w-4" />
                    <span>Перегляди</span>
                  </div>
                  <span className="text-white font-medium">{product.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>Звернення</span>
                  </div>
                  <span className="text-white font-medium">{product.inquiries || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Створено</span>
                  <span className="text-zinc-400">
                    {formatDistanceToNow(product.createdAt, { addSuffix: true, locale: uk })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Оновлено</span>
                  <span className="text-zinc-400">
                    {formatDistanceToNow(product.updatedAt, { addSuffix: true, locale: uk })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

