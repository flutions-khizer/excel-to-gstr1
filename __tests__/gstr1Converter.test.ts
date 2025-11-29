import { describe, it, expect } from "vitest";
import { convertToGSTR1 } from "@/lib/gstr1Converter";
import type { ParsedData } from "@/lib/parseExcelText";
import type { ColumnMapping } from "@/lib/mappingTypes";

describe("convertToGSTR1", () => {
  const sampleParsedData: ParsedData = {
    headers: [
      "Invoice Number",
      "Invoice Date",
      "Invoice Value",
      "GSTIN of Recipient",
      "Place of Supply",
      "Taxable Value",
      "Rate",
      "IGST Amount",
      "CGST Amount",
      "SGST Amount",
      "Reverse Charge",
    ],
    rows: [
      [
        "INV-001",
        "01-04-2024",
        "1180",
        "29ABCDE1234F1Z5",
        "29",
        "1000",
        "18",
        "180",
        "0",
        "0",
        "N",
      ],
      [
        "INV-001",
        "01-04-2024",
        "1180",
        "29ABCDE1234F1Z5",
        "29",
        "1000",
        "18",
        "180",
        "0",
        "0",
        "N",
      ],
      [
        "INV-002",
        "02-04-2024",
        "590",
        "",
        "29",
        "500",
        "18",
        "0",
        "45",
        "45",
        "N",
      ],
    ],
  };

  const sampleMapping: ColumnMapping = {
    invoiceNumber: 0,
    invoiceDate: 1,
    invoiceValue: 2,
    gstinOfRecipient: 3,
    placeOfSupply: 4,
    taxableValue: 5,
    rate: 6,
    igstAmount: 7,
    cgstAmount: 8,
    sgstAmount: 9,
    reverseCharge: 10,
  };

  const meta = {
    gstin: "27ABCDE1234F1Z5",
    fp: "042024",
    version: "GST2.4",
  };

  it("should convert B2B invoices correctly", () => {
    const b2bData: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [sampleParsedData.rows[0], sampleParsedData.rows[1]],
    };

    const { gstr1, errors } = convertToGSTR1(b2bData, sampleMapping, meta);

    expect(errors).toHaveLength(0);
    expect(gstr1.gstin).toBe(meta.gstin);
    expect(gstr1.fp).toBe(meta.fp);
    expect(gstr1.b2b).toHaveLength(1);
    expect(gstr1.b2b?.[0].ctin).toBe("29ABCDE1234F1Z5");
    expect(gstr1.b2b?.[0].inv).toHaveLength(1);
    expect(gstr1.b2b?.[0].inv[0].inum).toBe("INV-001");
    expect(gstr1.b2b?.[0].inv[0].itms).toHaveLength(2);
  });

  it("should convert B2C invoices correctly", () => {
    const b2cData: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [sampleParsedData.rows[2]],
    };

    const { gstr1, errors } = convertToGSTR1(b2cData, sampleMapping, meta);

    expect(errors).toHaveLength(0);
    expect(gstr1.b2cs).toHaveLength(1);
    expect(gstr1.b2cs?.[0].pos).toBe("29");
    expect(gstr1.b2cs?.[0].rt).toBe(18);
    expect(gstr1.b2cs?.[0].txval).toBe(500);
    expect(gstr1.b2cs?.[0].sup_ty).toBe("INTRA");
  });

  it("should group B2B invoices by recipient GSTIN", () => {
    const multiRecipientData: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [
        ["INV-001", "01-04-2024", "1180", "29ABCDE1234F1Z5", "29", "1000", "18", "180", "0", "0", "N"],
        ["INV-002", "02-04-2024", "1180", "27FGHIJ5678K2Z6", "27", "1000", "18", "180", "0", "0", "N"],
      ],
    };

    const { gstr1 } = convertToGSTR1(multiRecipientData, sampleMapping, meta);

    expect(gstr1.b2b).toHaveLength(2);
    expect(gstr1.b2b?.[0].ctin).toBe("29ABCDE1234F1Z5");
    expect(gstr1.b2b?.[1].ctin).toBe("27FGHIJ5678K2Z6");
  });

  it("should group B2C by place of supply and rate", () => {
    const b2cData: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [
        ["INV-001", "01-04-2024", "590", "", "29", "500", "18", "0", "45", "45", "N"],
        ["INV-002", "02-04-2024", "590", "", "29", "500", "18", "0", "45", "45", "N"],
        ["INV-003", "03-04-2024", "590", "", "27", "500", "18", "0", "45", "45", "N"],
      ],
    };

    const { gstr1 } = convertToGSTR1(b2cData, sampleMapping, meta);

    expect(gstr1.b2cs).toHaveLength(2);
    expect(gstr1.b2cs?.find((r) => r.pos === "29")?.txval).toBe(1000);
    expect(gstr1.b2cs?.find((r) => r.pos === "27")?.txval).toBe(500);
  });

  it("should return errors for missing required mappings", () => {
    const incompleteMapping: ColumnMapping = {
      invoiceNumber: 0,
      // Missing other required fields
    };

    const { errors } = convertToGSTR1(sampleParsedData, incompleteMapping, meta);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "invoiceDate")).toBe(true);
  });

  it("should return errors for missing required values", () => {
    const dataWithMissingValues: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [
        ["", "01-04-2024", "1180", "29ABCDE1234F1Z5", "29", "1000", "18", "180", "0", "0", "N"],
        ["INV-002", "", "1180", "29ABCDE1234F1Z5", "29", "1000", "18", "180", "0", "0", "N"],
      ],
    };

    const { errors } = convertToGSTR1(dataWithMissingValues, sampleMapping, meta);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "invoiceNumber")).toBe(true);
    expect(errors.some((e) => e.field === "invoiceDate")).toBe(true);
  });

  it("should normalize dates correctly", () => {
    const dataWithDifferentDateFormats: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [
        ["INV-001", "2024-04-01", "1180", "29ABCDE1234F1Z5", "29", "1000", "18", "180", "0", "0", "N"],
        ["INV-002", "01/04/2024", "1180", "29ABCDE1234F1Z5", "29", "1000", "18", "180", "0", "0", "N"],
      ],
    };

    const { gstr1 } = convertToGSTR1(dataWithDifferentDateFormats, sampleMapping, meta);

    expect(gstr1.b2b?.[0].inv[0].idt).toMatch(/^\d{2}-\d{2}-\d{4}$/);
    expect(gstr1.b2b?.[0].inv[1].idt).toMatch(/^\d{2}-\d{2}-\d{4}$/);
  });

  it("should parse numbers with commas", () => {
    const dataWithCommas: ParsedData = {
      headers: sampleParsedData.headers,
      rows: [
        ["INV-001", "01-04-2024", "1,180", "29ABCDE1234F1Z5", "29", "1,000", "18", "180", "0", "0", "N"],
      ],
    };

    const { gstr1 } = convertToGSTR1(dataWithCommas, sampleMapping, meta);

    expect(gstr1.b2b?.[0].inv[0].val).toBe(1180);
    expect(gstr1.b2b?.[0].inv[0].itms[0].itm_det.txval).toBe(1000);
  });
});

