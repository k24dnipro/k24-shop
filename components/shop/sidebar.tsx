'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Package,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ShopSidebarProps {
  categories: Category[];
  loading?: boolean;
  selectedCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

type CategoryWithChildren = Category & { children: Category[] };

export function ShopSidebar({
  categories,
  loading = false,
  selectedCategoryId,
  onCategorySelect,
  isMobile = false,
  onClose,
}: ShopSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build category tree from flat array
  const buildCategoryTree = (cats: Category[]): CategoryWithChildren[] => {
    const rootCategories = cats.filter(c => !c.parentId || c.parentId === null);
    const categoryMap = new Map<string, Category[]>();

    // Group children by parentId
    cats.forEach(cat => {
      if (cat.parentId) {
        if (!categoryMap.has(cat.parentId)) {
          categoryMap.set(cat.parentId, []);
        }
        categoryMap.get(cat.parentId)!.push(cat);
      }
    });

    // Build tree structure
    return rootCategories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.order - b.order)
      .map(cat => ({
        ...cat,
        children: (categoryMap.get(cat.id) || [])
          .filter(c => c.isActive)
          .sort((a, b) => a.order - b.order),
      }));
  };

  const categoryTree = buildCategoryTree(categories);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleCategoryClick = (categoryId: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      toggleCategory(categoryId);
    }
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  const renderCategory = (category: CategoryWithChildren, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isActive = selectedCategoryId === category.id;
    const hasChildren = category.children.length > 0;
    // For root categories, show total count including children; for subcategories, show only their own count
    const totalCount = level === 0 && hasChildren
      ? category.productCount + category.children.reduce((sum, child) => sum + child.productCount, 0)
      : category.productCount;

    return (
      <div key={category.id}>
        <div className={cn('relative', level > 0 && 'ml-6')}>
          <button
            onClick={() => handleCategoryClick(category.id, hasChildren)}
            className={cn(
              'group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all text-left w-full',
              isActive
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
              {hasChildren ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category.id);
                  }}
                  className="shrink-0 p-0.5 hover:bg-zinc-800 rounded cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
              ) : (
                <div className="w-5 shrink-0" />
              )}
              <FolderTree
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-amber-500' : 'text-zinc-500 group-hover:text-white'
                )}
              />
              <span className="truncate">{category.name}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0',
                isActive
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400'
              )}
            >
              {totalCount}
            </Badge>
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-0 mt-1">
            {category.children.map(child => renderCategory({ ...child, children: [] }, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-bold text-white">Каталог</span>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-1">
          {/* All categories */}
          <button
            onClick={() => handleCategoryClick('all')}
            className={cn(
              'group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all text-left',
              selectedCategoryId === 'all' || !selectedCategoryId
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 shrink-0" />
              <span>Усі товари</span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
          </button>

          {/* Loading skeleton */}
          {loading && (
            <>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 bg-zinc-900/60" />
              ))}
            </>
          )}

          {/* Category tree */}
          {!loading && categoryTree.map((category) => renderCategory(category))}

          {!loading && categories.length === 0 && (
            <div className="px-2 py-8 text-center text-sm text-zinc-500">
              Категорії відсутні
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Footer info */}
      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-lg bg-zinc-900/50 p-3 text-sm">
          <p className="font-medium text-white mb-1">Потрібна допомога?</p>
          <p className="text-zinc-500 text-xs mb-2">
            Наші менеджери допоможуть підібрати запчастини
          </p>
          <Button
            size="sm"
            className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs"
            asChild
          >
            <a href="tel:+380">Зателефонувати</a>
          </Button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return sidebarContent;
  }

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-zinc-800 bg-zinc-950 ">
      {sidebarContent}
    </aside>
  );
}

