#!/usr/bin/env python3
"""Export Clutch 2025.xlsx to clutch-2025.csv for the QB profile app."""
import csv
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Clutch 2025.xlsx"
OUT = ROOT / "clutch-2025.csv"


def read_xlsx_rows(path: Path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for si in root.findall("m:si", ns):
                texts = [t.text or "" for t in si.findall(".//m:t", ns)]
                shared.append("".join(texts))

        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        rows = []
        for row in sheet.findall("m:sheetData/m:row", ns):
            vals = []
            for cell in row.findall("m:c", ns):
                cell_type = cell.get("t")
                value = cell.find("m:v", ns)
                if value is None:
                    vals.append("")
                elif cell_type == "s":
                    vals.append(shared[int(value.text)])
                else:
                    vals.append(value.text)
            rows.append(vals)
    return rows


def main():
    if not XLSX.is_file():
        raise FileNotFoundError(f"Missing source workbook: {XLSX}")

    rows = read_xlsx_rows(XLSX)
    if not rows:
        raise ValueError("Clutch 2025.xlsx is empty.")

    headers = [str(h or "").strip() for h in rows[0] if str(h or "").strip()]
    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows[1:]:
            if not any(str(cell or "").strip() for cell in row):
                continue
            padded = row + [""] * max(0, len(headers) - len(row))
            writer.writerow(padded[: len(headers)])

    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
