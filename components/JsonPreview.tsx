"use client";

import { useState } from "react";
import type { GSTR1 } from "@/lib/gstr1Types";

interface JsonPreviewProps {
  gstr1: GSTR1 | null;
  filename: string;
}

export default function JsonPreview({ gstr1, filename }: JsonPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!gstr1) {
    return null;
  }

  const jsonString = JSON.stringify(gstr1, null, 2);

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Generated GSTR-1 JSON</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Download JSON
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-800">
        <p>
          <strong className="text-gray-900">GSTIN:</strong> {gstr1.gstin}
        </p>
        <p>
          <strong className="text-gray-900">Filing Period:</strong> {gstr1.fp}
        </p>
        <p>
          <strong className="text-gray-900">B2B Invoices:</strong> {gstr1.b2b?.length || 0} recipient(s)
        </p>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-gray-900 whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
}

