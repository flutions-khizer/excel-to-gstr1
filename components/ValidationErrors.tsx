"use client";

import type { ValidationError } from "@/lib/gstr1Converter";

interface ValidationErrorsProps {
  errors: ValidationError[];
}

export default function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Validation Errors ({errors.length})
      </h3>
      <div className="max-h-64 overflow-y-auto">
        <ul className="space-y-1 text-sm">
          {errors.map((error, idx) => (
            <li key={idx} className="text-red-800">
              <span className="font-semibold text-red-900">Row {error.row}</span> - {error.field}: {error.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

