"use client";

interface PasteAreaProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
}

export default function PasteArea({ value, onChange, onParse }: PasteAreaProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Paste Excel Data</h2>
      <div className="space-y-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Copy data from Excel/Google Sheets and paste here. First row should be headers.&#10;&#10;Example:&#10;Invoice Number	Invoice Date	Invoice Value	GSTIN of Recipient	Taxable Value	Rate	IGST Amount	CGST Amount	SGST Amount"
        />
        <button
          onClick={onParse}
          disabled={!value.trim()}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Parse Data
        </button>
      </div>
    </div>
  );
}

