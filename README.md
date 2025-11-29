# Excel to GSTR-1 JSON Converter

A web application that converts Excel/Google Sheets sales invoice data into GSTR-1 JSON format compatible with the GSTN GSTR-1 Offline Tool.

## Features

- 📊 Parse Excel data by pasting tab-separated text
- 🗺️ Intelligent column mapping with auto-detection
- ✅ Data validation with detailed error reporting
- 🔄 Automatic B2B and B2C invoice classification
- 📦 Grouping and aggregation of invoice items
- 💾 Download GSTR-1 JSON file ready for GST filing
- 🎨 Clean, modern UI built with Tailwind CSS
- 🔒 100% client-side processing (no data sent to servers)

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vitest** (for testing)

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd excel-to-gstr1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

Build the production-ready application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Testing

Run unit tests:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

## Usage Guide

### Step 1: Enter GST Meta Information

Fill in the required GST details:
- **GSTIN**: Your 15-character GSTIN
- **Legal Name**: (Optional) Your business legal name
- **Financial Year**: Select from dropdown (e.g., 2024-25)
- **Return Period**: Enter in MMMMYYYY format (e.g., 042024 for April 2024)

Click "Save Meta Information" to proceed.

### Step 2: Paste Excel Data

1. Open your Excel file or Google Sheet with invoice data
2. Select the data (including headers) and copy (Ctrl+C / Cmd+C)
3. Paste into the text area in the app
4. Click "Parse Data"

**Expected Excel Format:**
- First row should contain column headers
- Data should be in tab-separated format (default when copying from Excel)
- Each row represents one invoice line item

### Step 3: Review and Map Columns

The app will:
- Display a preview of your parsed data (first 10 rows)
- Auto-detect column mappings based on header names
- Allow you to manually adjust mappings if needed

**Required Columns:**
- Invoice Number
- Invoice Date
- Invoice Value
- Place of Supply (state code or name)
- Taxable Value
- GST Rate (%)
- IGST Amount
- CGST Amount
- SGST Amount

**Optional Columns:**
- GSTIN of Recipient (if present, invoice is treated as B2B)
- Reverse Charge (Y/N, defaults to N)

### Step 4: Generate and Download JSON

1. Click "Generate GSTR-1 JSON"
2. Review any validation errors (if any)
3. If successful, click "Download JSON" to save the file
4. The file will be named: `gstr1_{GSTIN}_{ReturnPeriod}.json`

## Excel Data Format Example

Here's a sample of how your Excel data should look:

```
Invoice Number	Invoice Date	Invoice Value	GSTIN of Recipient	Place of Supply	Taxable Value	Rate	IGST Amount	CGST Amount	SGST Amount	Reverse Charge
INV-001	01-04-2024	1180	29ABCDE1234F1Z5	29	1000	18	180	0	0	N
INV-002	02-04-2024	590		29	500	18	0	45	45	N
INV-003	03-04-2024	2360	27FGHIJ5678K2Z6	27	2000	18	360	0	0	N
```

**Notes:**
- Empty "GSTIN of Recipient" means B2C invoice
- Place of Supply can be state code (e.g., "29" for Karnataka) or state name
- Dates can be in various formats (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Numbers can include commas (e.g., "1,000" will be parsed as 1000)

## Generated JSON Structure

The app generates JSON in the GSTR-1 format with the following structure:

```json
{
  "gstin": "27ABCDE1234F1Z5",
  "fp": "042024",
  "version": "GST2.4",
  "hash": null,
  "b2b": [
    {
      "ctin": "29ABCDE1234F1Z5",
      "inv": [
        {
          "inum": "INV-001",
          "idt": "01-04-2024",
          "val": 1180,
          "pos": "29",
          "rchrg": "N",
          "itms": [
            {
              "num": 1,
              "itm_det": {
                "txval": 1000,
                "rt": 18,
                "igst": 180,
                "cgst": 0,
                "sgst": 0
              }
            }
          ]
        }
      ]
    }
  ],
  "b2cs": [
    {
      "sup_ty": "INTRA",
      "pos": "29",
      "rt": 18,
      "txval": 500,
      "igst": 0,
      "cgst": 45,
      "sgst": 45
    }
  ]
}
```

## How It Works

### B2B Invoices
- Invoices with a "GSTIN of Recipient" are classified as B2B
- Grouped by recipient GSTIN and invoice number
- Each row becomes an item in the invoice's `itms` array

### B2C Invoices
- Invoices without a "GSTIN of Recipient" are classified as B2C
- Grouped by Place of Supply and GST Rate
- Taxable values and tax amounts are aggregated
- Supply type (INTER/INTRA) is determined by IGST presence

### Data Processing
- Dates are normalized to DD-MM-YYYY format
- State codes are normalized (state names mapped to codes)
- Numbers are parsed (commas removed)
- Reverse charge defaults to "N" if not specified

## Project Structure

```
excel-to-gstr1/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── MetaForm.tsx      # GST meta information form
│   ├── PasteArea.tsx     # Excel data paste area
│   ├── TablePreview.tsx  # Parsed data preview
│   ├── ColumnMappingForm.tsx  # Column mapping UI
│   ├── JsonPreview.tsx   # Generated JSON preview
│   └── ValidationErrors.tsx   # Error display
├── lib/
│   ├── gstr1Types.ts     # TypeScript interfaces for GSTR-1
│   ├── mappingTypes.ts   # Column mapping types and utilities
│   ├── parseExcelText.ts # Excel text parsing logic
│   └── gstr1Converter.ts # Excel to GSTR-1 conversion logic
├── __tests__/
│   ├── parseExcelText.test.ts
│   └── gstr1Converter.test.ts
└── README.md
```

## Validation

The app validates:
- Required fields are mapped
- Required values are present in each row
- Dates are in valid format
- Numbers are parseable
- State codes are valid

Validation errors are displayed with row numbers and field names for easy debugging.

## State Code Reference

Common state codes used in Place of Supply:
- 29: Karnataka
- 27: Maharashtra
- 33: Tamil Nadu
- 09: Uttar Pradesh
- 07: Delhi
- 24: Gujarat
- ... (full list in code)

The app automatically maps state names to codes when possible.

## Troubleshooting

**Issue: Data not parsing correctly**
- Ensure you're copying the entire selection including headers
- Check that data is tab-separated (default from Excel)
- Remove any merged cells before copying

**Issue: Column mapping not detected**
- Manually select columns from the dropdown
- Check that your headers match common variations (case-insensitive)

**Issue: Validation errors**
- Check that all required fields are mapped
- Ensure required values are present in all rows
- Verify date formats are recognizable

**Issue: JSON not generating**
- Ensure all required fields are mapped
- Fix any validation errors first
- Check that meta information is saved

## License

This project is provided as-is for converting Excel data to GSTR-1 JSON format.

## Disclaimer

This tool is designed to assist with GSTR-1 JSON generation. Always verify the generated JSON before filing with GSTN. The authors are not responsible for any errors in GST filing.
