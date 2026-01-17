"use client";

import {
  useCallback,
  useState,
} from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCategories } from '@/lib/hooks/useCategories';
import {
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_CATEGORY_NAME,
} from '@/lib/services/categories';
import { importProductsFromCSV } from '@/lib/services/products';
import {
  CSVProductRow,
  ImportResult,
} from '@/lib/types';
import { parseExcelProductImport } from '@/lib/utils/excel';

// Sample CSV template
const CSV_TEMPLATE = `partNumber,name,description,price,originalPrice,categoryId,status,brand,compatibility,condition,year,carBrand,carModel,metaTitle,metaDescription,metaKeywords,slug
63117442647,Фара передня ліва,Оригінальна фара для BMW X5,5000,6000,cat_001,in_stock,BMW,"BMW X5 2018-2022,BMW X6 2019-2022",used,2020,BMW,X5,Фара BMW X5 купити,Оригінальна фара для BMW X5 в наявності,фара bmw x5 купити київ,fara-bmw-x5`;

// Map Russian CSV headers to English field names
const RUSSIAN_HEADER_MAP: Record<string, string> = {
  "Код запчасти": "partNumber",
  Производитель: "brand",
  "Марка авто": "carBrand",
  "Описание запчасти": "name",
  Количество: "quantity",
  "Б/у": "isUsed",
  Цена: "price",
  "Старая цена": "originalPrice",
  "Категория ID": "categoryId",
  Статус: "status",
  "Номер запчасти": "partNumber",
  "Модель авто": "carModel",
  Совместимость: "compatibility",
  Состояние: "condition",
  Год: "year",
  Описание: "description",
  "Meta Title": "metaTitle",
  "Meta Description": "metaDescription",
  "Meta Keywords": "metaKeywords",
  "URL Slug": "slug",
};

// Map status values to valid ProductStatus
function normalizeStatus(status: string | undefined): string {
  if (!status) return "in_stock";

  const s = status.toLowerCase().trim();

  // In stock / available statuses
  if (
    s === "in_stock" ||
    s === "in stock" ||
    s === "instock" ||
    s === "on" ||
    s === "available" ||
    s === "да" ||
    s === "є" ||
    s === "в наявності" ||
    s === "в наличии" ||
    s === "есть" ||
    s === "1" ||
    s === "discounted" ||
    s === "discount" ||
    s === "sale" ||
    s === "акція" ||
    s === "акция" ||
    s === "знижка"
  ) {
    return "in_stock";
  }

  // On order statuses
  if (
    s === "on_order" ||
    s === "on order" ||
    s === "order" ||
    s === "під замовлення" ||
    s === "под заказ" ||
    s === "замовлення" ||
    s === "заказ"
  ) {
    return "on_order";
  }

  // Out of stock statuses
  if (
    s === "out_of_stock" ||
    s === "out of stock" ||
    s === "outofstock" ||
    s === "off" ||
    s === "unavailable" ||
    s === "нет" ||
    s === "немає" ||
    s === "нема" ||
    s === "відсутній" ||
    s === "0"
  ) {
    return "out_of_stock";
  }

  // Discontinued statuses
  if (
    s === "discontinued" ||
    s === "знято" ||
    s === "знято з виробництва" ||
    s === "снято" ||
    s === "снято с производства"
  ) {
    return "discontinued";
  }

  // Default to in_stock if not recognized
  return "in_stock";
}

// Convert Russian CSV row to English format
function mapRussianCSVRow(row: Record<string, string>): CSVProductRow {
  const mapped: Partial<CSVProductRow> & { isUsed?: string | number } = {};

  // Map headers from Russian to English
  Object.keys(row).forEach((key) => {
    const englishKey = RUSSIAN_HEADER_MAP[key] || key.toLowerCase();
    (mapped as Record<string, string | null>)[englishKey] = row[key];
  });

  // Normalize status value
  mapped.status = normalizeStatus(mapped.status as string | undefined);

  // Handle isUsed -> condition conversion
  if (mapped.isUsed !== undefined) {
    mapped.condition =
      mapped.isUsed === "1" || mapped.isUsed === "true" || mapped.isUsed === 1
        ? "used"
        : "new";
    delete mapped.isUsed;
  }

  // If condition is not set, use Состояние if available
  if (!mapped.condition && row["Состояние"]) {
    const conditionValue = row["Состояние"].toLowerCase();
    if (
      conditionValue === "used" ||
      conditionValue === "б/у" ||
      conditionValue === "бy"
    ) {
      mapped.condition = "used";
    } else if (
      conditionValue === "new" ||
      conditionValue === "новый" ||
      conditionValue === "новий"
    ) {
      mapped.condition = "new";
    } else {
      mapped.condition = conditionValue as "new" | "used" | "refurbished";
    }
  }

  // Ensure condition has a default value
  if (!mapped.condition) {
    mapped.condition = "used";
  }

  // Convert empty strings to null for optional fields
  const optionalFields: (keyof CSVProductRow)[] = [
    "originalPrice",
    "subcategoryId",
    "compatibility",
    "year",
    "carBrand",
    "carModel",
    "metaTitle",
    "metaDescription",
    "metaKeywords",
    "slug",
  ];
  optionalFields.forEach((field) => {
    if (mapped[field] === "") {
      (mapped as Record<string, string | null>)[field] = null;
    }
  });

  return mapped as CSVProductRow;
}

