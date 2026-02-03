'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import {
  exportProductsToCSV,
} from '@/modules/products/services/products.service';
import { PRODUCT_STATUSES } from '@/modules/products/types';

const EXPORT_COLUMNS = [
  { key: 'partNumber', label: 'Код запчастини', default: true },
  { key: 'brand', label: 'Производитель', default: true },
  { key: 'carBrand', label: 'Марка авто', default: true },
  { key: 'name', label: 'Описание запчасти', default: true },
  { key: 'quantity', label: 'Количество', default: true },
  { key: 'isUsed', label: 'Б/у', default: true },
  { key: 'price', label: 'Цена', default: true },
  // Additional columns
  { key: 'originalPrice', label: 'Старая цена', default: true },
  { key: 'categoryId', label: 'Категория ID', default: true },
  { key: 'subcategoryId', label: 'Підкатегорія ID', default: true },
  { key: 'status', label: 'Статус', default: true },
  { key: 'carModel', label: 'Модель авто', default: true },
  { key: 'compatibility', label: 'Совместимость', default: true },
  { key: 'condition', label: 'Состояние', default: true },
  { key: 'oem', label: 'OEM (оригінальний номер)', default: true },
  { key: 'year', label: 'Год', default: true },
  { key: 'description', label: 'Описание', default: true },
  { key: 'metaTitle', label: 'Meta Title', default: true },
  { key: 'metaDescription', label: 'Meta Description', default: true },
  { key: 'metaKeywords', label: 'Meta Keywords', default: true },
  { key: 'slug', label: 'URL Slug', default: true },
];

export default function ExportPage() {
  const { hasPermission } = useAuth();
  const { categories } = useCategories();
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key)
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canExport = hasPermission('canExportData');

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((c) => c !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleSelectDefault = () => {
    setSelectedColumns(EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key));
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Оберіть хоча б одну колонку для експорту');
      return;
    }

    setExporting(true);
    setExportComplete(false);

    try {
      const data = await exportProductsToCSV();
      
      // Filter by category if selected
      let filteredData = data;
      if (categoryFilter !== 'all') {
        filteredData = filteredData.filter((p) => p.categoryId === categoryFilter);
      }
      
      // Filter by status if selected
      if (statusFilter !== 'all') {
        filteredData = filteredData.filter((p) => p.status === statusFilter);
      }

      // Select only specified columns and use Russian/Ukrainian labels as headers
      const exportData = filteredData.map((row) => {
        const filtered: Record<string, unknown> = {};
        selectedColumns.forEach((col) => {
          const columnDef = EXPORT_COLUMNS.find((c) => c.key === col);
          const label = columnDef?.label || col;
          filtered[label] = (row as Record<string, unknown>)[col];
        });
        return filtered;
      });

      // Convert to CSV
      const csv = Papa.unparse(exportData, {
        header: true,
      });

      // Download file
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      setExportComplete(true);
      toast.success(`Експортовано ${exportData.length} товарів`);
    } catch (error) {
      toast.error('Помилка експорту');
    } finally {
      setExporting(false);
    }
  };

  if (!canExport) {
    return (
      <div className="flex flex-col">
        <Header title="Експорт" />
        <div className="p-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-zinc-400">У вас немає прав для експорту даних</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Експорт товарів" />

      <div className="p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Filters */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Фільтри</CardTitle>
              <CardDescription className="text-zinc-500">
                Оберіть які товари експортувати
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Категорія</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Всі категорії" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem value="all" className="text-zinc-400 focus:text-white focus:bg-zinc-900">
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
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Статус</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Всі статуси" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem value="all" className="text-zinc-400 focus:text-white focus:bg-zinc-900">
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
            </CardContent>
          </Card>

          {/* Columns selection */}
          <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Колонки для експорту</CardTitle>
                  <CardDescription className="text-zinc-500">
                    Оберіть які поля включити в експорт
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-zinc-400 hover:text-white"
                  >
                    Всі
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectDefault}
                    className="text-zinc-400 hover:text-white"
                  >
                    За замовчуванням
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {EXPORT_COLUMNS.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm text-zinc-400 cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export button */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-k24-yellow/10">
                  <FileSpreadsheet className="h-6 w-6 text-k24-yellow" />
                </div>
                <div>
                  <p className="font-medium text-white">Готово до експорту</p>
                  <p className="text-sm text-zinc-500">
                    {selectedColumns.length} колонок обрано
                  </p>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={exporting || selectedColumns.length === 0}
                className="bg-k24-yellow hover:bg-k24-yellow text-black"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Експорт...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Експортувати в CSV
                  </>
                )}
              </Button>
            </div>

            {exportComplete && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-emerald-500">Експорт завершено успішно!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

