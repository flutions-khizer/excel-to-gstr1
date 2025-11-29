/**
 * Types for column mapping and logical fields
 */

/**
 * Logical fields that need to be mapped from Excel columns
 */
export type LogicalField =
  | "invoiceNumber"
  | "invoiceDate"
  | "invoiceValue"
  | "placeOfSupply"
  | "gstinOfRecipient"
  | "taxableValue"
  | "rate"
  | "igstAmount"
  | "cgstAmount"
  | "sgstAmount"
  | "reverseCharge"
  | "invoiceType"
  | "cessAmount";

/**
 * Mapping from logical fields to Excel column indices
 */
export type ColumnMapping = Partial<Record<LogicalField, number>>;

/**
 * Metadata about a logical field
 */
export interface LogicalFieldInfo {
  key: LogicalField;
  label: string;
  required: boolean;
  description?: string;
}

/**
 * All logical fields with their metadata
 */
export const LOGICAL_FIELDS: LogicalFieldInfo[] = [
  {
    key: "invoiceNumber",
    label: "Invoice Number",
    required: true,
    description: "Invoice number or invoice no",
  },
  {
    key: "invoiceDate",
    label: "Invoice Date",
    required: true,
    description: "Date of invoice",
  },
  {
    key: "invoiceValue",
    label: "Invoice Value",
    required: true,
    description: "Total invoice value",
  },
  {
    key: "placeOfSupply",
    label: "Place of Supply",
    required: true,
    description: "State code (e.g., 29, KA) or state name",
  },
  {
    key: "gstinOfRecipient",
    label: "GSTIN of Recipient",
    required: false,
    description: "Leave empty for B2C invoices",
  },
  {
    key: "taxableValue",
    label: "Taxable Value",
    required: true,
    description: "Taxable amount before tax",
  },
  {
    key: "rate",
    label: "GST Rate (%)",
    required: true,
    description: "GST rate percentage (e.g., 18, 5, 12)",
  },
  {
    key: "igstAmount",
    label: "IGST Amount",
    required: false,
    description: "IGST amount (0 for intra-state, calculated if not provided)",
  },
  {
    key: "cgstAmount",
    label: "CGST Amount",
    required: false,
    description: "CGST amount (0 for inter-state, calculated if not provided)",
  },
  {
    key: "sgstAmount",
    label: "SGST Amount",
    required: false,
    description: "SGST amount (0 for inter-state, calculated if not provided)",
  },
  {
    key: "reverseCharge",
    label: "Reverse Charge",
    required: false,
    description: "Y/N or Yes/No (defaults to N)",
  },
  {
    key: "invoiceType",
    label: "Invoice Type",
    required: false,
    description: "Invoice type (e.g., Regular B2B)",
  },
  {
    key: "cessAmount",
    label: "Cess Amount",
    required: false,
    description: "Cess amount (defaults to 0)",
  },
];

/**
 * Get required logical fields
 */
export function getRequiredFields(): LogicalField[] {
  return LOGICAL_FIELDS.filter((field) => field.required).map((field) => field.key);
}

