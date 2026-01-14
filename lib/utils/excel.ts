import * as XLSX from 'xlsx';
import { CSVProductRow } from '../types';

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
          const sku = String(r['Код запчасти'] || '').trim();
          const name = String(r['Описание запчасти'] || '').trim();
          const brand = String(r['Производитель'] || '').trim();
          const price = String(r['Цена'] || '0');
          const quantity = Number(r['Количество']);
          const isUsed = r['Б/у'] == 1 || r['Б/у'] === '1';

          return {
            sku,
            name,
            description: name, // Use name as description initially
            price,
            brand,
            partNumber: sku,
            status: (!isNaN(quantity) && quantity > 0) ? 'in_stock' : 'out_of_stock',
            condition: isUsed ? 'used' : 'new',
            categoryId: '', // To be filled by user or default
            slug: sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            // Optional fields
            originalPrice: '',
            subcategoryId: '',
            oem: '',
            compatibility: '',
            year: '',
            carBrand: '',
            carModel: '',
            metaTitle: name,
            metaDescription: name,
            metaKeywords: `${brand}, ${sku}, ${name}`,
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
