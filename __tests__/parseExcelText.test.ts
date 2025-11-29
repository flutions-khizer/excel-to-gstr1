import { describe, it, expect } from "vitest";
import { parseExcelText, validateParsedData } from "@/lib/parseExcelText";

describe("parseExcelText", () => {
  it("should parse simple tab-separated data", () => {
    const text = "Header1\tHeader2\tHeader3\nValue1\tValue2\tValue3";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.headers).toEqual(["Header1", "Header2", "Header3"]);
    expect(result?.rows).toHaveLength(1);
    expect(result?.rows[0]).toEqual(["Value1", "Value2", "Value3"]);
  });

  it("should handle multiple rows", () => {
    const text = "A\tB\tC\n1\t2\t3\n4\t5\t6\n7\t8\t9";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.headers).toEqual(["A", "B", "C"]);
    expect(result?.rows).toHaveLength(3);
    expect(result?.rows[0]).toEqual(["1", "2", "3"]);
    expect(result?.rows[1]).toEqual(["4", "5", "6"]);
    expect(result?.rows[2]).toEqual(["7", "8", "9"]);
  });

  it("should handle empty cells", () => {
    const text = "A\tB\tC\n1\t\t3\n\t5\t";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.rows[0]).toEqual(["1", "", "3"]);
    expect(result?.rows[1]).toEqual(["", "5", ""]);
  });

  it("should handle rows with fewer columns than headers", () => {
    const text = "A\tB\tC\n1\t2";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.rows[0]).toEqual(["1", "2", ""]);
  });

  it("should handle rows with more columns than headers", () => {
    const text = "A\tB\n1\t2\t3\t4";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.rows[0]).toEqual(["1", "2"]);
  });

  it("should handle Windows line endings", () => {
    const text = "A\tB\r\n1\t2\r\n3\t4";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.rows).toHaveLength(2);
  });

  it("should return null for empty text", () => {
    expect(parseExcelText("")).toBeNull();
    expect(parseExcelText("   ")).toBeNull();
  });

  it("should trim whitespace from cells", () => {
    const text = "  A  \t  B  \n  1  \t  2  ";
    const result = parseExcelText(text);

    expect(result).not.toBeNull();
    expect(result?.headers).toEqual(["A", "B"]);
    expect(result?.rows[0]).toEqual(["1", "2"]);
  });
});

describe("validateParsedData", () => {
  it("should validate correct data", () => {
    const data = {
      headers: ["A", "B", "C"],
      rows: [
        ["1", "2", "3"],
        ["4", "5", "6"],
      ],
    };

    const result = validateParsedData(data);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject null data", () => {
    const result = validateParsedData(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("No data to parse");
  });

  it("should reject data with no headers", () => {
    const data = {
      headers: [],
      rows: [["1", "2"]],
    };

    const result = validateParsedData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("No headers found");
  });

  it("should reject data with no rows", () => {
    const data = {
      headers: ["A", "B"],
      rows: [],
    };

    const result = validateParsedData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("No data rows found");
  });

  it("should reject rows with mismatched column count", () => {
    const data = {
      headers: ["A", "B", "C"],
      rows: [
        ["1", "2", "3"],
        ["4", "5"], // Missing one column
      ],
    };

    const result = validateParsedData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Row 3 has 2 columns");
  });
});

