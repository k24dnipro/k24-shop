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
  // Search-related props
  isSearchActive?: boolean;
  searchCategoryCounts?: Record<string, number>;
  totalSearchCount?: number;
  // Actual product count for selected category (to override stale productCount)
  selectedCategoryActualCount?: number;
}

type CategoryWithChildren = Category & { children: Category[] };

export function ShopSidebar({
  categories,
  loading = false,
  selectedCategoryId,
  onCategorySelect,
  isMobile = false,
  onClose,
  isSearchActive = false,
  searchCategoryCounts = {},
  totalSearchCount = 0,
  selectedCategoryActualCount,
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

  // Get category count - either from search, actual loaded count, or from category data
  const getCategoryCount = (category: Category, children: Category[] = []): number => {
    if (isSearchActive) {
      // In search mode, show count of search results in this category
      const ownCount = searchCategoryCounts[category.id] || 0;
      const childrenCount = children.reduce((sum, child) => sum + (searchCategoryCounts[child.id] || 0), 0);
      return ownCount + childrenCount;
    }
    
    // For selected category, use actual count if available (overrides stale productCount)
    if (selectedCategoryId === category.id && selectedCategoryActualCount !== undefined) {
      return selectedCategoryActualCount;
    }
    
    // Normal mode - show product count from category
    return category.productCount + children.reduce((sum, child) => sum + child.productCount, 0);
  };

  const renderCategory = (category: CategoryWithChildren, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isActive = selectedCategoryId === category.id;
    const hasChildren = category.children.length > 0;
    
    // For root categories, show total count including children; for subcategories, show only their own count
    const displayCount = level === 0 && hasChildren
      ? getCategoryCount(category, category.children)
      : getCategoryCount(category);
    
    // In search mode, hide categories with 0 results (optional - can remove this if you want to show all)
    // if (isSearchActive && displayCount === 0) return null;

    return (
      <div key={category.id}>
        <div className={cn('relative', level > 0 && 'ml-6')}>
          <button
            onClick={() => handleCategoryClick(category.id, hasChildren)}
            className={cn(
              'group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-all text-left w-full',
              isActive
                ? 'bg-k24-yellow/10 text-k24-yellow'
                : isSearchActive && displayCount === 0
                  ? 'text-zinc-600 hover:bg-zinc-900 hover:text-zinc-500'
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
                  isActive ? 'text-k24-yellow' : 'text-zinc-500 group-hover:text-white'
                )}
              />
              <span className="truncate">{category.name}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0',
                isActive
                  ? 'border-k24-yellow/30 bg-k24-yellow/10 text-k24-yellow'
                  : isSearchActive && displayCount === 0
                    ? 'border-zinc-800 bg-zinc-900/50 text-zinc-600'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400'
              )}
            >
              {displayCount}
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
          <FolderTree className="h-5 w-5 text-k24-yellow" />
          <span className="text-sm font-bold text-white">Категорії</span>
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
                ? 'bg-k24-yellow/10 text-k24-yellow'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 shrink-0" />
              <span>{isSearchActive ? 'Усі результати' : 'Усі товари'}</span>
            </div>
            {isSearchActive ? (
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0',
                  selectedCategoryId === 'all' || !selectedCategoryId
                    ? 'border-k24-yellow/30 bg-k24-yellow/10 text-k24-yellow'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400'
                )}
              >
                {totalSearchCount}
              </Badge>
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            )}
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
            className="w-full bg-k24-yellow hover:bg-k24-yellow text-black text-xs"
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

