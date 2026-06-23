#!/usr/bin/env python3
"""Export Target Map Final.xlsx to target-map.csv for the QB Annual app."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Target Map Final.xlsx"
OUT = ROOT / "target-map.csv"


def normalize_column_name(name):
    cleaned = re.sub(r"[^\w\s]+", "", str(name or "").strip().lower())
    cleaned = re.sub(r"\s+", "_", cleaned)
    return cleaned


def main():
    if not XLSX.is_file():
        raise FileNotFoundError(f"Missing spreadsheet: {XLSX}")

    try:
        import pandas as pd
    except ImportError as exc:
        raise SystemExit(
            "pandas is required. Install with: pip install pandas openpyxl"
        ) from exc

    df = pd.read_excel(XLSX)
    df.columns = [normalize_column_name(col) for col in df.columns]
    df.to_csv(OUT, index=False)
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes, {len(df):,} rows)")


if __name__ == "__main__":
    main()
