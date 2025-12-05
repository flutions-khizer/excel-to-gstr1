"use client";

import type { ParsedData } from "@/lib/parseExcelText";

interface TablePreviewProps {
  data: ParsedData | null;
  maxRows?: number;
}

export default function TablePreview({ data, maxRows = 10 }: TablePreviewProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-700">No data to preview. Please parse Excel data first.</p>
      </div>
    );
  }

  const displayRows = data.rows.slice(0, maxRows);
  const hasMore = data.rows.length > maxRows;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Parsed Table Preview
        <span className="text-sm font-normal text-gray-700 ml-2">
          ({data.rows.length} row{data.rows.length !== 1 ? "s" : ""} total)
        </span>
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              {data.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900"
                >
                  {header || `Column ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="border border-gray-300 px-3 py-2 text-gray-900"
                  >
                    {cell || <span className="text-gray-500">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <p className="text-sm text-gray-700 mt-2">
            Showing first {maxRows} rows. {data.rows.length - maxRows} more rows available.
          </p>
        )}
      </div>
    </div>
  );
}

