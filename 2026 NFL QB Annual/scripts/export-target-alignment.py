#!/usr/bin/env python3
"""Export Target alignment.xlsx to target-alignment.csv for the QB profile app."""
import csv
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Target alignment.xlsx"
OUT = ROOT / "target-alignment.csv"
META = {"player", "player_id", "included in rank?"}


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


def build_headers(raw_headers):
    headers = [str(h or "").strip() for h in raw_headers if str(h or "").strip()]
    if not headers:
        return []

    out = []
    i = 0
    while i < len(headers):
        label = headers[i]
        lower = label.lower()
        if lower in META:
            out.append(label)
            i += 1
            continue
        if lower.endswith(" att"):
            out.append(label)
            i += 1
            continue

        next_label = headers[i + 1].strip() if i + 1 < len(headers) else ""
        if next_label.lower() == f"{lower} att" or next_label.lower().endswith(" att"):
            out.extend([label, next_label])
            i += 2
            continue

        out.append(label)
        i += 1

    return out


def main():
    if not XLSX.is_file():
        raise FileNotFoundError(f"Missing source workbook: {XLSX}")

    rows = read_xlsx_rows(XLSX)
    if not rows:
        raise ValueError("Target alignment.xlsx is empty.")

    headers = build_headers(rows[0])
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
