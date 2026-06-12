# 2026 NFL QB Annual — Project Guide

This document explains what the **2026 NFL QB Annual** app is, how it works, how metrics and ranks are calculated, and which spreadsheet feeds power each profile section.

---

## What this is

The **2026 NFL QB Annual** is a standalone browser app for building rich, interactive quarterback profiles from PFF-style CSV/Excel exports. You pick a QB in the sidebar, preview a full profile (desktop ~1100px wide), and copy or download the generated HTML for articles or internal use.

**Your spreadsheets are the source of truth.** The app does not call PFF APIs at runtime. It loads bundled CSV text (for opening `index.html` directly) or fetches CSV files from a local server, parses them in the browser, and assembles one profile per quarterback.

**Default quarterback for testing:** Josh Allen (`player_id` 46601).

---

## How to run

### Option A — Open directly (bundled data)

```bash
cd "/Users/markchichester/Desktop/2026 NFL QB Annual"
python3 scripts/bundle-data.py   # after any CSV update
open index.html
```

Bundled data lives in `js/bundled-data.js` (auto-generated; do not edit by hand).

### Option B — Local server (live CSV updates)

```bash
cd "/Users/markchichester/Desktop/2026 NFL QB Annual"
python3 -m http.server 8766
# http://localhost:8766
```

Use the sidebar file uploads to override any feed without rebundling.

### After updating Excel workbooks

Some feeds come from `.xlsx` files. Re-export, then rebundle:

```bash
python3 scripts/export-qb-alignment.py      # QB Alignment.xlsx → qb-alignment.csv
python3 scripts/export-throw-type.py        # Throw type.xlsx → throw-type.csv
python3 scripts/export-target-alignment.py  # → target-alignment.csv
python3 scripts/export-clutch.py            # Clutch 2025.xlsx → clutch-2025.csv
python3 scripts/export-qb-war-season.py     # → qb-war-season.csv
python3 scripts/export-accuracy-by-depth.py
python3 scripts/export-epa-per-play.py
python3 scripts/export-target-map.py
python3 scripts/export-int-luck.py
python3 scripts/bundle-data.py
```

---

## Architecture (high level)

```
CSV / Excel exports
        ↓
scripts/bundle-data.py  →  js/bundled-data.js
        ↓
js/api.js               →  parse feeds, build rank pools, assemble profile object
        ↓
js/profile.js           →  HTML + CSS for each section
        ↓
js/app.js               →  sidebar, preview, copy/download HTML
```

| File | Role |
|------|------|
| `index.html` | App shell, settings sidebar, preview canvas |
| `js/api.js` | All CSV parsing, rank logic, `buildProfile()` |
| `js/profile.js` | Section markup, tables, charts, donuts, carousels |
| `js/app.js` | QB search, uploads, render loop, HTML export |
| `js/teams.js` | `franchise_id` → team nickname + accent color |
| `js/bundled-data.js` | Embedded CSV text for `file://` usage |
| `js/target-map-api.js` / `js/target-map.js` | Play-level target scatter map |
| `js/route-tree-api.js` / `js/route-tree.js` | Route concept tree |
| `scripts/bundle-data.py` | Bundles all default CSVs into `bundled-data.js` |

**Player matching:** Rows are matched primarily by `player_id`, with fallback to normalized player name (lowercase, collapsed whitespace).

**Team colors & headshot:** `franchise_id` from passing summary → `js/teams.js`. Headshot URL: `https://media.pff.com/player-photos/nfl/{player_id}.webp`.

---

## Shared calculation rules

These rules apply across many sections. Understanding them explains most “why is this rank X?” questions.

### Included in rank?

Many feeds have an **`Included in rank?`** column. A QB counts as qualifying when the value is `1`, `1.0`, `yes`, or `true`.

- **Rank pools** are built only from qualifying rows (unless noted below).
- If a QB is **not** qualifying, their value still displays but rank shows **—**.

### How rank is computed

