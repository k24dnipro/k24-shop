"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Eye,
  Filter,
  FolderTree,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { toast } from 'sonner';
import { DataTable } from '@/components/admin/dataTable';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  pageIndexFromPageSearchParam,
} from '@/lib/admin/products-navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import {
  useProductMutations,
  useProductsPaginated,
} from '@/modules/products/hooks/use-products';
import {
  Product,
  PRODUCT_STATUSES,
  ProductStatus,
} from '@/modules/products/types';
import { updateProduct } from '@/modules/products/services/products.service';
import { ColumnDef } from '@tanstack/react-table';

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-zinc-950 text-zinc-400">
          Завантаження...
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const qParamRaw = searchParams.get("q") ?? "";
  const categoryFromUrl = searchParams.get("category") || "all";
  const [searchTerm, setSearchTerm] = useState(qParamRaw);
  const [categoryFilter, setCategoryFilter] = useState<string>(categoryFromUrl);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [pendingBulkCategoryId, setPendingBulkCategoryId] = useState<string>("");
  const [bulkCategoryLoading, setBulkCategoryLoading] = useState(false);

  const pageIndexFromUrl = useMemo(
    () => pageIndexFromPageSearchParam(searchParams),
    [searchParams]
  );

  const expectedPageFromUrlRef = useRef<number | null>(null);
  const prevDebouncedSearchRef = useRef<string | undefined>(undefined);
  /** Останнє q з URL, яке вже відобразили в полі пошуку */
  const appliedUrlQRef = useRef<string | null>(null);
  /** Після router.replace з debounce — не перезаписувати searchTerm з URL */
  const skipSearchTermSyncFromUrlRef = useRef(false);

  const {
    products,
    totalCount,
    loading: productsLoading,
    search,
    refresh,
    handlePageChange,
    currentPage,
    totalPages,
  } = useProductsPaginated({
    pageSize: 20,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    status:
      statusFilter !== "all" ? (statusFilter as ProductStatus) : undefined,
    initialPage: pageIndexFromUrl,
    initialSearchQuery: qParamRaw,
  });

  const searchRef = useRef(search);
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchRef.current = search;
    searchParamsRef.current = searchParams;
  });

  const listPageQuery = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const qTrim = searchTerm.trim();
    if (qTrim) {
      params.set("q", qTrim);
    } else {
      params.delete("q");
    }
    if (categoryFilter && categoryFilter !== "all") {
      params.set("category", categoryFilter);
    } else {
      params.delete("category");
    }
    if (currentPage > 0) {
      params.set("page", String(currentPage + 1));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [searchParams, searchTerm, categoryFilter, currentPage]);

  const { categories } = useCategories();
  const { remove, loading: mutationLoading } = useProductMutations();

  const canEdit = hasPermission("canEditProducts");
  const canDelete = hasPermission("canDeleteProducts");
  const canCreate = hasPermission("canCreateProducts");

  const mergeListQueryParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const qt = searchTerm.trim();
    if (qt) {
      params.set("q", qt);
    } else {
      params.delete("q");
    }
    return params;
  }, [searchParams, searchTerm]);

  const replacePageInUrl = useCallback(
    (pageIndex: number) => {
      const params = mergeListQueryParams();
      if (pageIndex <= 0) {
        params.delete("page");
      } else {
        params.set("page", String(pageIndex + 1));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, mergeListQueryParams]
  );

  const onPaginationChange = useCallback(
    (newPage: number) => {
      handlePageChange(newPage);
      expectedPageFromUrlRef.current = newPage;
      replacePageInUrl(newPage);
    },
    [handlePageChange, replacePageInUrl]
  );

  const handleCategoryFilterChange = useCallback(
    (value: string) => {
      expectedPageFromUrlRef.current = 0;
      setCategoryFilter(value);
      const params = mergeListQueryParams();
      params.delete("page");
      if (value && value !== "all") {
        params.set("category", value);
      } else {
        params.delete("category");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, mergeListQueryParams]
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      expectedPageFromUrlRef.current = 0;
      setStatusFilter(value);
      const params = mergeListQueryParams();
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, mergeListQueryParams]
  );

  // Sync browser history / shared links → table page (back/forward, opening ?page=)
  // useLayoutEffect: run before paint so loading state + overlay apply before stale rows flash
  useLayoutEffect(() => {
    const fromUrl = pageIndexFromPageSearchParam(searchParams);
    if (expectedPageFromUrlRef.current !== null) {
      if (expectedPageFromUrlRef.current === fromUrl) {
        expectedPageFromUrlRef.current = null;
      }
      return;
    }
    if (fromUrl !== currentPage) {
      handlePageChange(fromUrl);
    }
  }, [searchParams, currentPage, handlePageChange]);

  // Sync category filter from URL (back/forward or shared link)
  useEffect(() => {
    const c = searchParams.get("category") || "all";
    if (c !== categoryFilter) {
      expectedPageFromUrlRef.current = 0;
      setCategoryFilter(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Пошуковий запит з URL (назад/вперед, прямий лінк з ?q=)
  useLayoutEffect(() => {
    if (skipSearchTermSyncFromUrlRef.current) {
      skipSearchTermSyncFromUrlRef.current = false;
      appliedUrlQRef.current = qParamRaw;
      return;
    }
    if (appliedUrlQRef.current === qParamRaw) return;
    appliedUrlQRef.current = qParamRaw;
    setSearchTerm(qParamRaw);
  }, [qParamRaw]);

  // Search with debounce + збереження q в URL.
  // Не залежимо від `search` / mergeListQueryParams у deps — інакше після кожного fetch оновлюються
  // колбеки в useProductsPaginated і таймер перезапускається безкінечно (спіннер не зникає).
  useEffect(() => {
    const timer = setTimeout(() => {
      const prev = prevDebouncedSearchRef.current;
      const searchChanged = prev !== undefined && prev !== searchTerm;
      void searchRef.current(searchTerm, {
        pageIndex: searchChanged
          ? 0
          : pageIndexFromPageSearchParam(searchParamsRef.current),
      });
      if (searchChanged) {
        expectedPageFromUrlRef.current = 0;
      }
      prevDebouncedSearchRef.current = searchTerm;

      const params = new URLSearchParams(searchParamsRef.current.toString());
      const trimmed = searchTerm.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      if (searchChanged) {
        params.delete("page");
      }
      const nextQs = params.toString();
      const curQs = searchParamsRef.current.toString();
      if (nextQs === curQs) {
        return;
      }
      skipSearchTermSyncFromUrlRef.current = true;
      router.replace(nextQs ? `${pathname}?${nextQs}` : pathname);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedProductIds(new Set());
  }, [categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await remove(productToDelete.id);
      toast.success("Товар видалено");
      refresh();
    } catch {
      toast.error("Помилка видалення товару");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleBulkAssignCategory = async () => {
    if (!pendingBulkCategoryId) return;
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    setBulkCategoryLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          updateProduct(id, {
            categoryId: pendingBulkCategoryId,
            subcategoryId: null,
          })
        )
      );
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `Категорію оновлено для ${successCount} товар(ів)`
        );
      }
      if (failCount > 0) {
        toast.error(`Не вдалося оновити ${failCount} товар(ів)`);
      }

      refresh();
      if (successCount > 0) {
        setSelectedProductIds(new Set());
        setBulkCategoryDialogOpen(false);
        setPendingBulkCategoryId("");
      }
    } catch {
      toast.error("Помилка масового призначення категорії");
    } finally {
      setBulkCategoryLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;

    try {
      const results = await Promise.allSettled(ids.map((id) => remove(id)));
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Видалено ${successCount} товар(ів)`);
      }
      if (failCount > 0) {
        toast.error(`Не вдалося видалити ${failCount} товар(ів)`);
      }

      setSelectedProductIds(new Set());
      refresh();
    } catch {
      toast.error("Помилка масового видалення товарів");
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (status: ProductStatus) => {
    const statusConfig = {
      in_stock: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      on_order: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      out_of_stock: "bg-red-500/10 text-red-500 border-red-500/20",
      discontinued: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    };

    return (
      <Badge variant="outline" className={statusConfig[status]}>
        {PRODUCT_STATUSES.find((s) => s.value === status)?.label || status}
      </Badge>
    );
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "-";
  };

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: () => {
        if (products.length === 0) return null;
        const allOnPageSelected = products.every((p) => selectedProductIds.has(p.id));

        return (
          <Checkbox
            checked={allOnPageSelected}
            aria-label="Вибрати всі на сторінці"
            onCheckedChange={(checked) => {
              setSelectedProductIds((prev) => {
                const next = new Set(prev);
                if (checked) {
                  products.forEach((p) => next.add(p.id));
                } else {
                  products.forEach((p) => next.delete(p.id));
                }
                return next;
              });
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
      cell: ({ row }) => {
        const id = row.original.id;
        const isSelected = selectedProductIds.has(id);

        return (
          <Checkbox
            checked={isSelected}
            aria-label="Вибрати товар"
            onCheckedChange={(checked) => {
              setSelectedProductIds((prev) => {
                const next = new Set(prev);
                if (checked) {
                  next.add(id);
                } else {
                  next.delete(id);
                }
                return next;
              });
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "images",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const images = row.original.images;
        const firstImage = images?.[0]?.url;
        return (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
            {firstImage ? (
              <ProductImage
                src={firstImage}
                alt={row.original.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-zinc-600 text-xs">Фото</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "partNumber",
      header: "Код деталі",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-zinc-300">
          {row.original.partNumber || '—'}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Назва",
      cell: ({ row }) => (
        <span className="font-medium text-white">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "categoryId",
      header: "Категорія",
      cell: ({ row }) => (
        <span className="text-zinc-400">
          {getCategoryName(row.original.categoryId)}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Ціна",
      cell: ({ row }) => (
        <span className="font-medium text-k24-yellow">
          {row.original.price.toLocaleString()} $
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "views",
      header: "Перегляди",
      cell: ({ row }) => (
        <span className="text-zinc-400">{row.original.views || 0}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-zinc-950 border-zinc-800"
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/products/${row.original.id}${listPageQuery}`);
              }}
              className="text-zinc-400 focus:text-white focus:bg-zinc-900"
            >
              <Eye className="mr-2 h-4 w-4" />
              Переглянути
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/products/${row.original.id}/edit${listPageQuery}`);
                }}
                className="text-zinc-400 focus:text-white focus:bg-zinc-900"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Редагувати
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setProductToDelete(row.original);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Видалити
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <Header title={`Всього: ${totalCount} товарів`} />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Пошук за кодом деталі або назвою..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500"
              />
              {productsLoading && (
                <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 animate-spin" />
              )}
              {searchTerm && !productsLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-500 hover:text-white"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Category filter */}
            <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="w-full sm:w-48 bg-zinc-900/50 border-zinc-800 text-white">
                <Filter className="mr-2 h-4 w-4 text-zinc-500" />
                <SelectValue placeholder="Категорія" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                <SelectItem
                  value="all"
                  className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                >
                  Всі категорії
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-44 bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                <SelectItem
                  value="all"
                  className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                >
                  Всі статуси
                </SelectItem>
                {PRODUCT_STATUSES.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}
                    className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                  >
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
            {(canEdit || canDelete) && selectedProductIds.size > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProductIds(new Set())}
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 w-full sm:w-auto"
                >
                  Зняти виділення ({selectedProductIds.size})
                </Button>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPendingBulkCategoryId("");
                      setBulkCategoryDialogOpen(true);
                    }}
                    className="border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 w-full sm:w-auto"
                  >
                    <FolderTree className="mr-2 h-4 w-4" />
                    Категорія для вибраних ({selectedProductIds.size})
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Видалити вибрані ({selectedProductIds.size})
                  </Button>
                )}
              </div>
            )}
            {canCreate && (
              <Button
                onClick={() => router.push(`/admin/products/new${listPageQuery}`)}
                className="bg-k24-yellow hover:bg-k24-yellow text-black w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Додати товар
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={products}
          onRowClick={(product) =>
            router.push(`/admin/products/${product.id}${listPageQuery}`)
          }
          serverSidePagination={{
            currentPage,
            totalPages,
            onPageChange: onPaginationChange,
            totalCount,
            pageSize: 20,
          }}
          loading={productsLoading}
        />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Видалити товар?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Ви впевнені, що хочете видалити товар &quot;
              {productToDelete?.name}&quot;? Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={mutationLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {mutationLoading ? "Видалення..." : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Bulk assign category dialog */}
      <AlertDialog
        open={bulkCategoryDialogOpen}
        onOpenChange={(open) => {
          setBulkCategoryDialogOpen(open);
          if (!open) setPendingBulkCategoryId("");
        }}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Призначити категорію
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Оберіть категорію для {selectedProductIds.size} вибраного(их) товар(ів). Підкатегорію буде
              скинуто.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select
              value={pendingBulkCategoryId || undefined}
              onValueChange={setPendingBulkCategoryId}
            >
              <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue placeholder="Оберіть категорію" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void handleBulkAssignCategory()}
              disabled={!pendingBulkCategoryId || bulkCategoryLoading}
              className="bg-k24-yellow hover:bg-k24-yellow text-black"
            >
              {bulkCategoryLoading ? "Збереження..." : "Застосувати"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Видалити вибрані товари?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Ви впевнені, що хочете видалити {selectedProductIds.size} товар(ів)? Цю дію неможливо
              скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={mutationLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {mutationLoading ? "Видалення..." : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
