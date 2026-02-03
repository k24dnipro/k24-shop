import * as XLSX from 'xlsx';
import { CSVProductRow } from '../types';

// Helper to get value from row with multiple possible column names (RU/UA)
function getField(r: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (r[key] !== undefined && r[key] !== null && r[key] !== '') {
      return String(r[key]).trim();
    }
  }
  return '';
}

export async function parseExcelProductImport(file: File): Promise<CSVProductRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map to CSVProductRow
        const rows: CSVProductRow[] = jsonData.map((row: unknown) => {
          const r = row as Record<string, unknown>;
          
          // Support both Russian (original Excel) and Ukrainian (export) column names
          const partNumber = getField(r, 'Код запчасти', 'Код запчастини', 'Номер запчастини');
          const name = getField(r, 'Описание запчасти', 'Опис запчастини');
          const brand = getField(r, 'Производитель', 'Виробник');
          const price = getField(r, 'Цена', 'Ціна') || '0';
          const quantityStr = getField(r, 'Количество', 'Кількість');
          const quantity = Number(quantityStr);
          const usedVal = r['Б/у'] ?? r['Б/в'];
          const isUsed = usedVal == 1 || usedVal === '1';
          
          // Additional columns from export
          const originalPrice = getField(r, 'Стара ціна');
          const categoryId = getField(r, 'Категорія ID', 'Категория ID', 'categoryId');
          const subcategoryId = getField(r, 'Підкатегорія ID', 'Подкатегория ID', 'subcategoryId');
          const status = getField(r, 'Статус');
          const carBrand = getField(r, 'Марка авто');
          const carModel = getField(r, 'Модель авто');
          const compatibility = getField(r, 'Сумісність');
          const condition = getField(r, 'Стан');
          const oem = getField(r, 'OEM', 'Оригінальний номер', 'Оригінальний номер (OEM)');
          const description = getField(r, 'Опис') || name;
          const metaTitle = getField(r, 'Meta Title') || name;
          const metaDescription = getField(r, 'Meta Description') || name;
          const metaKeywords = getField(r, 'Meta Keywords') || `${brand}, ${partNumber}, ${name}`;
          const slug = getField(r, 'URL Slug') || (partNumber ? partNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');

          // Determine status from quantity if not explicitly set
          const finalStatus = status || ((!isNaN(quantity) && quantity > 0) ? 'in_stock' : 'out_of_stock');
          
          // Determine condition from isUsed if not explicitly set
          const finalCondition = condition || (isUsed ? 'used' : 'new');

          return {
            partNumber,
            name,
            description,
            price,
            brand,
            status: finalStatus,
            condition: finalCondition,
            categoryId,
            slug,
            originalPrice: originalPrice || null,
            subcategoryId: subcategoryId || null,
            compatibility,
            oem: oem || null,
            carBrand: carBrand || null,
            carModel: carModel || null,
            metaTitle,
            metaDescription,
            metaKeywords,
          };
        });

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
