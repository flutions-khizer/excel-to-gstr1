/**
 * Convert parsed Excel rows to GSTR-1 JSON format
 */

import type { GSTR1, B2B, Invoice, InvoiceItem } from "./gstr1Types";
import type { ColumnMapping, LogicalField } from "./mappingTypes";
import type { ParsedData } from "./parseExcelText";

/**
 * State code mapping (common states)
 */
const STATE_CODE_MAP: Record<string, string> = {
  "andhra pradesh": "37",
  "arunachal pradesh": "12",
  "assam": "18",
  "bihar": "10",
  "chhattisgarh": "22",
  "goa": "30",
  "gujarat": "24",
  "haryana": "06",
  "himachal pradesh": "02",
  "jharkhand": "20",
  "karnataka": "29",
  "ka": "29",
  "kerala": "32",
  "madhya pradesh": "23",
  "maharashtra": "27",
  "manipur": "14",
  "meghalaya": "17",
  "mizoram": "15",
  "nagaland": "13",
  "odisha": "21",
  "punjab": "03",
  "rajasthan": "08",
  "sikkim": "11",
  "tamil nadu": "33",
  "telangana": "36",
  "tripura": "16",
  "uttar pradesh": "09",
  "uttarakhand": "05",
  "west bengal": "19",
  "delhi": "07",
  "jammu and kashmir": "01",
  "ladakh": "38",
  "puducherry": "34",
  "andaman and nicobar": "35",
  "chandigarh": "04",
  "dadra and nagar haveli": "26",
  "daman and diu": "25",
  "lakshadweep": "31",
};

/**
 * Normalize state code
 * Handles formats like "33", "33-Tamil Nadu", "Tamil Nadu"
 */
