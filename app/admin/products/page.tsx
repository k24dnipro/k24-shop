"use client";

import {
  useEffect,
  useState,
} from 'react';
import {
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/lib/hooks/useAuth';
import { useCategories } from '@/lib/hooks/useCategories';
import {
  useProductMutations,
  useProducts,
} from '@/lib/hooks/useProducts';
import {
  Product,
  PRODUCT_STATUSES,
  ProductStatus,
} from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';

export default function ProductsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { products, search, refresh } = useProducts({
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
    status:
      statusFilter !== "all" ? (statusFilter as ProductStatus) : undefined,
  });
  const { categories } = useCategories();
  const { remove, loading: mutationLoading } = useProductMutations();

  const canEdit = hasPermission("canEditProducts");
  const canDelete = hasPermission("canDeleteProducts");
  const canCreate = hasPermission("canCreateProducts");

  // Search and filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Always use search which now handles both search term and filters
      search(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, statusFilter, search]);

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await remove(productToDelete.id);
      toast.success("Товар видалено");
      refresh();
    } catch (error) {
      toast.error("Помилка видалення товару");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
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
      accessorKey: "images",
      header: "",
      cell: ({ row }) => {
        const images = row.original.images;
        const firstImage = images?.[0]?.url;
        return (
          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
            {firstImage ? (
              <Image
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
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-400">
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Назва",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{row.original.name}</span>
          <span className="text-xs text-zinc-500">
            {row.original.partNumber}
          </span>
        </div>
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
        <span className="font-medium text-amber-500">
          {row.original.price.toLocaleString()} ₴
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
                router.push(`/admin/products/${row.original.id}`);
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
                  router.push(`/admin/products/${row.original.id}/edit`);
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
      <Header title="Товари" />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Пошук по SKU або назві..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500"
              />
              {searchTerm && (
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          {/* Add button */}
          {canCreate && (
            <Button
              onClick={() => router.push("/admin/products/new")}
              className="bg-amber-500 hover:bg-amber-600 text-black w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Додати товар
            </Button>
          )}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={products}
          onRowClick={(product) => router.push(`/admin/products/${product.id}`)}
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
    </div>
  );
}
