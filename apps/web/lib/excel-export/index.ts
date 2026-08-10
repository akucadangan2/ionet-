// lib/excel-export/index.ts
import ExcelJS from "exceljs";
import fs from "fs";

export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    throw new Error("Data kosong, tidak ada yang di-export");
  }

  // Header dari key object pertama
  const headers = Object.keys(data[0]);
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };

  // Isi data
  data.forEach((row) => {
    sheet.addRow(headers.map((h) => row[h]));
  });

  // Auto-width kolom sederhana
  sheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer; // dikirim sebagai response file di API route
}