function normalizeStateCode(pos: string): string {
  const trimmed = pos.trim();
  
  // Extract state code from "33-Tamil Nadu" format
  const match = trimmed.match(/^(\d{2})-/);
  if (match) {
    return match[1];
  }
  
  // If it's already a numeric code (2 digits), return as is
  if (/^\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try to find in state code map (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase();
  const code = STATE_CODE_MAP[lowerTrimmed];
  if (code) {
    return code;
  }
  
  // If it's a 2-letter code, try uppercase
  if (trimmed.length === 2) {
    const upperCode = STATE_CODE_MAP[trimmed.toUpperCase()];
    if (upperCode) {
      return upperCode;
    }
  }
  
  // Return as is if we can't map it
  return trimmed;
}

/**
 * Month name to number mapping
 */
const MONTH_MAP: Record<string, number> = {
  "jan": 1, "january": 1,
  "feb": 2, "february": 2,
  "mar": 3, "march": 3,
  "apr": 4, "april": 4,
  "may": 5,
  "jun": 6, "june": 6,
  "jul": 7, "july": 7,
  "aug": 8, "august": 8,
  "sep": 9, "september": 9,
  "oct": 10, "october": 10,
  "nov": 11, "november": 11,
  "dec": 12, "december": 12,
};

/**
 * Normalize date to DD-MM-YYYY format
 * Handles formats like: DD/MM/YYYY, DD-MM-YYYY, DD/MMM/YY, DD-MMM-YY, etc.
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) {
    throw new Error("Empty date");
  }

  const trimmed = dateStr.trim();
  
  // Check if it's already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Try DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed.replace(/\//g, "-");
  }
  
  // Try DD/MMM/YY or DD-MMM-YY (e.g., "01/Oct/25" or "1-Oct-25")
  const monthNameMatch = trimmed.match(/^(\d{1,2})[\/\-]([A-Za-z]{3,})[\/\-](\d{2,4})$/);
  if (monthNameMatch) {
    const day = parseInt(monthNameMatch[1], 10);
    const monthName = monthNameMatch[2].toLowerCase();
    const yearStr = monthNameMatch[3];
    
    const month = MONTH_MAP[monthName];
    if (month) {
      // Handle 2-digit year (assume 20XX for years < 50, 19XX otherwise)
      let year = parseInt(yearStr, 10);
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
      
      return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
    }
  }
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Try parsing as Date object
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  // If all else fails, return as is
  return trimmed;
}

/**
 * Parse number, handling commas and other formatting
 */
function parseNumber(value: string): number {
  if (!value || !value.trim()) {
    return 0;
  }
  
  // Remove commas and other formatting
  const cleaned = value.replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse reverse charge value
 */
function parseReverseCharge(value: string): "Y" | "N" {
  if (!value || !value.trim()) {
    return "N";
  }
  
  const upper = value.trim().toUpperCase();
  if (upper === "Y" || upper === "YES" || upper === "TRUE" || upper === "1") {
    return "Y";
  }
  
  return "N";
}

/**
 * Get cell value from a row using column mapping
 */
function getCellValue(
  row: string[],
  mapping: ColumnMapping,
  field: LogicalField
): string {
  const columnIndex = mapping[field];
  if (columnIndex === undefined || columnIndex < 0 || columnIndex >= row.length) {
    return "";
  }
  return row[columnIndex] || "";
}

/**
 * Validation error
 */
export interface ValidationError {
  row: number; // 1-based row number (including header)
  field: string;
  message: string;
}

/**
 * Extract state code from GSTIN (first 2 digits after first 2 characters)
 */
function getStateCodeFromGSTIN(gstin: string): string {
  if (gstin.length >= 2) {
    return gstin.substring(0, 2);
  }
  return "";
}

/**
 * Calculate taxes based on taxable value and rate
 */
function calculateTaxes(
  taxableValue: number,
  rate: number,
  supplierState: string,
  posState: string
): { igst: number; cgst: number; sgst: number } {
  const totalTax = (taxableValue * rate) / 100;
  
  // If supplier state matches POS, it's intra-state (CGST + SGST)
  // Otherwise, it's inter-state (IGST)
  const isIntraState = supplierState === posState;
  
  if (isIntraState) {
    // CGST and SGST are each half of the total tax
    const cgstSgst = totalTax / 2;
    return {
      igst: 0,
      cgst: Math.round(cgstSgst * 100) / 100, // Round to 2 decimal places
      sgst: Math.round(cgstSgst * 100) / 100,
    };
  } else {
    return {
      igst: Math.round(totalTax * 100) / 100,
      cgst: 0,
      sgst: 0,
    };
  }
}

/**
 * Convert parsed data to GSTR-1 JSON
 */
export function convertToGSTR1(
  parsedData: ParsedData,
  mapping: ColumnMapping,
  meta: {
    gstin: string;
    fp: string;
    version?: string;
  }
): { gstr1: GSTR1; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const requiredFields: LogicalField[] = [
    "invoiceNumber",
    "invoiceDate",
    "invoiceValue",
    "placeOfSupply",
    "taxableValue",
    "rate",
  ];
  
  // Get supplier state code from GSTIN
  const supplierState = getStateCodeFromGSTIN(meta.gstin);
  
  // If mapping is incomplete, try to auto-map directly from headers
  let finalMapping = { ...mapping };
  const missingFields = requiredFields.filter(field => finalMapping[field] === undefined);
  
  if (missingFields.length > 0) {
    // Try to map missing fields directly from headers
    parsedData.headers.forEach((header, index) => {
      const normalized = header.trim().toLowerCase().replace(/[\/\-]/g, " ").replace(/\s+/g, " ");
      
      if (!finalMapping.invoiceNumber && normalized.includes("invoice") && normalized.includes("number")) {
        finalMapping.invoiceNumber = index;
      }
      if (!finalMapping.invoiceDate && normalized.includes("invoice") && normalized.includes("date")) {
        finalMapping.invoiceDate = index;
      }
      if (!finalMapping.invoiceValue && normalized.includes("invoice") && normalized.includes("value") && !normalized.includes("taxable")) {
        finalMapping.invoiceValue = index;
      }
      if (!finalMapping.placeOfSupply && normalized.includes("place") && normalized.includes("supply")) {
        finalMapping.placeOfSupply = index;
      }
      if (!finalMapping.taxableValue && normalized.includes("taxable") && normalized.includes("value")) {
        finalMapping.taxableValue = index;
      }
      if (!finalMapping.rate && (normalized === "rate" || (normalized.includes("rate") && !normalized.includes("applicable") && !normalized.includes("tax")))) {
        finalMapping.rate = index;
      }
      if (!finalMapping.gstinOfRecipient && (normalized.includes("gstin") || normalized.includes("uin")) && (normalized.includes("recipient") || normalized.includes("receiver"))) {
        finalMapping.gstinOfRecipient = index;
      }
      if (!finalMapping.reverseCharge && normalized.includes("reverse") && normalized.includes("charge")) {
        finalMapping.reverseCharge = index;
      }
    });
  }
  
  // Validate mappings again after auto-fix
  for (const field of requiredFields) {
    if (finalMapping[field] === undefined) {
      errors.push({
        row: 0,
        field,
        message: `Required field "${field}" is not mapped to any column. Available headers: ${parsedData.headers.join(", ")}`,
      });
    }
  }

  if (errors.length > 0) {
    return {
      gstr1: {
        gstin: meta.gstin,
        fp: meta.fp,
        version: meta.version || "GST3.2.3",
        hash: "hash",
        b2b: [],
      },
      errors,
    };
  }
  
  // Use the final mapping
  mapping = finalMapping;

  // Process rows
  const b2bMap = new Map<string, B2B>(); // Key: recipient GSTIN

  for (let i = 0; i < parsedData.rows.length; i++) {
    const row = parsedData.rows[i];
    const rowNum = i + 2; // +2 because row 1 is header, and we're 0-indexed

    try {
      // Extract values
      const invoiceNumber = getCellValue(row, mapping, "invoiceNumber");
      const invoiceDate = getCellValue(row, mapping, "invoiceDate");
      const invoiceValue = getCellValue(row, mapping, "invoiceValue");
      const placeOfSupply = getCellValue(row, mapping, "placeOfSupply");
      const gstinOfRecipient = getCellValue(row, mapping, "gstinOfRecipient");
      const taxableValue = getCellValue(row, mapping, "taxableValue");
      const rate = getCellValue(row, mapping, "rate");
      const igstAmount = getCellValue(row, mapping, "igstAmount");
      const cgstAmount = getCellValue(row, mapping, "cgstAmount");
      const sgstAmount = getCellValue(row, mapping, "sgstAmount");
      const reverseCharge = getCellValue(row, mapping, "reverseCharge");
      const invoiceType = getCellValue(row, mapping, "invoiceType");
      const cessAmount = getCellValue(row, mapping, "cessAmount");

      // Validate required fields
      if (!invoiceNumber.trim()) {
        errors.push({ row: rowNum, field: "invoiceNumber", message: "Invoice number is required" });
        continue;
      }
      if (!invoiceDate.trim()) {
        errors.push({ row: rowNum, field: "invoiceDate", message: "Invoice date is required" });
        continue;
      }
      if (!taxableValue.trim() || parseNumber(taxableValue) === 0) {
        errors.push({ row: rowNum, field: "taxableValue", message: "Taxable value is required and must be > 0" });
        continue;
      }
      if (!placeOfSupply.trim()) {
        errors.push({ row: rowNum, field: "placeOfSupply", message: "Place of supply is required" });
        continue;
      }
      if (!rate.trim() || parseNumber(rate) === 0) {
        errors.push({ row: rowNum, field: "rate", message: "GST rate is required and must be > 0" });
        continue;
      }

      // Normalize values
      const normalizedDate = normalizeDate(invoiceDate);
      const normalizedPos = normalizeStateCode(placeOfSupply);
      const numInvoiceValue = parseNumber(invoiceValue);
      const numTaxableValue = parseNumber(taxableValue);
      const numRate = parseNumber(rate);
      const numCess = parseNumber(cessAmount);
      const rchrg = parseReverseCharge(reverseCharge);
      
      // Calculate taxes if not provided, or use provided values
      let numIgst = parseNumber(igstAmount);
      let numCgst = parseNumber(cgstAmount);
      let numSgst = parseNumber(sgstAmount);
      
      // If taxes are not provided or are zero, calculate them
      if ((numIgst === 0 && numCgst === 0 && numSgst === 0) || 
          (!igstAmount && !cgstAmount && !sgstAmount)) {
        const calculated = calculateTaxes(numTaxableValue, numRate, supplierState, normalizedPos);
        numIgst = calculated.igst;
        numCgst = calculated.cgst;
        numSgst = calculated.sgst;
      }
      
      // Determine invoice type code
      let invTyp = "R"; // Default to Regular
      if (invoiceType) {
        const typeLower = invoiceType.toLowerCase();
        if (typeLower.includes("regular")) {
          invTyp = "R";
        } else if (typeLower.includes("sez")) {
          invTyp = "SEZWP";
        } else if (typeLower.includes("deemed")) {
          invTyp = "DE";
        }
      }

      // Determine if B2B or B2C
      const isB2B = gstinOfRecipient.trim().length > 0;

      if (isB2B) {
        // B2B processing
        const recipientGstin = gstinOfRecipient.trim().toUpperCase();
        
        // Get or create B2B record for this recipient
        let b2bRecord = b2bMap.get(recipientGstin);
        if (!b2bRecord) {
          b2bRecord = {
            ctin: recipientGstin,
            inv: [],
          };
          b2bMap.set(recipientGstin, b2bRecord);
        }

        // Find or create invoice
        const invoiceKey = `${invoiceNumber}_${normalizedDate}`;
        let invoice = b2bRecord.inv.find(
          (inv) => inv.inum === invoiceNumber && inv.idt === normalizedDate
        );

        if (!invoice) {
          invoice = {
            inum: invoiceNumber,
            idt: normalizedDate,
            val: numInvoiceValue,
            pos: normalizedPos,
            rchrg,
            inv_typ: invTyp,
            itms: [],
          };
          b2bRecord.inv.push(invoice);
        }

        // Add item (use 1801 as item number for first item, sequential for additional items)
        const itemNum = invoice.itms.length === 0 ? 1801 : invoice.itms.length + 1;
        invoice.itms.push({
          num: itemNum,
          itm_det: {
            txval: numTaxableValue,
            rt: numRate,
            camt: numCgst > 0 ? Math.round(numCgst * 100) / 100 : undefined,
            samt: numSgst > 0 ? Math.round(numSgst * 100) / 100 : undefined,
            igst: numIgst > 0 ? Math.round(numIgst * 100) / 100 : undefined,
            csamt: numCess > 0 ? Math.round(numCess * 100) / 100 : 0,
          },
        });
      } else {
        // B2C invoices are not supported - skip them
        // You can add B2C processing here if needed in the future
      }
    } catch (error) {
      errors.push({
        row: rowNum,
        field: "general",
        message: error instanceof Error ? error.message : "Unknown error processing row",
      });
    }
  }

  // Build final GSTR-1 object
  const gstr1: GSTR1 = {
    gstin: meta.gstin,
    fp: meta.fp,
    version: meta.version || "GST3.2.3",
    hash: "hash",
    b2b: Array.from(b2bMap.values()),
  };

  return { gstr1, errors };
}

