import * as XLSX from 'xlsx';

export const parseExcelFile = async (file: File): Promise<any[]> => {
  try {
    // Optimization: Use arrayBuffer which is faster and non-blocking in modern browsers
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert sheet to array of arrays to find the real header
    // limiting header scan to first 20 rows for performance
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 }) as any[][];
    
    if (rawRows.length === 0) {
      throw new Error("A planilha está vazia");
    }

    // Smart Header Detection (Optimized)
    let headerRowIndex = 0;
    let maxCols = 0;
    const scanLimit = Math.min(rawRows.length, 15); // Scan only first 15 rows for speed

    for (let i = 0; i < scanLimit; i++) {
      const row = rawRows[i];
      // Quick count of non-empty cells
      let filledCols = 0;
      for(let j=0; j<row.length; j++) {
        if(row[j] !== undefined && row[j] !== null && row[j] !== '') filledCols++;
      }
      
      if (filledCols > maxCols) {
        maxCols = filledCols;
        headerRowIndex = i;
      }
    }

    // Parse data using the detected header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      range: headerRowIndex,
      defval: "" 
    });
    
    return jsonData;
  } catch (error) {
    console.error("Excel Parse Error:", error);
    throw new Error("Falha ao ler o arquivo. Verifique se é um Excel válido.");
  }
};