1. Build a **rank pool**: all qualifying QBs with a valid value for that metric.
2. Sort the pool:
   - **Higher is better** (grades, YPA, BTT%, ACC%, etc.) → descending
   - **Lower is better** (TWP%, Neg %, P2S%, QB fault pressure share, etc.) → ascending
3. Find the QB’s position in the sorted list → **1-based rank**.
4. Display as ordinal (`1st`, `2nd`, `3rd`, …) with total pool size (`8/43`).

Rank bar width in tables: `(rankTotal - rank + 1) / rankTotal × 100`.

### Percent / decimal parsing

| Helper | Rule |
|--------|------|
| `parseShareDecimal` | If \|value\| ≤ 1.5, treat as decimal and × 100 (e.g. `0.065` → 6.5%). Otherwise use as-is. |
| `parsePct` | Strips `%` and parses number; used for grading profile and distribution buckets. |
| `parsePlusMetric` | If \|value\| ≤ 2, × 100 (PLUS% scale). |

### Qualifying pool overrides (by section)

| Section | Qualifying pool source |
|---------|------------------------|
| Passing summary donuts (grade, TTT, ADOT, P2S) | `Included in rank?` in passing summary for that **season** |
| Passing grades — Situation / Throw type / Target alignment | `Included in rank?` on that feed’s row |
| Passing grades — Reads | QBs with `Included in rank? = 1` on **Passing grades by situation** |
| Passing grades — Coverage | `Included in rank?` on each coverage row |
| Accuracy — Incompletions | QBs qualifying on **QB Accuracy.csv** |
| Allowed pressures | QBs qualifying on **passing summary** for hero season |
| Clutch moments | `Included in rank?` on **clutch-2025.csv** |
| QB alignment | `Included in rank?` on **qb-alignment.csv** |
| Rushing | `Included in rank?` on **rushing_summary.csv** |
| EPA season league avg | QBs with **≥ 200** dropbacks that season |
| EPA career league avg | QBs with **≥ 1,000** career dropbacks |

---

## Profile section order

Sections appear in this order in the preview (top → bottom):

1. Hero banner  
2. PFF grade by season (+ WAR carousel if available)  
3. EPA per dropback  
4. Game grades  
5. Play-level grade distribution  
6. Grading profile (scatter charts)  
7. Grades by throw type and situation  
8. Accuracy  
9. QB alignment  
10. Stable / unstable metrics  
11. Passing splits (pressure, blitz, concept, time in pocket)  
12. Allowed pressures  
13. Rushing  
14. Interception luck  
15. Target maps (depth, accuracy, routes, scatter)  
16. Average time to throw (2023–2025 donuts)  
17. Average target depth (2023–2025 donuts)  
18. Pressure to sack rate (2023–2025 donuts)  
19. **Clutch moments** (final section)

---

## Section reference: data → display

### 1. Hero banner

| Source | `passing-summary-23-25.csv` |
|--------|-------------------------------|
| Season | Sidebar **Hero stat season** (`displaySeason`, default 2025) |
| Stats shown | Overall grade (`grades_pass`), attempts, completions, yards, TDs, INTs |
| Team / colors | `franchise_id`, `team_name` from passing summary → `js/teams.js` |

No ranks in the hero row.

---

### 2. PFF grade by season (+ WAR)

| Source (grades) | `passing-summary-23-25.csv` |
|-----------------|-----------------------------|
| Source (WAR) | `qb-war-season.csv` |
| Years | 2023, 2024, 2025 |
| Grade rank | Among passing-summary rows with `Included in rank? = 1` for that season, sorted by `grades_pass` desc |
| WAR rank | Precomputed in CSV column `war_rank` (parsed as `N of M`) |

**Key columns:** `player`, `player_id`, `Season`, `Included in rank?`, `grades_pass`, `franchise_id`

---

### 3. EPA per dropback

