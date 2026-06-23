#!/usr/bin/env python3
"""Export Season-level sheet from INT Study v3.xlsx to int-luck-season.csv."""
import csv
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX_CANDIDATES = [
    ROOT / "INT Study v3.xlsx",
    Path.home() / "Desktop" / "INT Study v3.xlsx",
]
OUT = ROOT / "int-luck-season.csv"

HEADERS = [
    "season",
    "player_id",
    "player_name",
    "attempts",
    "turnover_worthy_plays",
    "interceptions",
    "ints_on_twps",
    "non_twp_ints",
    "expected_ints_twp",
    "expected_non_twp_int",
    "total_expected_ints",
    "net_luck",
    "total_dropped_interceptions",
    "dropped_int_twp",
    "twp_int_rate",
    "dropped_int_over_twps",
]


def col_idx(cell_ref: str) -> int:
    m = re.match(r"([A-Z]+)", cell_ref)
    letters = m.group(1)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    out = []
    for si in root.findall("m:si", ns):
        out.append("".join(t.text or "" for t in si.findall(".//m:t", ns)))
    return out


def read_season_rows(zf: zipfile.ZipFile, shared: list[str]) -> list[list[str]]:
    root = ET.fromstring(zf.read("xl/worksheets/sheet4.xml"))
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    rows: list[list[str]] = []
    for row in root.findall("m:sheetData/m:row", ns):
        cells: dict[int, str] = {}
        for c in row.findall("m:c", ns):
            ref = c.get("r")
            t = c.get("t")
            v = c.find("m:v", ns)
            if v is None or ref is None:
                continue
            val = v.text or ""
            if t == "s":
                val = shared[int(val)]
            cells[col_idx(ref)] = val
        if not cells:
            continue
        maxc = max(cells)
        arr = [""] * (maxc + 1)
        for i, val in cells.items():
            arr[i] = val
        rows.append(arr)
    return rows


def find_xlsx() -> Path:
    for path in XLSX_CANDIDATES:
        if path.is_file():
            return path
    raise FileNotFoundError(f"No INT Study v3.xlsx found in {XLSX_CANDIDATES}")


def main() -> None:
    xlsx = find_xlsx()
    with zipfile.ZipFile(xlsx) as zf:
        shared = read_shared_strings(zf)
        rows = read_season_rows(zf, shared)

    if not rows:
        raise RuntimeError("Season-level sheet is empty.")

    raw_headers = [h.strip().lower() for h in rows[0]]
    idx = {h: i for i, h in enumerate(raw_headers)}

    def get(row: list[str], *keys: str) -> str:
        for key in keys:
            i = idx.get(key)
            if i is not None and i < len(row):
                return row[i]
        return ""

    records = []
    for row in rows[1:]:
        season = get(row, "season")
        player_id = get(row, "passer_player_id")
        if not season or not player_id:
            continue
        records.append(
            {
                "season": season,
                "player_id": player_id,
                "player_name": get(row, "passer_name"),
                "attempts": get(row, "attempt"),
                "turnover_worthy_plays": get(row, "turnover_worthy_play"),
                "interceptions": get(row, "interception"),
                "ints_on_twps": get(row, "ints_on_twps"),
                "non_twp_ints": get(row, "non_twp_ints"),
                "expected_ints_twp": get(row, "expected_ints_twp"),
                "expected_non_twp_int": get(row, "expected_non_twp_int"),
                "total_expected_ints": get(row, "total_exp_int"),
                "net_luck": get(row, "net luck"),
                "total_dropped_interceptions": get(row, "total_dropped_interceptions"),
                "dropped_int_twp": get(row, "dropped_int_twp"),
                "twp_int_rate": get(row, "twp→int%"),
                "dropped_int_over_twps": get(row, "dropped_int_over_twps"),
            }
        )

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(records)

    print(f"Wrote {OUT} ({len(records)} rows) from {xlsx}")


if __name__ == "__main__":
    main()
