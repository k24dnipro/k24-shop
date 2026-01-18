'use client';

import { useState } from 'react';
import {
  FolderPlus,
  FolderTree,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/hooks/useAuth';
import { Category } from '@/lib/types';
import {
  useCategoriesTree,
  useCategoryMutations,
} from '@/modules/categories/hooks/use-categories';
import { generateSlug } from '@/modules/categories/services/categories.service';

export default function CategoriesPage() {
  const { categoriesTree, loading, refresh } = useCategoriesTree();
  const { create, update, remove, loading: mutationLoading } = useCategoryMutations();
  const { hasPermission } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });

  const canManage = hasPermission('canManageCategories');

  const handleOpenDialog = (category?: Category, parent?: string | null) => {
    if (category) {
      setEditingCategory(category);
      setParentId(category.parentId);
      setFormData({
        name: category.name,
        description: category.description,
        slug: category.slug,
        isActive: category.isActive,
        metaTitle: category.seo.metaTitle,
        metaDescription: category.seo.metaDescription,
        metaKeywords: category.seo.metaKeywords.join(', '),
      });
    } else {
      setEditingCategory(null);
      setParentId(parent || null);
      setFormData({
        name: '',
        description: '',
        slug: '',
        isActive: true,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Назва категорії обов'язкова");
      return;
    }

    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug || generateSlug(formData.name),
        isActive: formData.isActive,
        parentId,
        order: categoriesTree.length,
        seo: {
          metaTitle: formData.metaTitle || formData.name,
          metaDescription: formData.metaDescription || formData.description,
          metaKeywords: formData.metaKeywords
            ? formData.metaKeywords.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        },
      };

      if (editingCategory) {
        await update(editingCategory.id, categoryData);
        toast.success('Категорію оновлено');
      } else {
        await create(categoryData);
        toast.success('Категорію створено');
      }

      setDialogOpen(false);
      refresh();
    } catch {
      toast.error('Помилка збереження категорії');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await remove(categoryToDelete.id);
      toast.success('Категорію видалено');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      refresh();
    } catch {
      toast.error('Помилка видалення категорії');
    }
  };

  const renderCategory = (category: Category & { children: Category[] }, level = 0) => (
    <div key={category.id}>
      <div
        className={`flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors ${
          level > 0 ? 'ml-8 border-l border-zinc-800' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <FolderTree className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{category.name}</span>
              {!category.isActive && (
                <Badge variant="outline" className="border-zinc-700 text-zinc-500">
                  Неактивна
                </Badge>
              )}
            </div>
            <span className="text-sm text-zinc-500">
              {category.productCount || 0} товарів • /{category.slug}
            </span>
          </div>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
              <DropdownMenuItem
                onClick={() => handleOpenDialog(category)}
                className="text-zinc-400 focus:text-white focus:bg-zinc-900"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Редагувати
              </DropdownMenuItem>
              {level === 0 && (
                <DropdownMenuItem
                  onClick={() => handleOpenDialog(undefined, category.id)}
                  className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Додати підкатегорію
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setCategoryToDelete(category);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Видалити
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Subcategories */}
      {category.children?.length > 0 && (
        <div className="border-l border-zinc-800 ml-4">
          {category.children.map((child) =>
            renderCategory({ ...child, children: [] }, level + 1)
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      <Header title="Категорії" />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">
            Управління категоріями та підкатегоріями товарів
          </p>
          {canManage && (
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="mr-2 h-4 w-4" />
              Додати категорію
            </Button>
          )}
        </div>

        {/* Categories list */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0 divide-y divide-zinc-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : categoriesTree.length > 0 ? (
              categoriesTree.map((category) => renderCategory(category))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <FolderTree className="h-12 w-12 mb-4 opacity-50" />
                <p>Категорії відсутні</p>
                {canManage && (
                  <Button
                    variant="link"
                    onClick={() => handleOpenDialog()}
                    className="text-amber-500 mt-2"
                  >
                    Створити першу категорію
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCategory ? 'Редагувати категорію' : 'Нова категорія'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              {parentId
                ? 'Створення підкатегорії'
                : editingCategory
                ? 'Змініть дані категорії'
                : 'Заповніть дані для нової категорії'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Назва *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Назва категорії"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">Опис</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="Короткий опис категорії"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-400">URL (slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-zinc-900 border-zinc-800 text-white"
                placeholder="auto-generated-slug"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">Активна</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="border-t border-zinc-800 pt-4 mt-4">
              <p className="text-sm font-medium text-zinc-400 mb-3">SEO налаштування</p>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-xs">Meta Title</Label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="SEO заголовок"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-500 text-xs">Meta Description</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="SEO опис"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-500 text-xs">Meta Keywords</Label>
                  <Input
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-white"
                    placeholder="ключові, слова, через, кому"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={mutationLoading}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {mutationLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Збереження...
                </>
              ) : editingCategory ? (
                'Зберегти'
              ) : (
                'Створити'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Видалити категорію?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Ви впевнені, що хочете видалити категорію &quot;{categoryToDelete?.name}&quot;?
              {categoryToDelete && (() => {
                const categoryWithChildren = categoriesTree.find(
                  (cat): cat is Category & { children: Category[] } => cat.id === categoryToDelete.id
                );
                return categoryWithChildren?.children && categoryWithChildren.children.length > 0;
              })() ? (
                <span className="block mt-2 text-red-400">
                  Увага: всі підкатегорії також будуть видалені!
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={mutationLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {mutationLoading ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

