"use client";

import { useState, useEffect } from "react";
import type { ColumnMapping, LogicalField } from "@/lib/mappingTypes";
import { LOGICAL_FIELDS, findBestColumnMatch } from "@/lib/mappingTypes";
import type { ParsedData } from "@/lib/parseExcelText";

interface ColumnMappingFormProps {
  parsedData: ParsedData | null;
  onMappingChange: (mapping: ColumnMapping) => void;
  initialMapping?: ColumnMapping;
}

export default function ColumnMappingForm({
  parsedData,
  onMappingChange,
  initialMapping,
}: ColumnMappingFormProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping || {});

  useEffect(() => {
    // Update mapping when initialMapping changes
    if (initialMapping && Object.keys(initialMapping).length > 0) {
      const currentKeys = Object.keys(mapping).sort().join(",");
      const initialKeys = Object.keys(initialMapping).sort().join(",");
      if (currentKeys !== initialKeys) {
        setMapping(initialMapping);
      }
    } else if (parsedData && Object.keys(mapping).length === 0) {
      // Auto-detect mappings only if no initial mapping provided
      const autoMapping: ColumnMapping = {};
      LOGICAL_FIELDS.forEach((fieldInfo) => {
        const bestMatch = findBestColumnMatch(fieldInfo.key, parsedData.headers);
        if (bestMatch !== undefined) {
          autoMapping[fieldInfo.key] = bestMatch;
        }
      });
      if (Object.keys(autoMapping).length > 0) {
        setMapping(autoMapping);
        onMappingChange(autoMapping);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedData, initialMapping]); // Only depend on parsedData and initialMapping

  const handleMappingChange = (field: LogicalField, columnIndex: number | undefined) => {
    const newMapping = { ...mapping };
    if (columnIndex === undefined) {
      delete newMapping[field];
    } else {
      newMapping[field] = columnIndex;
    }
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  if (!parsedData) {
    return null;
  }

  const requiredFields = LOGICAL_FIELDS.filter((f) => f.required);
  const optionalFields = LOGICAL_FIELDS.filter((f) => !f.required);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Column Mapping</h2>
      <p className="text-sm text-gray-800 mb-4">
        Map each logical field to the corresponding Excel column. Required fields are marked with{" "}
        <span className="text-red-600 font-semibold">*</span>.
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Required Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requiredFields.map((fieldInfo) => (
              <div key={fieldInfo.key}>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  {fieldInfo.label} <span className="text-red-600 font-semibold">*</span>
                </label>
                <select
                  value={mapping[fieldInfo.key] ?? ""}
                  onChange={(e) =>
                    handleMappingChange(
                      fieldInfo.key,
                      e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                  required
                >
                  <option value="">-- Select Column --</option>
                  {parsedData.headers.map((header, idx) => (
                    <option key={idx} value={idx}>
                      {header || `Column ${idx + 1}`}
                    </option>
                  ))}
                </select>
                {fieldInfo.description && (
                  <p className="text-xs text-gray-700 mt-1">{fieldInfo.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {optionalFields.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Optional Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optionalFields.map((fieldInfo) => (
                <div key={fieldInfo.key}>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {fieldInfo.label}
                  </label>
                  <select
                    value={mapping[fieldInfo.key] ?? ""}
                    onChange={(e) =>
                      handleMappingChange(
                        fieldInfo.key,
                        e.target.value === "" ? undefined : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedData.headers.map((header, idx) => (
                      <option key={idx} value={idx}>
                        {header || `Column ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  {fieldInfo.description && (
                    <p className="text-xs text-gray-700 mt-1">{fieldInfo.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