| Source (season) | `epa-per-play-season.csv` |
|-----------------|----------------------------|
| Source (career) | `epa-per-play-career.csv` |
| Player match | `passer_name` (name key) |
| Season chart | QB EPA/dropback vs league avg per season |
| League avg | Weighted EPA/dropback across QBs with **≥ 200** dropbacks that season |
| Career card | Career EPA/dropback vs league avg ( **≥ 1,000** dropbacks ) |

**Key columns:** `passer_name`, `season`, `dropbacks`, `total_epa`, `epa_per_dropback`

If `epa_per_dropback` is missing, it is computed as `total_epa / dropbacks`.

---

### 4. Game grades

| Source | `game_grade_feed.csv` |
|--------|----------------------|
| Opponents | `opponents.csv` (merged by week) |
| Season | Sidebar **Game grade season** (default 2025) |
| Grade used | `pass` grade for **QB** rows |

Interactive bar chart: click a week for opponent + stat line modal.

---

### 5. Play-level grade distribution

| Source | `grade-distribution.csv` |
|--------|--------------------------|
| Buckets | −2, −1.5, −1, −0.5, 0, +0.5, +1, +1.5, +2 (play-level grades) |
| Denominator | `no play dropbacks` (or similar column) |

Shows share of dropbacks in each play-grade bucket as a histogram-style chart.

---

### 6. Grading profile

| Source | `grading profile.csv` |
|--------|----------------------|
| Charts | (1) BTT% vs TWP% · (2) Pos % vs Neg % |
| Pass grade overlay | From feed `pass grd`, or passing summary 2025 if missing |

**Key columns:** `player` / name, `player_id`, `btt%`, `twp%`, `pos %`, `neg %`, `pass grd`

Each chart plots all QBs in the feed; featured QB is highlighted. League average lines are unweighted means of plotted points.

---

### 7. Grades by throw type and situation

Carousel with five tabs. All use **passing grade + attempt volume + rank** table layout.

#### Tab: Situation

| Source | `Passing grades by situation.csv` |
|--------|-----------------------------------|
| Groups | Pressure, blitz, screen, play-action, time in pocket, alignment, safety shell, down & situation |
| Rank pool | Rows with `Included in rank? = 1`; sorted by grade desc per column |

Wide format: each situation has a grade column and matching `… att` / `… atts` attempt column.

#### Tab: Throw type

| Source | `throw-type.csv` (from `Throw type.xlsx`) |
|--------|-------------------------------------------|
| Export | `python3 scripts/export-throw-type.py` |

Same wide grade + attempts parsing as situation.

#### Tab: Reads

| Source | `Reads.csv` |
|--------|-------------|
| Rank pool | QBs qualifying on **situation** feed (`Included in rank? = 1`) |
| Rows | One row per read type per QB |

#### Tab: Coverage

| Source | `Throws vs. coverage.csv` |
|--------|---------------------------|
| Rank pool | Per-row `Included in rank? = 1` |
| Rows | One row per coverage type per QB |

#### Tab: Target alignment

| Source | `target-alignment.csv` (from Excel export) |
|--------|--------------------------------------------|
| Shows | Grades by receiver alignment (not QB dropback alignment) |

---

### 8. Accuracy

Two carousel tabs.

#### Tab: Accuracy rates

| Source | `QB Accuracy.csv` |
|--------|-------------------|
| Metrics | PLUS%, ACC%, Catchable incompletion %, Uncatchable incompletion %, Other % |
| Rank pool | Rows with `Included in rank? = 1` on this file |

PLUS% uses signed display (`+X.X%` / `−X.X%`).

#### Tab: Incompletions

| Source | `Incompletion rates.csv` |
|--------|--------------------------|
| Display | Cause label, count, share of incompletions, rank |
| Rank pool | Filtered to QBs qualifying on **QB Accuracy.csv** |
| Sort | Causes sorted by count descending |
| Higher-is-better exceptions | Receiver error, defensive causes rank higher when share is higher |

Categories are auto-detected: count column + matching `%` column pairs.

---

