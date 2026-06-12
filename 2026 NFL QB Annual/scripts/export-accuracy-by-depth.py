#!/usr/bin/env python3
"""Export Accuracy by depth.xlsx to accuracy-by-depth.csv for the QB Annual app."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Accuracy by depth.xlsx"
OUT = ROOT / "accuracy-by-depth.csv"

COLUMN_MAP = {
    "player id": "player_id",
    "name": "name",
    "team": "team",
    "pos": "pos",
    "targeted depth": "targeted_depth",
    "outside l numbers att": "left_attempts",
    "outside l numbers acc": "left_accuracy",
    "outside r numbers att": "right_attempts",
    "outside r numbers acc": "right_accuracy",
    "between numbers att": "center_attempts",
    "between numbers acc": "center_accuracy",
}


def normalize_column_name(name):
    cleaned = re.sub(r"[^\w\s]+", "", str(name or "").strip().lower())
    cleaned = re.sub(r"\s+", " ", cleaned)
    return COLUMN_MAP.get(cleaned, cleaned.replace(" ", "_"))


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
