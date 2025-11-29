"use client";

import { useState } from "react";
import MetaForm, { type MetaInfo } from "@/components/MetaForm";
import PasteArea from "@/components/PasteArea";
import TablePreview from "@/components/TablePreview";
import JsonPreview from "@/components/JsonPreview";
import ValidationErrors from "@/components/ValidationErrors";
import { parseExcelText, validateParsedData } from "@/lib/parseExcelText";
import { convertToGSTR1 } from "@/lib/gstr1Converter";
import { autoMapColumns } from "@/lib/mappingTypes";
import type { ColumnMapping } from "@/lib/mappingTypes";
import type { ParsedData } from "@/lib/parseExcelText";
import type { GSTR1 } from "@/lib/gstr1Types";
import type { ValidationError } from "@/lib/gstr1Converter";

export default function Home() {
  const [metaInfo, setMetaInfo] = useState<MetaInfo | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [gstr1, setGstr1] = useState<GSTR1 | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleMetaSave = (meta: MetaInfo) => {
    setMetaInfo(meta);
  };

  const handleParse = () => {
    setParseError(null);
    const parsed = parseExcelText(pastedText);
    const validation = validateParsedData(parsed);

    if (!validation.valid || !parsed) {
      setParseError(validation.error || "Failed to parse data");
      setParsedData(null);
      setColumnMapping({});
      return;
    }

    // Auto-map columns based on headers
    const autoMapping = autoMapColumns(parsed.headers);
    
    // Debug: Log headers and mapping
    console.log("=== PARSING DEBUG ===");
    console.log("Headers:", parsed.headers);
    console.log("Headers count:", parsed.headers.length);
    console.log("Auto-mapping:", autoMapping);
    console.log("Mapping keys:", Object.keys(autoMapping));
    
    // Check if required fields are mapped
    const requiredFields = ["invoiceNumber", "invoiceDate", "invoiceValue", "placeOfSupply", "taxableValue", "rate"];
    const missingFields = requiredFields.filter(field => autoMapping[field as keyof typeof autoMapping] === undefined);
    
    if (missingFields.length > 0) {
      console.error("❌ Missing mappings:", missingFields);
      console.error("Available headers:", parsed.headers.map((h, i) => `${i}: "${h}"`));
      
      // Try to manually map based on header text
      parsed.headers.forEach((header, index) => {
        const h = header.toLowerCase().trim();
        if (h.includes("invoice") && h.includes("number") && !autoMapping.invoiceNumber) {
          console.log(`Found Invoice Number at index ${index}: "${header}"`);
          autoMapping.invoiceNumber = index;
        }
        if (h.includes("invoice") && h.includes("date") && !autoMapping.invoiceDate) {
          console.log(`Found Invoice Date at index ${index}: "${header}"`);
          autoMapping.invoiceDate = index;
        }
        if (h.includes("place") && h.includes("supply") && !autoMapping.placeOfSupply) {
          console.log(`Found Place Of Supply at index ${index}: "${header}"`);
          autoMapping.placeOfSupply = index;
        }
        if ((h === "rate" || (h.includes("rate") && !h.includes("applicable"))) && !autoMapping.rate) {
          console.log(`Found Rate at index ${index}: "${header}"`);
          autoMapping.rate = index;
        }
      });
      
      console.log("Final mapping after fix:", autoMapping);
    }
    
    setColumnMapping(autoMapping);
    setParsedData(parsed);
    setGstr1(null);
    setValidationErrors([]);
  };

  const handleGenerate = () => {
    if (!metaInfo) {
      alert("Please fill in GST meta information first.");
      return;
    }

    if (!parsedData) {
      alert("Please parse Excel data first.");
      return;
    }

    const { gstr1: generated, errors } = convertToGSTR1(parsedData, columnMapping, {
      gstin: metaInfo.gstin,
      fp: metaInfo.returnPeriod,
      version: "GST3.2.3",
    });

    setGstr1(generated);
    setValidationErrors(errors);
  };

  const getFilename = (): string => {
    if (!metaInfo) return "gstr1.json";
    return `gstr1_${metaInfo.gstin}_${metaInfo.returnPeriod}.json`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Excel to GSTR-1 JSON Converter
          </h1>
          <p className="mt-2 text-gray-600">
            Convert your Excel sales invoice data into GSTR-1 JSON format
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Section 1: Meta Info */}
          <MetaForm onSave={handleMetaSave} />

          {/* Section 2: Paste Excel Data */}
          <PasteArea
            value={pastedText}
            onChange={setPastedText}
            onParse={handleParse}
          />

          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Parse Error:</p>
              <p className="text-red-700">{parseError}</p>
            </div>
          )}

          {/* Section 3: Table Preview */}
          {parsedData && (
            <TablePreview data={parsedData} />
          )}

          {/* Section 4: Generate JSON */}
          {parsedData && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Generate GSTR-1 JSON</h2>
              {!metaInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Please fill in and save GST meta information above before generating JSON.
                  </p>
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!metaInfo}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Generate GSTR-1 JSON
              </button>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <ValidationErrors errors={validationErrors} />
          )}

          {/* JSON Preview */}
          {gstr1 && validationErrors.length === 0 && (
            <JsonPreview gstr1={gstr1} filename={getFilename()} />
          )}
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Excel to GSTR-1 JSON Converter - Built with Next.js and TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}
