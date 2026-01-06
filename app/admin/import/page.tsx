'use client';

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { importProductsFromCSV } from '@/lib/services/products';
import {
  CSVProductRow,
  ImportResult,
} from '@/lib/types';

// Sample CSV template
const CSV_TEMPLATE = `sku,name,description,price,originalPrice,categoryId,status,brand,partNumber,oem,compatibility,condition,year,carBrand,carModel,metaTitle,metaDescription,metaKeywords,slug
SKU001,Фара передня ліва,Оригінальна фара для BMW X5,5000,6000,cat_001,in_stock,BMW,63117442647,"123456,789012","BMW X5 2018-2022,BMW X6 2019-2022",used,2020,BMW,X5,Фара BMW X5 купити,Оригінальна фара для BMW X5 в наявності,фара bmw x5 купити київ,fara-bmw-x5`;

export default function ImportPage() {
  const { user, hasPermission } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVProductRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const canImport = hasPermission('canImportData');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Будь ласка, оберіть файл CSV');
      return;
    }

    setFile(selectedFile);
    setImportResult(null);
    setParseErrors([]);

    // Parse CSV
    Papa.parse<CSVProductRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        
        // Validate required fields
        results.data.forEach((row, index) => {
          if (!row.sku) errors.push(`Рядок ${index + 2}: Відсутній SKU`);
          if (!row.name) errors.push(`Рядок ${index + 2}: Відсутня назва`);
          if (!row.price) errors.push(`Рядок ${index + 2}: Відсутня ціна`);
        });

        setParseErrors(errors);
        setParsedData(results.data);

        if (errors.length === 0) {
          toast.success(`Знайдено ${results.data.length} товарів`);
        } else {
          toast.warning(`Знайдено ${results.data.length} товарів з ${errors.length} помилками`);
        }
      },
      error: (error) => {
        toast.error(`Помилка парсингу: ${error.message}`);
      },
    });
  }, []);

  const handleImport = async () => {
    if (!user || parsedData.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await importProductsFromCSV(parsedData, user.id);
      
      clearInterval(progressInterval);
      setProgress(100);
      setImportResult(result);

      if (result.failed === 0) {
        toast.success(`Імпортовано ${result.success} нових, оновлено ${result.updated} товарів`);
      } else {
        toast.warning(`Імпортовано ${result.success}, оновлено ${result.updated}, помилок: ${result.failed}`);
      }
    } catch (error) {
      toast.error('Помилка імпорту');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products_template.csv';
    link.click();
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setParseErrors([]);
    setProgress(0);
  };

  if (!canImport) {
    return (
      <div className="flex flex-col">
        <Header title="Імпорт" />
        <div className="p-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-zinc-400">У вас немає прав для імпорту даних</p>
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
                  <p className="font-medium text-white">Завантажте шаблон</p>
                  <p className="text-sm text-zinc-500">Скачайте CSV шаблон та заповніть дані</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">Оберіть файл</p>
                  <p className="text-sm text-zinc-500">Завантажте заповнений CSV файл</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">Імпортуйте</p>
                  <p className="text-sm text-zinc-500">Перевірте та імпортуйте товари</p>
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
                Завантажити шаблон
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
                  htmlFor="csv-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors"
                >
                  <Upload className="h-12 w-12 text-zinc-500 mb-4" />
                  <span className="text-lg font-medium text-white">Оберіть CSV файл</span>
                  <span className="text-sm text-zinc-500 mt-2">або перетягніть його сюди</span>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
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
                          {(file.size / 1024).toFixed(2)} KB • {parsedData.length} товарів
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

                  {/* Parse results */}
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="bg-zinc-800">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-zinc-700">
                        Попередній перегляд ({parsedData.length})
                      </TabsTrigger>
                      <TabsTrigger value="errors" className="data-[state=active]:bg-zinc-700">
                        Помилки ({parseErrors.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      <ScrollArea className="h-64 rounded-lg border border-zinc-800">
                        <div className="p-4 space-y-2">
                          {parsedData.slice(0, 10).map((row, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-zinc-800/30 rounded"
                            >
                              <div>
                                <span className="font-mono text-xs text-amber-500 mr-2">
                                  {row.sku}
                                </span>
                                <span className="text-white">{row.name}</span>
                              </div>
                              <span className="text-zinc-400">{row.price} ₴</span>
                            </div>
                          ))}
                          {parsedData.length > 10 && (
                            <p className="text-center text-zinc-500 py-2">
                              ...та ще {parsedData.length - 10} товарів
                            </p>
                          )}
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
                                <span className="text-red-400 text-sm">{error}</span>
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-emerald-500">{importResult.success}</p>
                  <p className="text-sm text-zinc-400 mt-1">Створено</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-500">{importResult.updated}</p>
                  <p className="text-sm text-zinc-400 mt-1">Оновлено</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                  <p className="text-3xl font-bold text-red-500">{importResult.failed}</p>
                  <p className="text-sm text-zinc-400 mt-1">Помилок</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-2">Помилки:</p>
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