export default function ImportPage() {
  const { user, hasPermission } = useAuth();
  const { categories } = useCategories();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVProductRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState<string>(UNCATEGORIZED_CATEGORY_ID);
  const [importMode, setImportMode] = useState<'smart' | 'strict'>('smart');

  const canImport = hasPermission("canImportData");

  const validateRows = (rows: CSVProductRow[]) => {
    const errors: string[] = [];
    rows.forEach((row, index) => {
      if (!row.partNumber) errors.push(`Рядок ${index + 2}: Відсутній код запчастини`);
      if (!row.name) errors.push(`Рядок ${index + 2}: Відсутня назва`);
      if (!row.price) errors.push(`Рядок ${index + 2}: Відсутня ціна`);
    });
    return errors;
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setImportResult(null);
      setParseErrors([]);

      if (selectedFile.name.endsWith(".csv")) {
        // Parse CSV
        Papa.parse<Record<string, string>>(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Check if headers are in Russian
            const hasRussianHeaders = results.meta.fields?.some(
              (field) => RUSSIAN_HEADER_MAP[field] !== undefined
            );

            // Map rows if Russian headers detected, otherwise just normalize status
            const mappedData = hasRussianHeaders
              ? results.data.map(mapRussianCSVRow)
              : (results.data as unknown as CSVProductRow[]).map((row) => ({
                ...row,
                status: normalizeStatus(row.status),
              }));

            const errors = validateRows(mappedData);
            setParseErrors(errors);
            setParsedData(mappedData);

            if (errors.length === 0) {
              toast.success(`Знайдено ${mappedData.length} товарів`);
            } else {
              toast.warning(
                `Знайдено ${mappedData.length} товарів з ${errors.length} помилками`
              );
            }
          },
          error: (error) => {
            toast.error(`Помилка парсингу: ${error.message}`);
          },
        });
      } else if (selectedFile.name.endsWith(".xlsx")) {
        // Parse Excel
        try {
          const rawRows = await parseExcelProductImport(selectedFile);
          // Normalize status values
          const rows = rawRows.map((row) => ({
            ...row,
            status: normalizeStatus(row.status),
          }));
          const errors = validateRows(rows);
          setParseErrors(errors);
          setParsedData(rows);

          if (errors.length === 0) {
            toast.success(`Знайдено ${rows.length} товарів`);
          } else {
            toast.warning(
              `Знайдено ${rows.length} товарів з ${errors.length} помилками`
            );
          }
        } catch (error) {
          toast.error("Помилка читання Excel файлу");
          console.error(error);
        }
      } else {
        toast.error("Будь ласка, оберіть файл CSV або XLSX");
        setFile(null);
      }
    },
    []
  );

  const handleImport = async () => {
    if (!user || parsedData.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      // Apply default category to rows that don't have one
      const dataToImport = parsedData.map((row) => ({
        ...row,
        categoryId: row.categoryId || defaultCategory,
      }));

      const result = await importProductsFromCSV(dataToImport, user.id, importMode);

      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);

      const deletedCount = result.deleted || 0;
      if (result.failed === 0) {
        if (deletedCount > 0) {
          toast.success(
            `Імпортовано ${result.success} нових, оновлено ${result.updated}, видалено ${deletedCount}`
          );
        } else {
          toast.success(
            `Імпортовано ${result.success} нових, оновлено ${result.updated}`
          );
        }
      } else {
        toast.warning(
          `Імпортовано ${result.success}, оновлено ${result.updated}${deletedCount > 0 ? `, видалено ${deletedCount}` : ''}, помилок: ${result.failed}`
        );
      }
    } catch (error) {
      toast.error("Помилка імпорту");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products_template.csv";
    link.click();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setParseErrors([]);
    setProgress(0);
    setDefaultCategory(UNCATEGORIZED_CATEGORY_ID);
  };

  if (!canImport) {
    return (
      <div className="flex flex-col">
        <Header title="Імпорт" />
        <div className="p-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-zinc-400">
                У вас немає прав для імпорту даних
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Імпорт товарів" />

      <div className="p-6 space-y-6">
        {/* Instructions */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-500" />
              Інструкція
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">
                    Завантажте шаблон або Excel файл
                  </p>
                  <p className="text-sm text-zinc-500">
                    Підтримуються формати CSV та XLSX
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">Оберіть файл</p>
                  <p className="text-sm text-zinc-500">
                    Завантажте файл з товарами
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Імпортуйте</p>
                  <p className="text-sm text-zinc-500">
                    Перевірте та імпортуйте товари
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="border-zinc-800 text-zinc-400 hover:text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Завантажити CSV шаблон
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload area */}
        {!importResult && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              {!file ? (
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors"
                >
                  <Upload className="h-12 w-12 text-zinc-500 mb-4" />
                  <span className="text-lg font-medium text-white">
                    Оберіть файл (CSV, XLSX)
                  </span>
                  <span className="text-sm text-zinc-500 mt-2">
                    або перетягніть його сюди
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <div className="space-y-6">
                  {/* File info */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-10 w-10 text-amber-500" />
                      <div>
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-zinc-500">
                          {(file.size / 1024).toFixed(2)} KB •{" "}
                          {parsedData.length} товарів
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="text-zinc-400 hover:text-white"
                    >
                      Обрати інший
                    </Button>
                  </div>

                  {/* Import Mode Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Режим імпорту
                    </label>
                    <Select
                      value={importMode}
                      onValueChange={(value: 'smart' | 'strict') => setImportMode(value)}
                    >
                      <SelectTrigger className="w-full sm:w-80 bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800">
                        <SelectItem
                          value="smart"
                          className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                        >
                          Розумний (додає нові, оновлює існуючі)
                        </SelectItem>
                        <SelectItem
                          value="strict"
                          className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                        >
                          Строгий (видаляє товари, яких немає в таблиці)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-500">
                      {importMode === 'smart' 
                        ? 'Додає нові товари та оновлює існуючі за кодом запчастини'
                        : 'Повне співвідношення: імпортує товари з таблиці і видаляє ті, яких немає'}
                    </p>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Категорія за замовчуванням (для товарів без категорії)
                    </label>
                    <Select
                      value={defaultCategory}
                      onValueChange={setDefaultCategory}
                    >
                      <SelectTrigger className="w-full sm:w-80 bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue placeholder="Оберіть категорію" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800">
                        <SelectItem
                          value={UNCATEGORIZED_CATEGORY_ID}
                          className="text-amber-400 focus:text-amber-300 focus:bg-zinc-900"
                        >
                          {UNCATEGORIZED_CATEGORY_NAME}
                        </SelectItem>
                        {categories
                          .filter((cat) => cat.id !== UNCATEGORIZED_CATEGORY_ID)
                          .map((cat) => (
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

                  {/* Parse results */}
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="bg-zinc-800">
                      <TabsTrigger
                        value="preview"
                        className="data-[state=active]:bg-zinc-700"
                      >
                        Попередній перегляд ({parsedData.length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="errors"
                        className="data-[state=active]:bg-zinc-700"
                      >
                        Помилки ({parseErrors.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      <ScrollArea className="h-64 rounded-lg border border-zinc-800">
                        <div className="p-4 space-y-2">
                          {parsedData.map((row, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-zinc-800/30 rounded"
                            >
                              <div>
                                <span className="font-mono text-xs text-amber-500 mr-2">
                                  {row.partNumber}
                                </span>
                                <span className="text-white">{row.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-zinc-400">
                                  {row.price} ₴
                                </span>
                                {row.status === "in_stock" || row.status === "on_order" ? (
                                  <span className="text-emerald-500 text-xs">
                                    {row.status === "in_stock" ? "В наявності" : "Під замовлення"}
                                  </span>
                                ) : row.status === "discontinued" ? (
                                  <span className="text-amber-500 text-xs">
                                    Знято з виробництва
                                  </span>
                                ) : row.status === "out_of_stock" ? (
                                  <span className="text-red-500 text-xs">
                                    Немає в наявності
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 text-xs">
                                    {row.status || "—"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="errors" className="mt-4">
                      <ScrollArea className="h-64 rounded-lg border border-zinc-800">
                        <div className="p-4 space-y-2">
                          {parseErrors.length > 0 ? (
                            parseErrors.map((error, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded"
                              >
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                <span className="text-red-400 text-sm">
                                  {error}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-8 text-emerald-500">
                              <CheckCircle className="h-5 w-5" />
                              <span>Помилок не знайдено</span>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>

                  {/* Import progress */}
                  {importing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Імпорт...</span>
                        <span className="text-white">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      Скасувати
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importing || parseErrors.length > 0}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Імпорт...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Імпортувати {parsedData.length} товарів
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import result */}
        {importResult && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Імпорт завершено
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`grid gap-4 ${importResult.deleted ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-emerald-500">
                    {importResult.success}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">Створено</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-500">
                    {importResult.updated}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">Оновлено</p>
                </div>
                {importResult.deleted ? (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
                    <p className="text-3xl font-bold text-orange-500">
                      {importResult.deleted}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">Видалено</p>
                  </div>
                ) : null}
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-500">
                    {importResult.failed}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">Помилок</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-2">
                    Помилки:
                  </p>
                  <ScrollArea className="h-32 rounded-lg border border-zinc-800">
                    <div className="p-4 space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-red-400"
                        >
                          <XCircle className="h-4 w-4 shrink-0" />
                          Рядок {error.row}: {error.message}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Button
                onClick={handleReset}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                Імпортувати ще
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
