/**
 * TypeScript interfaces for GSTR-1 JSON structure
 * Based on GSTN GSTR-1 Offline Tool format
 */

/**
 * Root GSTR-1 object structure
 */
export interface GSTR1 {
  gstin: string;
  fp: string; // Filing period (e.g., "042024" for April 2024)
  version?: string;
  hash?: string | null;
  b2b?: B2B[];
}

/**
 * B2B (Business to Business) invoice record
 */
export interface B2B {
  ctin: string; // GSTIN of recipient
  inv: Invoice[];
}

/**
 * Invoice details
 */
export interface Invoice {
  inum: string; // Invoice number
  idt: string; // Invoice date in DD-MM-YYYY format
  val: number; // Invoice value
  pos: string; // Place of supply (state code)
  rchrg: "Y" | "N"; // Reverse charge
  inv_typ?: string; // Invoice type (e.g., "R" for Regular)
  itms: InvoiceItem[];
}

/**
 * Invoice item details
 */
export interface InvoiceItem {
  num: number; // Line item number (1-based)
  itm_det: ItemDetails;
}

/**
 * Item tax details
 */
export interface ItemDetails {
  txval: number; // Taxable value
  rt: number; // Rate (GST rate in %)
  igst?: number; // IGST amount (optional, for inter-state)
  cgst?: number; // CGST amount (optional, for intra-state)
  sgst?: number; // SGST amount (optional, for intra-state)
  camt?: number; // CGST amount (alternative field name)
  samt?: number; // SGST amount (alternative field name)
  csamt?: number; // Cess amount
}

/**
 * B2CS (Business to Consumer - Small) record
 */
export interface B2CS {
  sup_ty: "INTER" | "INTRA"; // Supply type (Inter-state or Intra-state)
  sply_ty?: string; // Supply type code (optional)
  pos: string; // Place of supply (state code)
  rt: number; // Rate (GST rate in %)
  txval: number; // Taxable value
  igst: number; // IGST amount
  cgst: number; // CGST amount
  sgst: number; // SGST amount
}