### 9. QB alignment

| Source | `qb-alignment.csv` (from `QB Alignment.xlsx`) |
|--------|-----------------------------------------------|
| Types | Shotgun, pistol, under center |
| Display | Stacked mix bar + table: dropbacks, share, rank |
| Rank pool | `Included in rank? = 1` on alignment file; higher share = better rank |

**Not the same as** “Target alignment” in passing grades (receiver alignment).

---

### 10. Stable / unstable metrics

| Source | `Stable and unstable.csv` |
|--------|---------------------------|
| Display | Horizontal percentile bars (0–100) |
| Match | Player **name** only |

**Stable columns:** clean-pocket grade, standard-dropback grade, grade on 1st & 2nd down, grade with no play-action, negatively graded play rate.

**Unstable columns:** positively graded throw rate, pressured-passing grade, outside-the-pocket grade, 3rd & 4th down grade, play-action grade, at/beyond the sticks grade, sack rate.

Values in the CSV are treated as percentiles (clamped 0–100).

---

### 11. Passing splits

Combines three CSV feeds into one carousel.

| Split | Source file | Left vs right |
|-------|-------------|---------------|
| Clean pocket vs under pressure | `passing_pressure.csv` | `no_pressure_*` vs `pressure_*` |
| Not blitzed vs blitzed | `passing_pressure.csv` | `no_blitz_*` vs `blitz_*` |
| No play-action vs play-action | `passing_concept.csv` | `npa_*` vs `pa_*` |
| No screen vs screen | `passing_concept.csv` | `no_screen_*` vs `screen_*` |
| Under 2.5s vs 2.5s+ | `time_in_pocket.csv` | `less_*` vs `more_*` |

Each split shows: pass grades both sides, grade delta, dropback counts, and highlight stats — completion %, YPA, BTT rate, TWP rate, sack rate — with higher/lower-better coloring on the better side.

Column naming: `{prefix}_{field}` (e.g. `pressure_grades_pass`, `no_blitz_dropbacks`).

---

### 12. Allowed pressures

| Source | `passing_allowed_pressure.csv` |
|--------|--------------------------------|
| Summary | Pressures allowed, pressure dropbacks, hits, hurries, sacks |
| Blame table | Center, guards, tackles, TE, QB fault, other — count + share + rank |
| Rank pool | QBs qualifying on **passing summary** for hero season |
| QB fault | Lower share = better rank |

Aggregate columns `pressures_ol_te` / `ol_te_percent` are **not** shown (they overlap individual OL/TE sources).

---

### 13. Rushing

| Source | `rushing_summary.csv` |
|--------|------------------------|
| Carousel tabs | Overview, designed vs scramble, elusiveness, explosiveness, gap vs zone |
| Rank pool | `Included in rank? = 1` on rushing file |

**Overview hero:** run grade. **Metrics include:** yards, attempts, YPA, TDs, first downs, fumbles, designed/scramble splits, elusive rating, breakaway runs, gap/zone attempts, etc.

Designed YPA = `designed_yards / (attempts - scrambles)`. Scramble YPA = `scramble_yards / scrambles`.

---

### 14. Interception luck

| Source | `int-luck-season.csv` |
|--------|------------------------|
| Season | Hero stat season |

**Derived display metrics:**

- Attempts, TWPs, total INTs  
- INTs on TWPs vs “clean” attempts  
- Expected INTs (TWP and non-TWP buckets)  
- Net luck, luck on bad throws, luck on good throws  
- Dropped INTs  
- League INT rates on TWP vs clean attempts  

Formulas in `buildInterceptionLuckModel()` (`js/api.js`):

- `cleanAttempts = attempts - twps`  
- `luckOnBad = expectedTwps - intsOnTwps`  
- `luckOnGood = expectedClean - nonTwpInts`  
- `leagueTwpIntRate = expectedTwps / twps`  
- `leagueCleanIntRate = expectedClean / cleanAttempts`  

---

### 15. Target maps