/**
 * Auto-map columns based on CSV headers
 * Matches exact column names from the GST worksheet
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  // Normalize all headers first
  const normalizedHeaders = headers.map((h, i) => ({
    original: h,
    normalized: h.trim().toLowerCase().replace(/[\/\-]/g, " ").replace(/\s+/g, " "),
    index: i
  }));
  
  // Find each field with multiple strategies
  normalizedHeaders.forEach(({ normalized, index }) => {
    // GSTIN/UIN of Recipient
    if ((normalized.includes("gstin") || normalized.includes("uin")) && 
        (normalized.includes("recipient") || normalized.includes("receiver"))) {
      if (!mapping.gstinOfRecipient) mapping.gstinOfRecipient = index;
    }
    
    // Invoice Number
    if (normalized.includes("invoice") && normalized.includes("number")) {
      if (!mapping.invoiceNumber) mapping.invoiceNumber = index;
    }
    
    // Invoice date
    if (normalized.includes("invoice") && normalized.includes("date")) {
      if (!mapping.invoiceDate) mapping.invoiceDate = index;
    }
    
    // Invoice Value
    if (normalized.includes("invoice") && normalized.includes("value") && !normalized.includes("taxable")) {
      if (!mapping.invoiceValue) mapping.invoiceValue = index;
    }
    
    // Place Of Supply
    if (normalized.includes("place") && normalized.includes("supply")) {
      if (!mapping.placeOfSupply) mapping.placeOfSupply = index;
    }
    
    // Taxable Value
    if (normalized.includes("taxable") && normalized.includes("value")) {
      if (!mapping.taxableValue) mapping.taxableValue = index;
    }
    
    // Rate - prioritize exact match
    if (normalized === "rate") {
      mapping.rate = index;
    } else if (!mapping.rate && normalized.includes("rate") && !normalized.includes("applicable") && !normalized.includes("tax")) {
      mapping.rate = index;
    }
    
    // Reverse Charge
    if (normalized.includes("reverse") && normalized.includes("charge")) {
      if (!mapping.reverseCharge) mapping.reverseCharge = index;
    }
    
    // Invoice Type
    if (normalized.includes("invoice") && normalized.includes("type")) {
      if (!mapping.invoiceType) mapping.invoiceType = index;
    }
    
    // Cess Amount
    if (normalized.includes("cess")) {
      if (!mapping.cessAmount) mapping.cessAmount = index;
    }
  });
  
  return mapping;
}

/**
 * Find best matching column index for a logical field
 * Uses case-insensitive string similarity
 */
export function findBestColumnMatch(
  logicalField: LogicalField,
  headers: string[]
): number | undefined {
  const fieldInfo = LOGICAL_FIELDS.find((f) => f.key === logicalField);
  if (!fieldInfo) return undefined;

  const searchTerms = [
    fieldInfo.label.toLowerCase(),
    logicalField.toLowerCase().replace(/([A-Z])/g, " $1").trim(),
  ];

  // Common variations
  const variations: Record<string, string[]> = {
    invoiceNumber: ["invoice no", "inv no", "invoice num", "inv number", "invoice#"],
    invoiceDate: ["invoice dt", "inv date", "date", "invoice date"],
    invoiceValue: ["invoice val", "inv value", "total", "invoice total"],
    placeOfSupply: ["pos", "place of supply", "supply state", "state"],
    gstinOfRecipient: ["gstin", "recipient gstin", "buyer gstin", "customer gstin", "gstin/uin of recipient"],
    taxableValue: ["taxable", "taxable val", "base amount", "base value"],
    rate: ["gst rate", "rate", "tax rate", "gst %", "applicable % of tax rate"],
    igstAmount: ["igst", "igst amt", "igst amount"],
    cgstAmount: ["cgst", "cgst amt", "cgst amount"],
    sgstAmount: ["sgst", "sgst amt", "sgst amount"],
    reverseCharge: ["reverse charge", "rchrg", "rev charge"],
    invoiceType: ["invoice type", "inv type", "type"],
    cessAmount: ["cess", "cess amount", "cess amt"],
  };

  const allTerms = [
    ...searchTerms,
    ...(variations[logicalField] || []),
  ];

  interface Match {
    index: number;
    score: number;
  }

  let bestMatch: Match | null = null;

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const headerLower = header.toLowerCase().trim();
    
    // Exact match
    if (allTerms.some((term) => headerLower === term)) {
      bestMatch = { index: i, score: 100 };
      break;
    }

    // Contains match
    const containsScore = allTerms.reduce((max, term) => {
      if (headerLower.includes(term) || term.includes(headerLower)) {
        return Math.max(max, 50);
      }
      return max;
    }, 0);

    if (containsScore > 0) {
      if (!bestMatch || containsScore > bestMatch.score) {
        bestMatch = { index: i, score: containsScore };
      }
    }
  }

  if (bestMatch === null) {
    return undefined;
  }

  const result: number = bestMatch.index;
  return result;
}
