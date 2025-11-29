/**
 * Parse Excel/Google Sheets pasted text into rows and columns
 * 
 * Supports both tab-separated (Excel) and comma-separated (CSV) formats
 * Handles quoted fields in CSV format
 */

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

/**
 * Parse CSV line with quoted fields support
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if ((char === "," || char === "\t") && !inQuotes) {
      // Field separator (comma or tab)
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Detect if text is CSV (comma-separated) or TSV (tab-separated)
 */
function detectFormat(text: string): "csv" | "tsv" {
  const firstLine = text.split(/\r?\n/)[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  // If more commas than tabs, it's CSV
  return commaCount > tabCount ? "csv" : "tsv";
}

/**
 * Parse pasted Excel/CSV text into structured data
 * 
 * @param text - Pasted text from Excel/Google Sheets (tab or comma-separated)
 * @returns Parsed data with headers and rows, or null if parsing fails
 */
export function parseExcelText(text: string): ParsedData | null {
  if (!text || !text.trim()) {
    return null;
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  
  if (lines.length === 0) {
    return null;
  }

  // Detect format
  const format = detectFormat(text);
  
  // Find header row (skip summary rows)
  // Look for the row that contains "GSTIN/UIN of Recipient" and "Invoice Number"
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    const cells = format === "csv" ? parseCSVLine(line) : line.split(/\t/);
    const lineLower = cells.join(" ").toLowerCase();
    
    // Skip summary rows - they contain "summary", "total", "no. of" but not the actual headers
    if (lineLower.includes("summary") || 
        (lineLower.includes("no. of") && !lineLower.includes("invoice number")) ||
        (lineLower.includes("total") && !lineLower.includes("taxable value"))) {
      continue;
    }
    
    // Look for the actual header row - must have BOTH "gstin" (or "uin") AND "invoice number"
    const hasGstin = lineLower.includes("gstin") || lineLower.includes("uin");
    const hasInvoiceNumber = lineLower.includes("invoice") && (lineLower.includes("number") || lineLower.includes("no"));
    const hasInvoiceDate = lineLower.includes("invoice") && lineLower.includes("date");
    const hasPlaceOfSupply = lineLower.includes("place") && lineLower.includes("supply");
    const hasRate = lineLower.includes("rate");
    
    // This is the header row if it has GSTIN/UIN AND Invoice Number AND Invoice Date
    if (hasGstin && hasInvoiceNumber && hasInvoiceDate && cells.length >= 8) {
      headerRowIndex = i;
      break;
    }
  }
  
  // Fallback: if we didn't find it, look for any row with invoice number and date
  if (headerRowIndex === -1) {
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];
      const cells = format === "csv" ? parseCSVLine(line) : line.split(/\t/);
      const lineLower = cells.join(" ").toLowerCase();
      
      const hasInvoiceNumber = lineLower.includes("invoice") && (lineLower.includes("number") || lineLower.includes("no"));
      const hasInvoiceDate = lineLower.includes("invoice") && lineLower.includes("date");
      
      if (hasInvoiceNumber && hasInvoiceDate && cells.length >= 5) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  // If still not found, use first row
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  // Parse headers
  const headerLine = lines[headerRowIndex];
  const headers = (format === "csv" 
    ? parseCSVLine(headerLine)
    : headerLine.split(/\t/)
  ).map((h) => h.trim().replace(/^"|"$/g, "")); // Remove surrounding quotes
  
  if (headers.length === 0) {
    return null;
  }

  // Remaining lines are data rows
  const rows: string[][] = [];
  
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cells = (format === "csv"
      ? parseCSVLine(line)
      : line.split(/\t/)
    ).map((c) => c.trim().replace(/^"|"$/g, "")); // Remove surrounding quotes
    
    // Pad or truncate to match header count
    while (cells.length < headers.length) {
      cells.push("");
    }
    rows.push(cells.slice(0, headers.length));
  }

  return {
    headers,
    rows,
  };
}

/**
 * Validate that parsed data has the expected structure
 */
export function validateParsedData(data: ParsedData | null): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: "No data to parse" };
  }

  if (data.headers.length === 0) {
    return { valid: false, error: "No headers found" };
  }

  if (data.rows.length === 0) {
    return { valid: false, error: "No data rows found" };
  }

  // Check that all rows have the same number of columns as headers
  const headerCount = data.headers.length;
  for (let i = 0; i < data.rows.length; i++) {
    if (data.rows[i].length !== headerCount) {
      return {
        valid: false,
        error: `Row ${i + 2} has ${data.rows[i].length} columns, expected ${headerCount}`,
      };
    }
  }

  return { valid: true };
}