Multi-tab section combining four feeds:

| Tab | Source | What it shows |
|-----|--------|---------------|
| Target depth | `passing_depth.csv` | 3×4 grid (left/center/right × depth bands): grade, attempts, comp%, YPA, EPA, etc. |
| Accuracy by depth | `accuracy-by-depth.csv` | Accuracy metrics by field zone vs league |
| Route tree | `route-data.csv` | Passing stats by route concept |
| Target map | `target-map.csv` | Interactive scatter of individual throws (filters, stat line) |

**Target depth grid rows:** 20+, 10–19, 0–9, behind LOS. **Columns:** outside left, between numbers, outside right.

---

### 16–18. Season metric donuts (TTT, ADOT, P2S)

All three use **`passing-summary-23-25.csv`** for 2023–2025.

| Section | Column | Rank direction |
|---------|--------|----------------|
| Average time to throw | `avg_time_to_throw` | Lower is better |
| Average target depth | `avg_depth_of_target` | Higher is better |
| Pressure to sack rate | `pressure_to_sack_rate` | Lower is better |

Rank pools: qualifying QBs (`Included in rank? = 1`) per season. Click donut center for full ranking modal.

---

### 19. Clutch moments

| Source | `clutch-2025.csv` (from `Clutch 2025.xlsx`) |
|--------|---------------------------------------------|
| Export | `python3 scripts/export-clutch.py` |
| Context | Clutch-situation dropbacks (`DB` column) |

**Metrics shown (value + rank if qualifying):**

| Label | CSV column | Rank direction |
|-------|------------|----------------|
| Pass grade | `PASS GRD` | Higher |
| YPA | `PASS YPA` | Higher |
| BTT% | `BTT%` | Higher |
| TWP% | `TWP%` | Lower |
| Pos % | `Pos %` | Higher |
| Neg % | `Neg %` | Lower |
| ACC% | `ACC%` | Higher |
| P2S% | `P2S%` | Lower |

Rank pool: rows with `Included in rank? = 1` on the clutch file (~43 QBs in 2025). Non-qualifying QBs see values but rank **—**.

---

## Complete data file index

| Bundled key | Default file(s) | Powers |
|-------------|-----------------|--------|
| `passingSummaryText` | `passing-summary-23-25.csv` | Hero, season donuts, QB list, allowed-pressure rank pool |
| `gameGradeFeedText` | `game_grade_feed.csv` | Weekly game grades |
| `gradeDistributionFeedText` | `grade-distribution.csv` | Play-level grade distribution |
| `opponentsFeedText` | `opponents.csv` | Game grade opponents |
| `gradingProfileFeedText` | `grading profile.csv` | Grading profile scatter charts |
| `stableUnstableFeedText` | `Stable and unstable.csv` | Stable/unstable percentiles |
| `passingPressureFeedText` | `passing_pressure.csv` | Pressure & blitz splits |
| `passingConceptFeedText` | `passing_concept.csv` | Play-action & screen splits |
| `timeInPocketFeedText` | `time_in_pocket.csv` | Time in pocket split |
| `intLuckFeedText` | `int-luck-season.csv` | Interception luck |
| `passingDepthFeedText` | `passing_depth.csv` | Target depth grid |
| `accuracyByDepthFeedText` | `accuracy-by-depth.csv` | Accuracy by depth |
| `generalAccuracyFeedText` | `general-accuracy.csv` | (Supporting accuracy data) |
| `qbAccuracyFeedText` | `QB Accuracy.csv` | Accuracy rates tab |
| `incompletionRatesFeedText` | `Incompletion rates.csv` | Incompletions tab |
| `qbAlignmentFeedText` | `qb-alignment.csv` | QB dropback alignment |
| `allowedPressureFeedText` | `passing_allowed_pressure.csv` | Allowed pressures |
| `clutchFeedText` | `clutch-2025.csv` | Clutch moments |
| `routeDataFeedText` | `route-data.csv` | Route tree tab |
| `targetMapFeedText` | `target-map.csv` | Target map scatter |
| `epaSeasonFeedText` | `epa-per-play-season.csv` | EPA season chart |
| `epaCareerFeedText` | `epa-per-play-career.csv` | EPA career card |
| `warSeasonFeedText` | `qb-war-season.csv` | WAR donuts |
| `rushingSummaryFeedText` | `rushing_summary.csv` | Rushing section |
| `passingGradesSituationFeedText` | `Passing grades by situation.csv` | Situation grades tab |
| `passingGradesReadsFeedText` | `Reads.csv` | Reads tab |
| `passingGradesCoverageFeedText` | `Throws vs. coverage.csv` | Coverage tab |
| `targetAlignmentFeedText` | `target-alignment.csv` | Target alignment tab |
| `throwTypeFeedText` | `throw-type.csv` | Throw type tab |

