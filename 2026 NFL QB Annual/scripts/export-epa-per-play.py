#!/usr/bin/env python3
"""Export EPA per play.xlsx to CSV feeds for the QB Annual app."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "EPA per play.xlsx"
OUT_SEASON = ROOT / "epa-per-play-season.csv"
OUT_CAREER = ROOT / "epa-per-play-career.csv"


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

    season_df = pd.read_excel(XLSX, sheet_name="By Season")
    career_df = pd.read_excel(XLSX, sheet_name="Since 2006")

    season_df.columns = [normalize_column_name(col) for col in season_df.columns]
    career_df.columns = [normalize_column_name(col) for col in career_df.columns]

    rename = {"epadropback": "epa_per_dropback"}
    season_df = season_df.rename(columns=rename)
    career_df = career_df.rename(columns=rename)

    season_df.to_csv(OUT_SEASON, index=False)
    career_df.to_csv(OUT_CAREER, index=False)

    print(f"Wrote {OUT_SEASON} ({OUT_SEASON.stat().st_size:,} bytes, {len(season_df):,} rows)")
    print(f"Wrote {OUT_CAREER} ({OUT_CAREER.stat().st_size:,} bytes, {len(career_df):,} rows)")


if __name__ == "__main__":
    main()
