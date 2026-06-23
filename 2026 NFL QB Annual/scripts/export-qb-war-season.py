#!/usr/bin/env python3
"""Export QB WAR by season for the QB Annual app (2023–2025)."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/markchichester/Desktop/PFFWAR/2006-25.csv")
OUT = ROOT / "qb-war-season.csv"
DISPLAY_YEARS = {2023, 2024, 2025}


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing source CSV: {SOURCE}")

    rows = []
    with SOURCE.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if row.get("position") != "QB":
                continue
            season = int(row["season"])
            if season not in DISPLAY_YEARS:
                continue
            rows.append(
                {
                    "season": season,
                    "player_id": row["player_id"],
                    "player": row["player"],
                    "team": row["team"],
                    "snaps": row["snaps"],
                    "war": row["war"],
                    "war_rank": row["war_rank"],
                }
            )

    rows.sort(key=lambda row: (row["season"], row["player"]))

    with OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "season",
                "player_id",
                "player",
                "team",
                "snaps",
                "war",
                "war_rank",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    seasons = sorted({row["season"] for row in rows})
    print(f"Wrote {OUT} ({len(rows):,} QB rows, seasons {seasons[0]}–{seasons[-1]})")


if __name__ == "__main__":
    main()