---

## Export scripts

| Script | Input | Output |
|--------|-------|--------|
| `scripts/bundle-data.py` | All CSVs above | `js/bundled-data.js` |
| `scripts/export-clutch.py` | `Clutch 2025.xlsx` | `clutch-2025.csv` |
| `scripts/export-qb-alignment.py` | `QB Alignment.xlsx` | `qb-alignment.csv` |
| `scripts/export-throw-type.py` | `Throw type.xlsx` | `throw-type.csv` |
| `scripts/export-target-alignment.py` | Target alignment workbook | `target-alignment.csv` |
| `scripts/export-qb-war-season.py` | WAR workbook | `qb-war-season.csv` |
| `scripts/export-accuracy-by-depth.py` | Accuracy workbook | `accuracy-by-depth.csv` |
| `scripts/export-epa-per-play.py` | EPA workbook | `epa-per-play-*.csv` |
| `scripts/export-target-map.py` | Target map workbook | `target-map.csv` |
| `scripts/export-int-luck.py` | INT luck workbook | `int-luck-season.csv` |
| `scripts/build-export-bundle.py` | JS sources | `js/export-bundle-source.js` (for standalone HTML export) |

---

## UI patterns

- **Collapsible sections** — Most profile blocks expand/collapse.  
- **Carousels** — Swipe or tab between related views (accuracy, passing grades, rushing, splits, target maps, season donuts).  
- **Ranked tables** — Grade pills, volume bars, rank bars; top-3 rows highlighted.  
- **Modals** — Season rankings (donut click), game grade details (bar click).  
- **Team accent** — Sidebar bar color tints tables, bars, and rank accents.  
- **Desktop width** — Profile max width 1100px; preview toggles desktop/mobile in app.

---

## Status panel & missing data

`buildProfile()` collects non-fatal errors when a feed has no row for the selected QB. These appear in the sidebar status list as warnings. The profile still renders whatever sections have data.

Common causes: QB not in that CSV, name/id mismatch, or CSV not bundled/uploaded.

---

## What this app does *not* do

- No live PFF API or auto-refresh when spreadsheets change (re-export + rebundle manually).  
- No batch “export all 32 QBs” in one click (one QB at a time via sidebar).  
- Excel (`.xlsx`) is not read in the browser — export to CSV first (or use the Python export scripts).  
- Published HTML is static; interactivity in the preview (carousels, modals, target map filters) requires the bundled JS/CSS in the export flow.

---

## Quick troubleshooting

| Problem | Fix |
|---------|-----|
| “Bundled CSV data is missing” | Run `python3 scripts/bundle-data.py` |
| Section empty after xlsx update | Run the matching `export-*.py`, then rebundle |
| Wrong ranks | Check `Included in rank?` on the relevant feed |
| QB not found | Confirm `player_id` in passing summary; try name search |
| Percent looks wrong | Source may be decimal (0.065) — app auto-converts when \|n\| ≤ 1.5 |

---

*Last updated to match the profile as built in the 2026 NFL QB Annual folder, including Clutch moments as the final section.*
