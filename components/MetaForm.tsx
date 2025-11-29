"use client";

import { useState, useEffect } from "react";

export interface MetaInfo {
  gstin: string;
  legalName: string;
  financialYear: string;
  returnPeriod: string;
}

interface MetaFormProps {
  onSave: (meta: MetaInfo) => void;
  initialMeta?: Partial<MetaInfo>;
}

export default function MetaForm({ onSave, initialMeta }: MetaFormProps) {
  // Initialize with consistent defaults to avoid hydration mismatch
  const defaultFY = "2025-26";
  const defaultYear = "25";
  const defaultReturnPeriod = "102025"; // October 2025 (MMYYYY format)
  
  const [meta, setMeta] = useState<MetaInfo>({
    gstin: "",
    legalName: "",
    financialYear: defaultFY,
    returnPeriod: defaultReturnPeriod,
  });
  
  // Set initial values from props after mount to avoid hydration issues
  useEffect(() => {
    if (initialMeta) {
      const fy = initialMeta.financialYear || defaultFY;
      const fullYear = fy.substring(0, 4); // Get full year like "2025"
      const newReturnPeriod = initialMeta.returnPeriod || `10${fullYear}`;
      
      // Only update if values actually differ to avoid unnecessary re-renders
      if (
        (initialMeta.gstin && initialMeta.gstin !== meta.gstin) ||
        (initialMeta.legalName && initialMeta.legalName !== meta.legalName) ||
        fy !== meta.financialYear ||
        newReturnPeriod !== meta.returnPeriod
      ) {
        setMeta({
          gstin: initialMeta.gstin || "",
          legalName: initialMeta.legalName || "",
          financialYear: fy,
          returnPeriod: newReturnPeriod,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const financialYears = [
    "2024-25",
    "2025-26",
    "2026-27",
    "2027-28",
    "2028-29",
  ];

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(meta);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">GST Meta Information</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1">
            GSTIN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="gstin"
            value={meta.gstin}
            onChange={(e) => setMeta({ ...meta, gstin: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15-character GSTIN"
            maxLength={15}
            required
          />
        </div>

        <div>
          <label htmlFor="legalName" className="block text-sm font-medium text-gray-700 mb-1">
            Legal Name (Optional)
          </label>
          <input
            type="text"
            id="legalName"
            value={meta.legalName}
            onChange={(e) => setMeta({ ...meta, legalName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Legal name of business"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700 mb-1">
              Financial Year <span className="text-red-500">*</span>
            </label>
            <select
              id="financialYear"
              value={meta.financialYear}
              onChange={(e) => {
                const newFY = e.target.value;
                const fullYear = newFY.substring(0, 4); // Get full year like "2025"
                const currentMonth = meta.returnPeriod ? meta.returnPeriod.substring(0, 2) : "10";
                setMeta({ 
                  ...meta, 
                  financialYear: newFY,
                  returnPeriod: currentMonth + fullYear,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="returnPeriod" className="block text-sm font-medium text-gray-700 mb-1">
              Return Period <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                id="month"
                value={meta.returnPeriod && meta.returnPeriod.length >= 2 ? meta.returnPeriod.substring(0, 2) : "10"}
                onChange={(e) => {
                  const month = e.target.value;
                  // Get full year (4 digits) from financial year
                  const currentFY = meta.financialYear || defaultFY;
                  const fullYear = currentFY.substring(0, 2) + (meta.returnPeriod && meta.returnPeriod.length >= 6 ? meta.returnPeriod.substring(4, 6) : currentFY.substring(2, 4));
                  setMeta({ ...meta, returnPeriod: month + fullYear });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                id="year"
                value={meta.returnPeriod && meta.returnPeriod.length >= 6 ? meta.returnPeriod.substring(4, 6) : defaultYear}
                onChange={(e) => {
                  const year2Digit = e.target.value;
                  const currentFY = meta.financialYear || defaultFY;
                  const fullYear = currentFY.substring(0, 2) + year2Digit;
                  const month = meta.returnPeriod && meta.returnPeriod.length >= 2 ? meta.returnPeriod.substring(0, 2) : "10";
                  setMeta({ ...meta, returnPeriod: month + fullYear });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {financialYears.map((fy) => {
                  const year = fy.substring(2, 4);
                  return (
                    <option key={year} value={year}>
                      {fy}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select month and financial year</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Save Meta Information
        </button>
      </form>
    </div>
  );
}

