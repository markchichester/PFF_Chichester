/**
 * QB Annual — parse spreadsheets and build profile data.
 */
(function (global) {
  const PASSING_SUMMARY_URLS = [
    "passing-summary-23-25.csv",
    encodeURI("passing summary 23-25.csv"),
  ];
  const GAME_GRADE_FEED_URL = "game_grade_feed.csv";
  const GRADE_DISTRIBUTION_URL = "grade-distribution.csv";
  const OPPONENTS_URL = "opponents.csv";
  const GRADING_PROFILE_URLS = [
    "grading-profile.csv",
    encodeURI("grading profile.csv"),
  ];
  const STABLE_UNSTABLE_URLS = [
    "stable-unstable.csv",
    encodeURI("Stable and unstable.csv"),
  ];
  const PASSING_PRESSURE_URL = "passing_pressure.csv";
  const PASSING_CONCEPT_URL = "passing_concept.csv";
  const TIME_IN_POCKET_URL = "time_in_pocket.csv";
  const RUSHING_SUMMARY_URL = "rushing_summary.csv";
  const PASSING_GRADES_SITUATION_URLS = [
    "Passing grades by situation.csv",
    encodeURI("Passing grades by situation.csv"),
  ];
  const PASSING_GRADES_READS_URLS = ["Reads.csv", "reads.csv"];
  const PASSING_GRADES_COVERAGE_URLS = [
    "Throws vs. coverage.csv",
    encodeURI("Throws vs. coverage.csv"),
    "throws-vs-coverage.csv",
  ];
  const TARGET_ALIGNMENT_URLS = [
    "target-alignment.csv",
    encodeURI("Target alignment.csv"),
  ];
  const THROW_TYPE_URLS = [
    "throw-type.csv",
    encodeURI("Throw type.csv"),
  ];
  const INT_LUCK_URL = "int-luck-season.csv";
  const EPA_SEASON_URL = "epa-per-play-season.csv";
  const EPA_CAREER_URL = "epa-per-play-career.csv";
  const PASSING_DEPTH_URL = "passing_depth.csv";
  const ACCURACY_BY_DEPTH_URL = "accuracy-by-depth.csv";
  const GENERAL_ACCURACY_URLS = [
    "general-accuracy.csv",
    encodeURI("General accuracy.csv"),
  ];
  const QB_ACCURACY_URLS = [
    "QB Accuracy.csv",
    encodeURI("QB Accuracy.csv"),
    "qb-accuracy.csv",
  ];
  const INCOMPLETION_RATES_URLS = [
    "Incompletion rates.csv",
    encodeURI("Incompletion rates.csv"),
    "incompletion-rates.csv",
  ];
  const QB_ALIGNMENT_URLS = [
    "qb-alignment.csv",
    encodeURI("QB Alignment.csv"),
  ];
  const ALLOWED_PRESSURE_URLS = [
    "passing_allowed_pressure.csv",
    encodeURI("passing allowed pressure.csv"),
  ];
  const ALLOWED_PRESSURE_SOURCES = [
    { id: "ce", label: "Center", countKey: "pressures_ce", shareKey: "ce_percent" },
    { id: "lg", label: "Left guard", countKey: "pressures_lg", shareKey: "lg_percent" },
    { id: "lt", label: "Left tackle", countKey: "pressures_lt", shareKey: "lt_percent" },
    { id: "rg", label: "Right guard", countKey: "pressures_rg", shareKey: "rg_percent" },
    { id: "rt", label: "Right tackle", countKey: "pressures_rt", shareKey: "rt_percent" },
    { id: "te", label: "Tight end", countKey: "pressures_te", shareKey: "te_percent" },
    { id: "self", label: "QB fault", countKey: "pressures_self", shareKey: "self_percent", lowerBetter: true },
    { id: "other", label: "Other", countKey: "pressures_other", shareKey: "other_percent" },
  ];
  const CLUTCH_URLS = [
    "clutch-2025.csv",
    encodeURI("Clutch 2025.csv"),
  ];
  const CLUTCH_METRICS = [
    { id: "passGrd", label: "Pass grade", column: "pass grd", format: "grade", higherBetter: true },
    { id: "ypa", label: "YPA", column: "pass ypa", format: "ypa", higherBetter: true },
    { id: "bttPct", label: "BTT%", column: "btt%", format: "pct", higherBetter: true },
    { id: "twpPct", label: "TWP%", column: "twp%", format: "pct", higherBetter: false },
    { id: "posPct", label: "Pos %", column: "pos %", format: "pct", higherBetter: true },
    { id: "negPct", label: "Neg %", column: "neg %", format: "pct", higherBetter: false },
    { id: "accPct", label: "ACC%", column: "acc%", format: "pct", higherBetter: true },
    { id: "p2sPct", label: "P2S%", column: "p2s%", format: "pct", higherBetter: false },
  ];
  const QB_ALIGNMENT_TYPES = [
    { id: "shotgun", label: "Shotgun", countKey: "shotgun", shareKey: "shotgun %" },
    { id: "pistol", label: "Pistol", countKey: "pistol", shareKey: "pistol %" },
    {
      id: "under-center",
      label: "Under center",
      countKey: "under center",
      shareKey: "under center %",
    },
  ];
  const QB_ACCURACY_METRICS = [
    { id: "plus", label: "PLUS%", header: "plus%", format: "plus", higherBetter: true },
    { id: "acc", label: "ACC%", header: "acc%", format: "pct", higherBetter: true },
    {
      id: "cat-inac",
      label: "Catchable incompletion",
      header: "cat inac%",
      format: "pct",
      higherBetter: false,
    },
    {
      id: "unc-inac",
      label: "Uncatchable incompletion",
      header: "unc inac%",
      format: "pct",
      higherBetter: false,
    },
    { id: "other", label: "Other", header: "other%", format: "pct", higherBetter: false },
  ];
  const WAR_SEASON_URL = "qb-war-season.csv";
  const WAR_DISPLAY_YEARS = [2023, 2024, 2025];
  const GENERAL_ACCURACY_BUCKETS = [
    { key: "behind_los", label: "BLOS" },
    { key: "short", label: "0–9 yds" },
    { key: "medium", label: "10–19 yds" },
    { key: "deep", label: "20+ yds" },
  ];
  const SEASON_EPA_MIN_DROPBACKS = 200;
  const CAREER_EPA_MIN_DROPBACKS = 1000;
  const DEPTH_COLS = [
    { key: "left", label: "Outside left" },
    { key: "center", label: "Between numbers" },
    { key: "right", label: "Outside right" },
  ];
  const DEPTH_ROWS = [
    { key: "deep", label: "20+", desc: "20+ yards" },
    { key: "medium", label: "10–19", desc: "10–19 yards" },
    { key: "short", label: "0–9", desc: "0–9 yards" },
    { key: "behind_los", label: "BH LOS", desc: "Behind LOS" },
  ];
  const DEPTH_DETAIL_FIELDS = [
    { field: "grades_pass", label: "PFF passing grade", format: "grade" },
    { field: "attempts", label: "Attempts", format: "int" },
    { field: "attempts_percent", label: "Share of attempts", format: "pct" },
    { field: "completions", label: "Completions", format: "int" },
    { field: "completion_percent", label: "Completion %", format: "pct" },
    { field: "yards", label: "Yards", format: "int" },
    { field: "ypa", label: "YPA", format: "decimal" },
    { field: "touchdowns", label: "Touchdowns", format: "int" },
    { field: "interceptions", label: "Interceptions", format: "int" },
    { field: "first_downs", label: "First downs", format: "int" },
    { field: "qb_rating", label: "Passer rating", format: "decimal" },
    { field: "btt_rate", label: "BTT rate", format: "pct" },
    { field: "twp_rate", label: "TWP rate", format: "pct" },
    { field: "avg_depth_of_target", label: "Avg depth of target", format: "decimal" },
    { field: "epa", label: "EPA per play", format: "signed" },
    { field: "drop_rate", label: "Drop rate", format: "pct" },
  ];
  const PASSING_SPLIT_HIGHLIGHTS = [
    { field: "completion_percent", label: "Completion %", format: "pct", higherBetter: true },
    { field: "ypa", label: "YPA", format: "decimal", higherBetter: true },
    { field: "btt_rate", label: "BTT rate", format: "pct", higherBetter: true },
    { field: "twp_rate", label: "TWP rate", format: "pct", higherBetter: false },
    { field: "sack_percent", label: "Sack rate", format: "pct", higherBetter: false },
  ];
  const PASSING_SPLITS = [
    {
      id: "pressure",
      title: "Clean pocket vs under pressure",
      shortTitle: "Pressure",
      leftPrefix: "no_pressure",
      leftLabel: "Clean pocket",
      rightPrefix: "pressure",
      rightLabel: "Under pressure",
    },
    {
      id: "blitz",
      title: "Not blitzed vs blitzed",
      shortTitle: "Blitz",
      leftPrefix: "no_blitz",
      leftLabel: "Not blitzed",
      rightPrefix: "blitz",
      rightLabel: "Blitzed",
    },
  ];
  const PASSING_CONCEPT_SPLITS = [
    {
      id: "play-action",
      title: "No play-action vs play-action",
      shortTitle: "Play-action",
      leftPrefix: "npa",
      leftLabel: "No play-action",
      rightPrefix: "pa",
      rightLabel: "Play-action",
    },
    {
      id: "screen",
      title: "No screen vs screen",
      shortTitle: "Screen",
      leftPrefix: "no_screen",
      leftLabel: "No screen",
      rightPrefix: "screen",
      rightLabel: "Screen",
    },
  ];
  const PASSING_TIME_IN_POCKET_SPLITS = [
    {
      id: "time-in-pocket",
      title: "Under 2.5 seconds vs 2.5 seconds or more",
      shortTitle: "Time in pocket",
      leftPrefix: "less",
      leftLabel: "Under 2.5 sec",
      rightPrefix: "more",
      rightLabel: "2.5 sec or more",
    },
  ];
  const STABLE_METRIC_COLUMNS = [
    { header: "clean-pocket grade", label: "Clean-pocket grade" },
    { header: "standard-dropback grade", label: "Standard-dropback grade" },
    { header: "grade on first and second down", label: "Grade on 1st & 2nd down" },
    { header: "grade on plays with no play-action", label: "Grade with no play-action" },
    { header: "negatively graded play rate", label: "Negatively graded play rate" },
  ];
  const UNSTABLE_METRIC_COLUMNS = [
    { header: "positively graded throw rate", label: "Positively graded throw rate" },
    { header: "pressured-passing grade", label: "Pressured-passing grade" },
    { header: "grade on passes thrown from outside the pocket", label: "Outside-the-pocket grade" },
    { header: "grade on third and fourth down", label: "Grade on 3rd & 4th down" },
    { header: "grade on play-action plays", label: "Play-action grade" },
    { header: "grade on passes thrown at or beyond the first-down marker", label: "At/beyond the sticks grade" },
    { header: "sack rate", label: "Sack rate" },
  ];
  const SEASON_DONUT_YEARS = [2023, 2024, 2025];
  const GRADE_BUCKETS = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];

  let passingSummaryState = null;
  let passingSummaryPromise = null;
  let gameGradeFeedState = null;
  let gameGradeFeedPromise = null;
  let gradeDistributionState = null;
  let gradeDistributionPromise = null;
  let opponentsState = null;
  let opponentsPromise = null;
  let gradingProfileState = null;
  let gradingProfilePromise = null;
  let stableUnstableState = null;
  let stableUnstablePromise = null;
  let passingPressureState = null;
  let passingPressurePromise = null;
  let passingConceptState = null;
  let passingConceptPromise = null;
  let timeInPocketState = null;
  let timeInPocketPromise = null;
  let intLuckState = null;
  let intLuckPromise = null;
  let epaPerPlayState = null;
  let epaPerPlayPromise = null;
  let passingDepthState = null;
  let passingDepthPromise = null;
  let accuracyByDepthState = null;
  let accuracyByDepthPromise = null;
  let generalAccuracyState = null;
  let generalAccuracyPromise = null;
  let warSeasonState = null;
  let warSeasonPromise = null;
  let rushingSummaryState = null;
  let rushingSummaryPromise = null;
  let passingGradesSituationState = null;
  let passingGradesSituationPromise = null;
  let passingGradesReadsState = null;
  let passingGradesReadsPromise = null;
  let passingGradesCoverageState = null;
  let passingGradesCoveragePromise = null;
  let targetAlignmentState = null;
  let targetAlignmentPromise = null;
  let throwTypeState = null;
  let throwTypePromise = null;
  let qbAccuracyState = null;
  let qbAccuracyPromise = null;
  let incompletionRatesState = null;
  let incompletionRatesPromise = null;
  let qbAlignmentState = null;
  let qbAlignmentPromise = null;
  let allowedPressureState = null;
  let allowedPressurePromise = null;
  let clutchState = null;
  let clutchPromise = null;
  let lastLoadErrors = [];

  function feedOverride(text) {
    return typeof text === "string" && text.trim() ? text : null;
  }

  async function fetchCsvText(urls, label, bundledKey) {
    const bundled = bundledKey && global.QbAnnualBundledData?.[bundledKey];
    if (global.location?.protocol === "file:" && bundled) {
      return bundled;
    }

    const candidates = Array.isArray(urls) ? urls : [urls];
    let lastError = null;

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          lastError = new Error(`${label} returned HTTP ${res.status} for ${url}`);
          continue;
        }
        return await res.text();
      } catch (err) {
        lastError = err;
      }
    }

    if (bundled) return bundled;

    const detail = lastError?.message ? `: ${lastError.message}` : "";
    throw new Error(`Could not load ${label}${detail}`);
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
          continue;
        }
        inQuote = !inQuote;
        continue;
      }
      if (ch === "," && !inQuote) {
        out.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  function headerIndex(headers) {
    const map = {};
    headers.forEach((h, i) => {
      map[String(h || "").trim().toLowerCase()] = i;
    });
    return map;
  }

  function cell(row, idx, key) {
    const i = idx[key];
    if (i == null) return "";
    return String(row[i] ?? "").trim();
  }

  function parseNum(raw) {
    const n = parseFloat(String(raw ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function isRankIncluded(raw) {
    const v = String(raw ?? "").trim().toLowerCase();
    return v === "1" || v === "1.0" || v === "yes" || v === "true";
  }

  function normalizePlayerKey(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function ordinal(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
    const mod10 = num % 10;
    if (mod10 === 1) return `${num}st`;
    if (mod10 === 2) return `${num}nd`;
    if (mod10 === 3) return `${num}rd`;
    return `${num}th`;
  }

  function headshotUrl(playerId) {
    const id = String(playerId || "").trim();
    return id ? `https://media.pff.com/player-photos/nfl/${id}.webp` : "";
  }

  function parsePassingSummaryCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { rows: [], rankPools: {}, byPlayerSeason: {}, qbs: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;
      rows.push({
        player: cell(cols, idx, "player"),
        playerId: cell(cols, idx, "player_id"),
        season: cell(cols, idx, "season"),
        includedInRank: isRankIncluded(cell(cols, idx, "included in rank?")),
        teamName: cell(cols, idx, "team_name"),
        franchiseId: cell(cols, idx, "franchise_id"),
        gradesPass: parseNum(cell(cols, idx, "grades_pass")),
        attempts: parseNum(cell(cols, idx, "attempts")),
        completions: parseNum(cell(cols, idx, "completions")),
        yards: parseNum(cell(cols, idx, "yards")),
        touchdowns: parseNum(cell(cols, idx, "touchdowns")),
        interceptions: parseNum(cell(cols, idx, "interceptions")),
        avgTimeToThrow: parseNum(cell(cols, idx, "avg_time_to_throw")),
        avgDepthOfTarget: parseNum(cell(cols, idx, "avg_depth_of_target")),
        pressureToSackRate: parseNum(cell(cols, idx, "pressure_to_sack_rate")),
      });
    }

    const rankPools = {};
    const tttRankPools = {};
    const adotRankPools = {};
    const ptsRankPools = {};
    rows.forEach((row) => {
      if (!row.includedInRank) return;
      const key = String(row.season);
      if (row.gradesPass != null) {
        if (!rankPools[key]) rankPools[key] = [];
        rankPools[key].push(row);
      }
      if (row.avgTimeToThrow != null) {
        if (!tttRankPools[key]) tttRankPools[key] = [];
        tttRankPools[key].push(row);
      }
      if (row.avgDepthOfTarget != null) {
        if (!adotRankPools[key]) adotRankPools[key] = [];
        adotRankPools[key].push(row);
      }
      if (row.pressureToSackRate != null) {
        if (!ptsRankPools[key]) ptsRankPools[key] = [];
        ptsRankPools[key].push(row);
      }
    });
    Object.keys(rankPools).forEach((season) => {
      rankPools[season].sort((a, b) => b.gradesPass - a.gradesPass);
    });
    Object.keys(tttRankPools).forEach((season) => {
      tttRankPools[season].sort((a, b) => a.avgTimeToThrow - b.avgTimeToThrow);
    });
    Object.keys(adotRankPools).forEach((season) => {
      adotRankPools[season].sort((a, b) => b.avgDepthOfTarget - a.avgDepthOfTarget);
    });
    Object.keys(ptsRankPools).forEach((season) => {
      ptsRankPools[season].sort((a, b) => a.pressureToSackRate - b.pressureToSackRate);
    });

    const byPlayerSeason = {};
    rows.forEach((row) => {
      const pid = row.playerId || normalizePlayerKey(row.player);
      byPlayerSeason[`${pid}|${row.season}`] = row;
    });

    const qbMap = new Map();
    rows.forEach((row) => {
      const key = row.playerId || row.player;
      if (!key || qbMap.has(key)) return;
      qbMap.set(key, {
        playerId: row.playerId,
        playerName: row.player,
        franchiseId: row.franchiseId,
        teamName: row.teamName,
      });
    });
    const qbs = [...qbMap.values()].sort((a, b) =>
      a.playerName.localeCompare(b.playerName)
    );

    return { rows, rankPools, tttRankPools, adotRankPools, ptsRankPools, byPlayerSeason, qbs };
  }

  function computePoolRank(season, rankPools, playerId, playerName) {
    const pool = rankPools[String(season)] || [];
    if (!pool.length) return { rank: null, total: 0, ringPct: 0 };

    const pid = String(playerId || "").trim();
    const nameKey = normalizePlayerKey(playerName);
    let rank = null;
    pool.forEach((row, i) => {
      if (rank != null) return;
      if (pid && row.playerId === pid) rank = i + 1;
      else if (!pid && normalizePlayerKey(row.player) === nameKey) rank = i + 1;
    });

    const ringPct =
      rank != null && pool.length > 0 ? ((pool.length - rank + 1) / pool.length) * 100 : 0;
    return { rank, total: pool.length, ringPct };
  }

  function formatTimeToThrow(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return `${Number(value).toFixed(2)}s`;
  }

  function formatAvgDepthOfTarget(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return Number(value).toFixed(1);
  }

  function formatPressureToSackRate(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return `${Number(value).toFixed(1)}%`;
  }

  function buildSeasonMetricSeries(passingState, playerId, playerName, years, valueField, rankPools) {
    return years.map((year) => {
      const row = findPassingRow(passingState, playerId, playerName, year);
      const value = row?.[valueField] ?? null;
      const { rank, total, ringPct } = computePoolRank(year, rankPools, playerId, playerName);
      return {
        season: year,
        value,
        rank,
        rankTotal: total,
        rankLabel: rank != null ? ordinal(rank) : "—",
        ringPct,
      };
    });
  }

  function getMetricSeasonRankings(rankPools, season, valueField, formatValue) {
    const pool = rankPools?.[String(season)] || [];
    return pool.map((row, i) => ({
      rank: i + 1,
      playerId: row.playerId,
      playerName: row.player,
      teamName: row.teamName,
      value: row[valueField],
      displayValue: formatValue(row[valueField]),
    }));
  }

  function computePassRank(season, gradesPass, rankPools, playerId, playerName) {
    const pool = rankPools[String(season)] || [];
    if (gradesPass == null || !pool.length) {
      return { rank: null, total: pool.length };
    }
    const sorted = [...pool].sort((a, b) => b.gradesPass - a.gradesPass);
    const pid = String(playerId || "").trim();
    const nameKey = normalizePlayerKey(playerName);
    let rank = null;
    sorted.forEach((row, i) => {
      if (rank != null) return;
      if (pid && row.playerId === pid) rank = i + 1;
      else if (!pid && normalizePlayerKey(row.player) === nameKey) rank = i + 1;
    });
    if (rank == null) {
      for (let i = 0; i < sorted.length; i++) {
        if (Math.abs(sorted[i].gradesPass - gradesPass) < 0.05) {
          rank = i + 1;
          break;
        }
      }
    }
    return { rank, total: sorted.length };
  }

  function findPassingRow(state, playerId, playerName, season) {
    if (!state) return null;
    const pid = String(playerId || "").trim();
    const nameKey = normalizePlayerKey(playerName);
    const seasonStr = String(season);
    if (pid) {
      const hit = state.byPlayerSeason[`${pid}|${seasonStr}`];
      if (hit) return hit;
    }
    return (
      state.rows.find(
        (r) =>
          String(r.season) === seasonStr &&
          normalizePlayerKey(r.player) === nameKey
      ) || null
    );
  }

  function isQbPosition(raw) {
    const pos = String(raw || "").trim().toUpperCase();
    return !pos || pos === "QB";
  }

  function normalizeGameGradeWeeks(rows) {
    return rows
      .filter((r) => Number.isFinite(r.grade))
      .sort((a, b) => a.week - b.week);
  }

  function parseGameGradeFeedCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerSeason: {} };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerSeason = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const position = cell(cols, idx, "position");
      if (idx.position != null && !isQbPosition(position)) continue;

      const playerId = cell(cols, idx, "player_id");
      const season = cell(cols, idx, "season");
      const week = parseNum(cell(cols, idx, "week"));
      const grade = parseNum(cell(cols, idx, "pass"));
      if (!playerId || !season || week == null || grade == null) continue;

      const key = `${playerId}|${season}`;
      if (!byPlayerSeason[key]) byPlayerSeason[key] = [];
      byPlayerSeason[key].push({
        week,
        grade: Math.round(grade * 10) / 10,
        game: cell(cols, idx, "game") || "",
      });
    }

    Object.keys(byPlayerSeason).forEach((key) => {
      byPlayerSeason[key] = normalizeGameGradeWeeks(byPlayerSeason[key]);
    });

    return { byPlayerSeason };
  }

  function getGameGradesFromFeed(feedState, playerId, season) {
    if (!feedState?.byPlayerSeason || !playerId) return [];
    return feedState.byPlayerSeason[`${playerId}|${season}`] || [];
  }

  function parseGameGradesCsv(text, playerRef, options = {}) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const weekKey = ["week", "wk", "game week"].find((k) => idx[k] != null);
    const gradeKey = ["pass", "grades_pass", "grade", "passing_grade", "pass_grade"].find(
      (k) => idx[k] != null
    );
    if (weekKey == null || gradeKey == null) return [];

    const pid = String(playerRef?.playerId || "").trim();
    const nameKey = normalizePlayerKey(playerRef?.playerName);
    const seasonFilter = options.season != null ? String(options.season) : null;
    const out = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      if (idx.position != null && !isQbPosition(cell(cols, idx, "position"))) continue;

      const rowSeason = cell(cols, idx, "season");
      if (seasonFilter && rowSeason && rowSeason !== seasonFilter) continue;

      const rowPid = cell(cols, idx, "player_id");
      const rowName = normalizePlayerKey(cell(cols, idx, "player") || cell(cols, idx, "name"));
      if (pid && rowPid && rowPid !== pid) continue;
      if (!pid && nameKey && rowName && rowName !== nameKey) continue;

      const week = parseNum(cell(cols, idx, weekKey));
      const grade = parseNum(cell(cols, idx, gradeKey));
      if (week == null || grade == null) continue;
      out.push({
        week,
        grade: Math.round(grade * 10) / 10,
        game: cell(cols, idx, "game") || "",
      });
    }
    return normalizeGameGradeWeeks(out);
  }

  function parsePct(raw) {
    const n = parseFloat(String(raw ?? "").replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function bucketColumnKeys(idx) {
    const volume = {};
    const pct = {};
    Object.keys(idx).forEach((key) => {
      const volMatch = key.match(/^(-?\d+(?:\.5)?)\s*grd$/);
      if (volMatch) volume[parseFloat(volMatch[1])] = key;
      const pctMatch = key.match(/^(-?\d+(?:\.5)?)%\s*grd$/);
      if (pctMatch) pct[parseFloat(pctMatch[1])] = key;
    });
    return { volume, pct };
  }

  function distributionDenominatorKey(idx) {
    const direct = ["snaps", "no play dropbacks", "no play dropback"].find((k) => idx[k] != null);
    if (direct) return direct;
    return Object.keys(idx).find((k) => /no\s*play\s*dropbacks?/.test(k)) || null;
  }

  function rowPlayerId(cols, idx) {
    return cell(cols, idx, "player id") || cell(cols, idx, "player_id");
  }

  function rowPosition(cols, idx) {
    return cell(cols, idx, "position") || cell(cols, idx, "pos");
  }

  function parseDistributionRow(cols, idx) {
    const { volume: volumeKeys, pct: pctKeys } = bucketColumnKeys(idx);
    const denomKey = distributionDenominatorKey(idx);
    const noPlayDropbacks = denomKey ? parseNum(cell(cols, idx, denomKey)) : null;

    const buckets = GRADE_BUCKETS.map((bin) => {
      const volumeKey = volumeKeys[bin];
      const pctKey = pctKeys[bin];
      const volume = volumeKey != null ? parseNum(cell(cols, idx, volumeKey)) : null;
      const pct = pctKey != null ? parsePct(cell(cols, idx, pctKey)) : null;
      return {
        label: bin > 0 ? `+${bin}` : String(bin),
        bin,
        volume: volume ?? 0,
        pct,
      };
    });

    const bucketTotal = buckets.reduce((sum, b) => sum + (b.volume || 0), 0);
    const denom = noPlayDropbacks ?? (bucketTotal || 1);
    buckets.forEach((b) => {
      if (b.pct == null) b.pct = denom > 0 ? (b.volume / denom) * 100 : 0;
    });

    return { noPlayDropbacks: denom, buckets };
  }

  function parseGradeDistributionFeedCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerId: {}, byPlayerName: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const nameKey = ["player", "name"].find((k) => idx[k] != null);
    const byPlayerId = {};
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      if (idx.position != null || idx.pos != null) {
        if (!isQbPosition(rowPosition(cols, idx))) continue;
      }

      const playerId = rowPlayerId(cols, idx);
      const playerName = nameKey ? normalizePlayerKey(cell(cols, idx, nameKey)) : "";
      if (!playerId && !playerName) continue;

      const distribution = parseDistributionRow(cols, idx);
      if (playerId) byPlayerId[playerId] = distribution;
      if (playerName) byPlayerName[playerName] = distribution;
    }

    return { byPlayerId, byPlayerName };
  }

  function getGradeDistributionFromFeed(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    if (pid && feedState.byPlayerId?.[pid]) return feedState.byPlayerId[pid];

    const nameKey = normalizePlayerKey(playerName);
    if (nameKey && feedState.byPlayerName?.[nameKey]) return feedState.byPlayerName[nameKey];
    return null;
  }

  function getSeasonRankings(rankPools, season) {
    const pool = rankPools?.[String(season)] || [];
    return pool.map((row, i) => ({
      rank: i + 1,
      playerId: row.playerId,
      playerName: row.player,
      teamName: row.teamName,
      grade: row.gradesPass,
    }));
  }

  function parseWarRank(raw) {
    const match = String(raw || "").trim().match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!match) return { rank: null, total: null };
    return {
      rank: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
    };
  }

  function parseWarSeasonCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { rows: [], rankPools: {}, byPlayerSeason: {} };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const season = parseNum(cell(cols, idx, "season"));
      if (season == null || !WAR_DISPLAY_YEARS.includes(season)) continue;

      const { rank, total } = parseWarRank(cell(cols, idx, "war_rank"));
      rows.push({
        season,
        playerId: String(cell(cols, idx, "player_id") || "").trim(),
        player: cell(cols, idx, "player"),
        teamName: cell(cols, idx, "team"),
        snaps: parseNum(cell(cols, idx, "snaps")),
        war: parseNum(cell(cols, idx, "war")),
        rank,
        rankTotal: total,
      });
    }

    const rankPools = {};
    rows.forEach((row) => {
      if (row.war == null) return;
      const key = String(row.season);
      if (!rankPools[key]) rankPools[key] = [];
      rankPools[key].push(row);
    });
    Object.keys(rankPools).forEach((season) => {
      rankPools[season].sort((a, b) => b.war - a.war);
    });

    const byPlayerSeason = {};
    rows.forEach((row) => {
      const pid = row.playerId || normalizePlayerKey(row.player);
      byPlayerSeason[`${pid}|${row.season}`] = row;
    });

    return { rows, rankPools, byPlayerSeason };
  }

  function getWarSeasonRankings(rankPools, season) {
    const pool = rankPools?.[String(season)] || [];
    return pool.map((row, i) => ({
      rank: i + 1,
      playerId: row.playerId,
      playerName: row.player,
      teamName: row.teamName,
      war: row.war,
    }));
  }

  function getWarSeasonsForPlayer(warState, playerId, playerName) {
    if (!warState?.byPlayerSeason) return WAR_DISPLAY_YEARS.map((season) => ({
      season,
      war: null,
      rank: null,
      rankTotal: null,
      rankLabel: "—",
      ringPct: 0,
    }));

    const pid = String(playerId || "").trim();
    const nameKey = normalizePlayerKey(playerName);

    return WAR_DISPLAY_YEARS.map((season) => {
      let row =
        (pid && warState.byPlayerSeason[`${pid}|${season}`]) ||
        warState.rows?.find(
          (entry) =>
            entry.season === season &&
            ((pid && entry.playerId === pid) ||
              (!pid && normalizePlayerKey(entry.player) === nameKey))
        ) ||
        null;

      const rank = row?.rank ?? null;
      const rankTotal = row?.rankTotal ?? null;
      const ringPct =
        rank != null && rankTotal > 0 ? ((rankTotal - rank + 1) / rankTotal) * 100 : 0;

      return {
        season,
        war: row?.war ?? null,
        rank,
        rankTotal,
        rankLabel: rank != null ? ordinal(rank) : "—",
        ringPct,
      };
    });
  }

  function parseOpponentWeek(raw) {
    const value = String(raw || "").trim();
    const weekMatch = value.match(/^wk\.?\s*(\d+)$/i);
    if (weekMatch) {
      const week = parseInt(weekMatch[1], 10);
      return { week, label: `Week ${week}` };
    }

    const playoffMap = {
      WC: { week: 28, label: "Wild Card" },
      DP: { week: 29, label: "Divisional" },
      CC: { week: 30, label: "Conference Championship" },
      SB: { week: 31, label: "Super Bowl" },
    };
    const playoff = playoffMap[value.toUpperCase()];
    if (playoff) return playoff;

    const num = parseNum(value);
    if (num != null) return { week: num, label: `Week ${num}` };
    return null;
  }

  function parseOpponentsFeedCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerWeek: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerWeek = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      if (idx.position != null || idx.pos != null) {
        if (!isQbPosition(rowPosition(cols, idx))) continue;
      }

      const playerId = rowPlayerId(cols, idx);
      const weekInfo = parseOpponentWeek(cell(cols, idx, "week"));
      if (!playerId || !weekInfo) continue;

      const stats = {};
      headers.forEach((header, i) => {
        const key = String(header || "").trim().toLowerCase();
        if (!key) return;
        stats[key] = String(cols[i] ?? "").trim();
      });

      byPlayerWeek[`${playerId}|${weekInfo.week}`] = {
        week: weekInfo.week,
        weekLabel: weekInfo.label,
        opponent: cell(cols, idx, "opp"),
        stats,
      };
    }

    return { byPlayerWeek };
  }

  function getOpponentGameFromFeed(feedState, playerId, week) {
    if (!feedState?.byPlayerWeek || !playerId || week == null) return null;
    return feedState.byPlayerWeek[`${playerId}|${week}`] || null;
  }

  function attachOpponentData(gameGrades, opponentsFeedState, playerId) {
    return (gameGrades || []).map((game) => {
      const opponentGame = getOpponentGameFromFeed(
        opponentsFeedState,
        playerId,
        game.week
      );
      return {
        ...game,
        opponent: opponentGame?.opponent || null,
        weekLabel: opponentGame?.weekLabel || `Week ${game.week}`,
        gameStats: opponentGame?.stats || null,
      };
    });
  }

  const GRADING_PROFILE_CHARTS = [
    {
      id: "btt-twp",
      title: "Big-time throw rate vs turnover-worthy play rate",
      shortTitle: "BTT vs TWP",
      xLabel: "Big-time throw rate",
      yLabel: "Turnover-worthy play rate",
      xKey: "bttRate",
      yKey: "twpRate",
    },
    {
      id: "pos-neg",
      title: "Positively graded vs negatively graded play rate",
      shortTitle: "+ vs − grade rate",
      xLabel: "Positively graded play rate",
      yLabel: "Negatively graded play rate",
      xKey: "positiveRate",
      yKey: "negativeRate",
    },
  ];

  function parseGradingProfileFeedCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { points: [] };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const nameKey = ["player", "name"].find((k) => idx[k] != null);
    const points = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const playerId = rowPlayerId(cols, idx);
      const playerName = cell(cols, idx, nameKey || "name");
      if (!playerId || !playerName) continue;

      const bttRate = parsePct(cell(cols, idx, "btt%"));
      const twpRate = parsePct(cell(cols, idx, "twp%"));
      const positiveRate = parsePct(cell(cols, idx, "pos %"));
      const negativeRate = parsePct(cell(cols, idx, "neg %"));

      if (
        bttRate == null &&
        twpRate == null &&
        positiveRate == null &&
        negativeRate == null
      ) {
        continue;
      }

      points.push({
        playerId,
        playerName,
        teamName: cell(cols, idx, "team"),
        passGrade: parseNum(cell(cols, idx, "pass grd")),
        bttRate,
        twpRate,
        positiveRate,
        negativeRate,
        headshotUrl: headshotUrl(playerId),
      });
    }

    return { points };
  }

  function enrichGradingProfilePoints(points, passingState) {
    return (points || []).map((point) => {
      const row = findPassingRow(
        passingState,
        point.playerId,
        point.playerName,
        "2025"
      );
      return {
        ...point,
        teamName: point.teamName || row?.teamName || "",
        passGrade: point.passGrade ?? row?.gradesPass ?? null,
      };
    });
  }

  function padScatterDomain(min, max, padRatio = 0.1) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { min: 0, max: 10 };
    }
    if (min === max) {
      const bump = Math.max(0.5, min * 0.15);
      return { min: Math.max(0, min - bump), max: max + bump };
    }
    const span = max - min;
    return {
      min: Math.max(0, min - span * padRatio),
      max: max + span * padRatio,
    };
  }

  function buildGradingProfileModel(feedState, featuredPlayerId, passingState) {
    const points = enrichGradingProfilePoints(feedState?.points || [], passingState);
    if (!points.length) return null;

    const charts = GRADING_PROFILE_CHARTS.map((chart) => {
      const valid = points.filter(
        (p) => p[chart.xKey] != null && p[chart.yKey] != null
      );
      const xs = valid.map((p) => p[chart.xKey]);
      const ys = valid.map((p) => p[chart.yKey]);
      const xDomain = padScatterDomain(Math.min(...xs), Math.max(...xs));
      const yDomain = padScatterDomain(Math.min(...ys), Math.max(...ys));
      const avgX = xs.reduce((sum, n) => sum + n, 0) / xs.length;
      const avgY = ys.reduce((sum, n) => sum + n, 0) / ys.length;

      return {
        ...chart,
        points: valid,
        avgX,
        avgY,
        xDomain,
        yDomain,
      };
    });

    return {
      charts,
      featuredPlayerId: String(featuredPlayerId || "").trim(),
    };
  }

  function metricValueFromRow(row, header) {
    if (!row) return null;
    const raw = row[header];
    if (raw == null || raw === "") return null;
    const n = parseNum(raw);
    if (n == null) return null;
    return Math.max(0, Math.min(100, n));
  }

  function metricsFromRow(row, columns) {
    return columns.map(({ header, label }) => ({
      label,
      percentile: metricValueFromRow(row, header),
    }));
  }

  function parseStableUnstableFeedCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerName: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const nameKey = ["player", "name"].find((k) => idx[k] != null) || "player";
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const playerName = cell(cols, idx, nameKey);
      const name = normalizePlayerKey(playerName);
      if (!name) continue;

      const row = {};
      Object.keys(idx).forEach((header) => {
        row[header] = cell(cols, idx, header);
      });
      byPlayerName[name] = row;
    }

    return { byPlayerName };
  }

  function emptyStableUnstableMetrics() {
    return {
      stable: metricsFromRow({}, STABLE_METRIC_COLUMNS),
      unstable: metricsFromRow({}, UNSTABLE_METRIC_COLUMNS),
    };
  }

  function getStableUnstableForPlayer(feedState, playerName) {
    if (!feedState?.byPlayerName) return null;
    const row = feedState.byPlayerName[normalizePlayerKey(playerName)];
    if (!row) return null;

    const stable = metricsFromRow(row, STABLE_METRIC_COLUMNS);
    const unstable = metricsFromRow(row, UNSTABLE_METRIC_COLUMNS);
    const hasAny = [...stable, ...unstable].some((m) => m.percentile != null);
    if (!hasAny) return null;

    return { stable, unstable };
  }

  function parsePassingPressureCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerId: {}, byPlayerName: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const row = {};
      Object.keys(idx).forEach((header) => {
        row[header] = cell(cols, idx, header);
      });

      const playerId = cell(cols, idx, "player_id");
      const playerName = cell(cols, idx, "player");
      if (playerId) byPlayerId[String(playerId).trim()] = row;
      const name = normalizePlayerKey(playerName);
      if (name) byPlayerName[name] = row;
    }

    return { byPlayerId, byPlayerName };
  }

  function rowValue(row, prefix, field) {
    if (!row) return null;
    return parseNum(row[`${prefix}_${field}`]);
  }

  function buildPassingSplitComparison(row, splitConfig) {
    const { id, title, shortTitle, leftPrefix, leftLabel, rightPrefix, rightLabel } =
      splitConfig;
    const leftDropbacks = rowValue(row, leftPrefix, "dropbacks");
    const rightDropbacks = rowValue(row, rightPrefix, "dropbacks");
    const totalDropbacks =
      leftDropbacks != null || rightDropbacks != null
        ? (leftDropbacks || 0) + (rightDropbacks || 0)
        : null;
    const rightShare =
      totalDropbacks && rightDropbacks != null
        ? (rightDropbacks / totalDropbacks) * 100
        : null;

    const leftGrade = rowValue(row, leftPrefix, "grades_pass");
    const rightGrade = rowValue(row, rightPrefix, "grades_pass");
    const gradeDelta =
      leftGrade != null && rightGrade != null ? leftGrade - rightGrade : null;

    const highlights = PASSING_SPLIT_HIGHLIGHTS.map(
      ({ field, label, format, higherBetter }) => ({
        label,
        format,
        higherBetter,
        left: rowValue(row, leftPrefix, field),
        right: rowValue(row, rightPrefix, field),
      })
    );

    return {
      id,
      title,
      shortTitle,
      leftLabel,
      rightLabel,
      leftDropbacks,
      rightDropbacks,
      rightShare,
      leftGrade,
      rightGrade,
      gradeDelta,
      highlights,
    };
  }

  function lookupSplitFeedRow(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    let row = pid ? feedState.byPlayerId?.[pid] : null;
    if (!row && playerName) {
      row = feedState.byPlayerName?.[normalizePlayerKey(playerName)];
    }
    return row || null;
  }

  function appendSplitsFromFeed(splits, feedState, splitConfigs, playerId, playerName) {
    const row = lookupSplitFeedRow(feedState, playerId, playerName);
    if (!row) return;
    splitConfigs.forEach((split) => {
      splits.push(buildPassingSplitComparison(row, split));
    });
  }

  function getPassingSplitsForPlayer(
    pressureFeedState,
    conceptFeedState,
    timeInPocketFeedState,
    playerId,
    playerName
  ) {
    const splits = [];
    appendSplitsFromFeed(splits, pressureFeedState, PASSING_SPLITS, playerId, playerName);
    appendSplitsFromFeed(splits, conceptFeedState, PASSING_CONCEPT_SPLITS, playerId, playerName);
    appendSplitsFromFeed(
      splits,
      timeInPocketFeedState,
      PASSING_TIME_IN_POCKET_SPLITS,
      playerId,
      playerName
    );

    if (!splits.length) return null;
    return { splits };
  }

  function getPassingPressureForPlayer(feedState, playerId, playerName) {
    return getPassingSplitsForPlayer(feedState, null, null, playerId, playerName);
  }

  const RUSHING_METRIC_DEFS = {
    gradesRun: { label: "Run grade", format: "grade", higherBetter: true },
    yards: { label: "Rushing yards", format: "int", higherBetter: true },
    attempts: { label: "Attempts", format: "int", higherBetter: true },
    ypa: { label: "Yards per attempt", format: "decimal", higherBetter: true },
    touchdowns: { label: "Touchdowns", format: "int", higherBetter: true },
    firstDowns: { label: "First downs", format: "int", higherBetter: true },
    fumbles: { label: "Fumbles", format: "int", higherBetter: false },
    designedYards: { label: "Designed yards", format: "int", higherBetter: true },
    scrambleYards: { label: "Scramble yards", format: "int", higherBetter: true },
    designedYpa: { label: "Designed YPA", format: "decimal", higherBetter: true },
    scrambleYpa: { label: "Scramble YPA", format: "decimal", higherBetter: true },
    avoidedTackles: { label: "Avoided tackles", format: "int", higherBetter: true },
    elusiveRating: { label: "Elusive rating", format: "decimal", higherBetter: true },
    yardsAfterContact: { label: "Yards after contact", format: "int", higherBetter: true },
    ycoAttempt: { label: "YCO / attempt", format: "decimal", higherBetter: true },
    eluRushMtf: { label: "Missed tackles forced", format: "int", higherBetter: true },
    breakawayAttempts: { label: "Breakaway runs", format: "int", higherBetter: true },
    breakawayYards: { label: "Breakaway yards", format: "int", higherBetter: true },
    breakawayPercent: { label: "Breakaway rate", format: "pct", higherBetter: true },
    explosive: { label: "Explosive runs", format: "int", higherBetter: true },
    longest: { label: "Longest run", format: "int", higherBetter: true },
    gapAttempts: { label: "Gap attempts", format: "int", higherBetter: true },
    zoneAttempts: { label: "Zone attempts", format: "int", higherBetter: true },
  };

  const RUSHING_WINDOWS = [
    {
      id: "overview",
      shortTitle: "Overview",
      title: "Rushing production",
      type: "hero",
      heroField: "gradesRun",
      metrics: ["yards", "attempts", "ypa", "touchdowns", "firstDowns", "fumbles"],
    },
    {
      id: "designed-scramble",
      shortTitle: "Designed vs scramble",
      title: "Designed runs vs scrambles",
      type: "designedScramble",
      metrics: ["designedYards", "scrambleYards", "designedYpa", "scrambleYpa"],
    },
    {
      id: "elusiveness",
      shortTitle: "Elusiveness",
      title: "Elusiveness & contact",
      type: "metrics",
      metrics: ["elusiveRating", "avoidedTackles", "ycoAttempt", "yardsAfterContact", "eluRushMtf"],
    },
    {
      id: "explosiveness",
      shortTitle: "Explosiveness",
      title: "Explosive rushing",
      type: "metrics",
      metrics: ["explosive", "breakawayAttempts", "breakawayYards", "breakawayPercent", "longest"],
    },
    {
      id: "gap-zone",
      shortTitle: "Gap vs zone",
      title: "Gap vs zone schemes",
      type: "gapZone",
      metrics: ["gapAttempts", "zoneAttempts"],
    },
  ];

  function formatRushingValue(value, format) {
    if (value == null || !Number.isFinite(value)) return "—";
    if (format === "grade") return Number(value).toFixed(1);
    if (format === "int") return Math.round(value).toLocaleString("en-US");
    if (format === "pct") return `${Number(value).toFixed(1)}%`;
    if (format === "decimal") return Number(value).toFixed(2);
    return Number(value).toFixed(1);
  }

  function parseRushingSummaryCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { rows: [], rankPools: {}, byPlayerId: {}, byPlayerName: {} };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const rows = [];
    const byPlayerId = {};
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const attempts = parseNum(cell(cols, idx, "attempts"));
      const scrambles = parseNum(cell(cols, idx, "scrambles"));
      const designedYards = parseNum(cell(cols, idx, "designed_yards"));
      const scrambleYards = parseNum(cell(cols, idx, "scramble_yards"));
      const designedAttempts =
        attempts != null && scrambles != null ? attempts - scrambles : null;

      const row = {
        player: cell(cols, idx, "player"),
        playerId: cell(cols, idx, "player_id"),
        teamName: cell(cols, idx, "team_name"),
        franchiseId: cell(cols, idx, "franchise_id"),
        includedInRank: isRankIncluded(cell(cols, idx, "included in rank?")),
        games: parseNum(cell(cols, idx, "player_game_count")),
        gradesRun: parseNum(cell(cols, idx, "grades_run")),
        yards: parseNum(cell(cols, idx, "yards")),
        ypa: parseNum(cell(cols, idx, "ypa")),
        attempts,
        touchdowns: parseNum(cell(cols, idx, "touchdowns")),
        firstDowns: parseNum(cell(cols, idx, "first_downs")),
        fumbles: parseNum(cell(cols, idx, "fumbles")),
        designedYards,
        scrambleYards,
        scrambles,
        designedAttempts,
        designedYpa:
          designedYards != null && designedAttempts > 0
            ? designedYards / designedAttempts
            : null,
        scrambleYpa:
          scrambleYards != null && scrambles > 0 ? scrambleYards / scrambles : null,
        avoidedTackles: parseNum(cell(cols, idx, "avoided_tackles")),
        elusiveRating: parseNum(cell(cols, idx, "elusive_rating")),
        yardsAfterContact: parseNum(cell(cols, idx, "yards_after_contact")),
        ycoAttempt: parseNum(cell(cols, idx, "yco_attempt")),
        eluRushMtf: parseNum(cell(cols, idx, "elu_rush_mtf")),
        breakawayAttempts: parseNum(cell(cols, idx, "breakaway_attempts")),
        breakawayYards: parseNum(cell(cols, idx, "breakaway_yards")),
        breakawayPercent: parseNum(cell(cols, idx, "breakaway_percent")),
        explosive: parseNum(cell(cols, idx, "explosive")),
        longest: parseNum(cell(cols, idx, "longest")),
        gapAttempts: parseNum(cell(cols, idx, "gap_attempts")),
        zoneAttempts: parseNum(cell(cols, idx, "zone_attempts")),
      };

      rows.push(row);
      if (row.playerId) byPlayerId[String(row.playerId).trim()] = row;
      const name = normalizePlayerKey(row.player);
      if (name) byPlayerName[name] = row;
    }

    const rankPools = {};
    Object.keys(RUSHING_METRIC_DEFS).forEach((fieldKey) => {
      const def = RUSHING_METRIC_DEFS[fieldKey];
      const pool = rows.filter(
        (row) => row.includedInRank && row[fieldKey] != null && Number.isFinite(row[fieldKey])
      );
      pool.sort((a, b) =>
        def.higherBetter ? b[fieldKey] - a[fieldKey] : a[fieldKey] - b[fieldKey]
      );
      rankPools[fieldKey] = pool;
    });

    return { rows, rankPools, byPlayerId, byPlayerName };
  }

  function computeRushRank(rankPool, playerId, playerName) {
    const pool = rankPool || [];
    if (!pool.length) return { rank: null, total: 0, ringPct: 0 };

    const pid = String(playerId || "").trim();
    const nameKey = normalizePlayerKey(playerName);
    let rank = null;
    pool.forEach((row, i) => {
      if (rank != null) return;
      if (pid && row.playerId === pid) rank = i + 1;
      else if (!pid && normalizePlayerKey(row.player) === nameKey) rank = i + 1;
    });

    const ringPct =
      rank != null && pool.length > 0 ? ((pool.length - rank + 1) / pool.length) * 100 : 0;
    return { rank, total: pool.length, ringPct };
  }

  function buildRushingMetricSnapshot(row, rankPools, fieldKey) {
    const def = RUSHING_METRIC_DEFS[fieldKey];
    if (!def || !row) return null;
    const value = row[fieldKey];
    if (value == null || !Number.isFinite(value)) return null;
    const { rank, total, ringPct } = computeRushRank(rankPools[fieldKey], row.playerId, row.player);
    return {
      id: fieldKey,
      label: def.label,
      value,
      displayValue: formatRushingValue(value, def.format),
      format: def.format,
      higherBetter: def.higherBetter,
      rank,
      rankTotal: total,
      rankLabel: rank != null ? ordinal(rank) : "—",
      ringPct,
    };
  }

  function getRushingMetricRankings(rankPools, fieldKey) {
    const def = RUSHING_METRIC_DEFS[fieldKey];
    const pool = rankPools?.[fieldKey] || [];
    if (!def) return [];
    return pool.map((row, i) => ({
      rank: i + 1,
      playerId: row.playerId,
      playerName: row.player,
      teamName: row.teamName,
      value: row[fieldKey],
      displayValue: formatRushingValue(row[fieldKey], def.format),
    }));
  }

  function buildDesignedScrambleSplit(row) {
    if (!row) return null;
    const leftAttempts = row.designedAttempts;
    const rightAttempts = row.scrambles;
    const totalAttempts =
      leftAttempts != null || rightAttempts != null
        ? (leftAttempts || 0) + (rightAttempts || 0)
        : null;
    const rightShare =
      totalAttempts && rightAttempts != null ? (rightAttempts / totalAttempts) * 100 : null;
    const ypaDelta =
      row.designedYpa != null && row.scrambleYpa != null
        ? row.scrambleYpa - row.designedYpa
        : null;

    return {
      leftLabel: "Designed",
      rightLabel: "Scrambles",
      leftPrimary: row.designedYards,
      rightPrimary: row.scrambleYards,
      leftSecondary: row.designedYpa,
      rightSecondary: row.scrambleYpa,
      leftMeta: leftAttempts,
      rightMeta: rightAttempts,
      rightShare,
      delta: ypaDelta,
      deltaLabel: "Scramble YPA edge",
    };
  }

  function buildGapZoneSplit(row) {
    if (!row) return null;
    const leftAttempts = row.gapAttempts;
    const rightAttempts = row.zoneAttempts;
    const totalAttempts =
      leftAttempts != null || rightAttempts != null
        ? (leftAttempts || 0) + (rightAttempts || 0)
        : null;
    const rightShare =
      totalAttempts && rightAttempts != null ? (rightAttempts / totalAttempts) * 100 : null;

    return {
      leftLabel: "Gap",
      rightLabel: "Zone",
      leftPrimary: leftAttempts,
      rightPrimary: rightAttempts,
      leftSecondary: null,
      rightSecondary: null,
      leftMeta: null,
      rightMeta: null,
      rightShare,
      delta:
        leftAttempts != null && rightAttempts != null ? leftAttempts - rightAttempts : null,
      deltaLabel: "Gap attempt edge",
    };
  }

  function getRushingForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    let row = pid ? feedState.byPlayerId?.[pid] : null;
    if (!row && playerName) {
      row = feedState.byPlayerName?.[normalizePlayerKey(playerName)];
    }
    if (!row) return null;

    const rankPools = feedState.rankPools || {};
    const rankings = {};
    Object.keys(RUSHING_METRIC_DEFS).forEach((fieldKey) => {
      rankings[fieldKey] = getRushingMetricRankings(rankPools, fieldKey);
    });

    const windows = RUSHING_WINDOWS.map((windowConfig) => {
      const metrics = (windowConfig.metrics || [])
        .map((fieldKey) => buildRushingMetricSnapshot(row, rankPools, fieldKey))
        .filter(Boolean);

      const payload = {
        id: windowConfig.id,
        shortTitle: windowConfig.shortTitle,
        title: windowConfig.title,
        type: windowConfig.type,
        metrics,
      };

      if (windowConfig.type === "hero") {
        payload.hero = buildRushingMetricSnapshot(row, rankPools, windowConfig.heroField);
      }
      if (windowConfig.type === "designedScramble") {
        payload.split = buildDesignedScrambleSplit(row);
      }
      if (windowConfig.type === "gapZone") {
        payload.split = buildGapZoneSplit(row);
      }

      return payload;
    }).filter((window) => {
      if (window.type === "hero") return window.hero || window.metrics.length;
      if (window.type === "designedScramble" || window.type === "gapZone") {
        return window.split || window.metrics.length;
      }
      return window.metrics.length;
    });

    if (!windows.length) return null;
    const metricLabels = {};
    Object.entries(RUSHING_METRIC_DEFS).forEach(([fieldKey, def]) => {
      metricLabels[fieldKey] = def.label;
    });
    return { windows, rankings, rankPoolSize: rankPools.gradesRun?.length || 0, metricLabels };
  }

  const PASSING_GRADES_SITUATION_GROUPS = [
    { label: "Pressure", columns: ["Clean pocket", "Under pressure"] },
    { label: "Blitz", columns: ["No blitz", "Blitz"] },
    { label: "Screen", columns: ["No screen", "Screen"] },
    { label: "Play-action", columns: ["No play action", "play action"] },
    { label: "Time in pocket", columns: ["Throws in less than 2.5s", "Throws in more than 2.5s"] },
    { label: "Alignment", columns: ["Under center", "Shotgun"] },
    {
      label: "Safety shell",
      columns: ["Single high", "Two high", "Safety rotation", "No safety rotation"],
    },
    { label: "Down & situation", columns: ["Early down", "Late downs", "2 min drill", "Red zone"] },
  ];

  function normalizeMetricKey(label) {
    return String(label || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function normalizeMetricId(label) {
    return normalizeMetricKey(label).replace(/\s/g, "-");
  }

  function findAttKeyForGrade(idx, gradeLower) {
    const exactAtt = `${gradeLower} att`;
    const exactAtts = `${gradeLower} atts`;
    if (idx[exactAtt] != null) return exactAtt;
    if (idx[exactAtts] != null) return exactAtts;
    return (
      Object.keys(idx).find((key) => {
        const lower = key.toLowerCase();
        if (!lower.endsWith(" att") && !lower.endsWith(" atts")) return false;
        const stem = lower.replace(/ att(s)?$/, "");
        return stem === gradeLower;
      }) || null
    );
  }

  function parsePassingGradesWideCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, rankPools: {}, metricPairs: [] };
    }

    const originalHeaders = parseCsvLine(lines[0]);
    const idx = headerIndex(originalHeaders);
    const metricPairs = [];

    originalHeaders.forEach((header) => {
      const label = String(header || "").trim();
      const lower = label.toLowerCase();
      if (!label || ["player", "player_id", "included in rank?"].includes(lower)) return;
      if (lower.endsWith(" att") || lower.endsWith(" atts")) return;

      const attKey = findAttKeyForGrade(idx, lower);
      metricPairs.push({
        id: normalizeMetricId(label),
        label,
        gradeKey: lower,
        attKey,
      });
    });

    const rows = [];
    const byPlayerId = {};
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const metrics = {};
      metricPairs.forEach((pair) => {
        metrics[pair.id] = {
          label: pair.label,
          grade: parseNum(cell(cols, idx, pair.gradeKey)),
          attempts: pair.attKey ? parseNum(cell(cols, idx, pair.attKey)) : null,
        };
      });

      const row = {
        player: cell(cols, idx, "player"),
        playerId: cell(cols, idx, "player_id"),
        includedInRank: isRankIncluded(cell(cols, idx, "included in rank?")),
        metrics,
      };

      rows.push(row);
      if (row.playerId) byPlayerId[String(row.playerId).trim()] = row;
      const name = normalizePlayerKey(row.player);
      if (name) byPlayerName[name] = row;
    }

    const rankPools = {};
    metricPairs.forEach((pair) => {
      rankPools[pair.id] = rows
        .filter(
          (row) =>
            row.includedInRank &&
            row.metrics[pair.id]?.grade != null &&
            Number.isFinite(row.metrics[pair.id].grade)
        )
        .map((row) => ({
          playerId: row.playerId,
          player: row.player,
          grade: row.metrics[pair.id].grade,
        }))
        .sort((a, b) => b.grade - a.grade);
    });

    return { byPlayerId, byPlayerName, rankPools, metricPairs, rows };
  }

  function parsePassingGradesSituationCsv(text) {
    return parsePassingGradesWideCsv(text);
  }

  function findMetricByLabel(row, columnLabel) {
    if (!row?.metrics) return null;
    const target = normalizeMetricKey(columnLabel);
    return (
      row.metrics[normalizeMetricId(columnLabel)] ||
      Object.values(row.metrics).find((metric) => normalizeMetricKey(metric.label) === target) ||
      null
    );
  }

  function buildRankedPassingGradeRow(row, columnLabel, rankPools) {
    const metric = findMetricByLabel(row, columnLabel);
    if (!metric || metric.grade == null || !Number.isFinite(metric.grade)) return null;

    const metricId = normalizeMetricId(columnLabel);
    const { rank, total } = computeRushRank(rankPools?.[metricId], row.playerId, row.player);

    return {
      label: String(columnLabel).trim(),
      grade: metric.grade,
      attempts: metric.attempts,
      rank,
      rankTotal: total,
      rankLabel: rank != null ? ordinal(rank) : "—",
    };
  }

  function buildPassingGradesSituationTable(row, rankPools) {
    if (!row?.metrics) return null;
    const groups = PASSING_GRADES_SITUATION_GROUPS.map((group) => ({
      label: group.label,
      rows: group.columns
        .map((column) => buildRankedPassingGradeRow(row, column, rankPools))
        .filter(Boolean),
    })).filter((group) => group.rows.length);

    if (!groups.length) return null;
    return {
      id: "situation",
      shortTitle: "Situation",
      title: "Grades by situation",
      type: "grouped",
      showAttempts: true,
      showRank: true,
      groups,
    };
  }

  function parsePassingGradesReadsCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerId: {}, byPlayerName: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};

    const idKey = ["player id", "player_id"].find((k) => idx[k] != null) || "player id";
    const nameKey = ["name", "player"].find((k) => idx[k] != null) || "name";
    const decisionKey = ["qb decision", "decision"].find((k) => idx[k] != null) || "qb decision";
    const gradeKey = ["pass grd", "passing grade", "grade"].find((k) => idx[k] != null) || "pass grd";
    const attKey = ["att", "attempts"].find((k) => idx[k] != null) || "att";

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const entry = {
        label: cell(cols, idx, decisionKey),
        grade: parseNum(cell(cols, idx, gradeKey)),
        attempts: parseNum(cell(cols, idx, attKey)),
        player: cell(cols, idx, nameKey),
      };
      if (!entry.label) continue;

      const playerId = cell(cols, idx, idKey);
      const playerName = cell(cols, idx, nameKey);
      if (playerId) {
        const pid = String(playerId).trim();
        if (!byPlayerId[pid]) byPlayerId[pid] = [];
        byPlayerId[pid].push(entry);
      }
      const name = normalizePlayerKey(playerName);
      if (name) {
        if (!byPlayerName[name]) byPlayerName[name] = [];
        byPlayerName[name].push(entry);
      }
    }

    Object.keys(byPlayerId).forEach((pid) => {
      byPlayerId[pid].sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    });
    Object.keys(byPlayerName).forEach((name) => {
      byPlayerName[name].sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    });

    return { byPlayerId, byPlayerName };
  }

  function parsePassingGradesCoverageCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerId: {}, byPlayerName: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};

    const includedKey = ["included in rank?"].find((k) => idx[k] != null);
    const idKey = ["player id", "player_id"].find((k) => idx[k] != null) || "player id";
    const nameKey = ["name", "player"].find((k) => idx[k] != null) || "name";
    const schemeKey = ["cov scheme", "coverage", "scheme"].find((k) => idx[k] != null) || "cov scheme";
    const gradeKey = ["passing grade", "pass grd", "grade"].find((k) => idx[k] != null) || "passing grade";
    const attKey = ["att", "attempts"].find((k) => idx[k] != null) || "att";

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const entry = {
        label: cell(cols, idx, schemeKey),
        grade: parseNum(cell(cols, idx, gradeKey)),
        attempts: parseNum(cell(cols, idx, attKey)),
        player: cell(cols, idx, nameKey),
        includedInRank: includedKey
          ? isRankIncluded(cell(cols, idx, includedKey))
          : true,
      };
      if (!entry.label) continue;

      const playerId = cell(cols, idx, idKey);
      const playerName = cell(cols, idx, nameKey);
      if (playerId) {
        const pid = String(playerId).trim();
        if (!byPlayerId[pid]) byPlayerId[pid] = [];
        byPlayerId[pid].push(entry);
      }
      const name = normalizePlayerKey(playerName);
      if (name) {
        if (!byPlayerName[name]) byPlayerName[name] = [];
        byPlayerName[name].push(entry);
      }
    }

    Object.keys(byPlayerId).forEach((pid) => {
      byPlayerId[pid].sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    });
    Object.keys(byPlayerName).forEach((name) => {
      byPlayerName[name].sort((a, b) => (b.attempts || 0) - (a.attempts || 0));
    });

    return { byPlayerId, byPlayerName };
  }

  function lookupMultiRowFeed(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    if (pid && feedState.byPlayerId?.[pid]) return feedState.byPlayerId[pid];
    if (playerName) return feedState.byPlayerName?.[normalizePlayerKey(playerName)] || null;
    return null;
  }

  function lookupSingleRowFeed(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    if (pid && feedState.byPlayerId?.[pid]) return feedState.byPlayerId[pid];
    if (playerName) return feedState.byPlayerName?.[normalizePlayerKey(playerName)] || null;
    return null;
  }

  function buildPassingGradesAlignmentTable(row, rankPools) {
    if (!row?.metrics) return null;
    const alignmentColumns = [
      { label: "Backfield", column: "Backfield" },
      { label: "In-line", column: "in-line" },
      { label: "Slot", column: "slot" },
      { label: "Wide", column: "wide" },
    ];
    const alignmentRows = alignmentColumns
      .map(({ label, column }) => {
        const entry = buildRankedPassingGradeRow(row, column, rankPools);
        return entry ? { ...entry, label } : null;
      })
      .filter(Boolean);

    if (!alignmentRows.length) return null;
    return {
      id: "alignment",
      shortTitle: "Alignment",
      title: "Grades by target alignment",
      type: "grouped",
      showAttempts: true,
      showRank: true,
      groups: [{ label: "Receiver alignment", rows: alignmentRows }],
    };
  }

  function buildPassingGradesThrowTypeTable(row, rankPools, metricPairs) {
    if (!row?.metrics) return null;
    const throwTypeRows = (metricPairs || [])
      .map((pair) => buildRankedPassingGradeRow(row, pair.label, rankPools))
      .filter(Boolean)
      .sort((a, b) => (b.attempts || 0) - (a.attempts || 0));

    if (!throwTypeRows.length) return null;
    return {
      id: "throw-type",
      shortTitle: "Throw type",
      title: "Grades by throw type",
      type: "rows",
      showAttempts: true,
      showRank: true,
      rows: throwTypeRows,
    };
  }

  function getQualifyingPlayerIdsFromSituation(situationState) {
    const ids = new Set();
    Object.values(situationState?.byPlayerId || {}).forEach((row) => {
      if (row?.includedInRank && row.playerId) ids.add(String(row.playerId).trim());
    });
    return ids;
  }

  function buildMultiRowRankPools(byPlayerId, options = {}) {
    const { qualifyingPlayerIds, entryFilter } = options;
    const rankPools = {};

    Object.entries(byPlayerId || {}).forEach(([playerId, entries]) => {
      const pid = String(playerId).trim();
      if (qualifyingPlayerIds?.size && !qualifyingPlayerIds.has(pid)) return;

      (entries || []).forEach((entry) => {
        if (entryFilter && !entryFilter(entry)) return;
        if (entry.grade == null || !Number.isFinite(entry.grade)) return;

        const metricId = normalizeMetricId(entry.label);
        if (!rankPools[metricId]) rankPools[metricId] = [];
        rankPools[metricId].push({
          playerId: pid,
          player: entry.player || "",
          grade: entry.grade,
        });
      });
    });

    Object.keys(rankPools).forEach((metricId) => {
      rankPools[metricId].sort((a, b) => b.grade - a.grade);
    });

    return rankPools;
  }

  function buildPassingGradesRowsTable(config, rows, rankPools, playerId, playerName) {
    if (!rows?.length) return null;
    const pid = String(playerId || "").trim();
    return {
      id: config.id,
      shortTitle: config.shortTitle,
      title: config.title,
      type: "rows",
      showAttempts: true,
      showRank: Boolean(rankPools),
      rows: rows
        .filter((row) => row.grade != null && Number.isFinite(row.grade))
        .map((row) => {
          const metricId = normalizeMetricId(row.label);
          const { rank, total } = computeRushRank(rankPools?.[metricId], pid, playerName);
          return {
            label: row.label,
            grade: row.grade,
            attempts: row.attempts,
            rank,
            rankTotal: total,
            rankLabel: rank != null ? ordinal(rank) : "—",
          };
        }),
    };
  }

  function getPassingGradesTablesForPlayer(
    situationState,
    readsState,
    coverageState,
    alignmentState,
    throwTypeState,
    playerId,
    playerName
  ) {
    const tables = [];
    const situationRow = lookupSingleRowFeed(situationState, playerId, playerName);
    const situationTable = buildPassingGradesSituationTable(
      situationRow,
      situationState?.rankPools
    );
    if (situationTable) tables.push(situationTable);

    const throwTypeRow = lookupSingleRowFeed(throwTypeState, playerId, playerName);
    const throwTypeTable = buildPassingGradesThrowTypeTable(
      throwTypeRow,
      throwTypeState?.rankPools,
      throwTypeState?.metricPairs
    );
    if (throwTypeTable) tables.push(throwTypeTable);

    const qualifyingPlayerIds = getQualifyingPlayerIdsFromSituation(situationState);
    const readsRankPools = buildMultiRowRankPools(readsState?.byPlayerId, {
      qualifyingPlayerIds,
    });
    const coverageRankPools = buildMultiRowRankPools(coverageState?.byPlayerId, {
      entryFilter: (entry) => entry.includedInRank,
    });

    const readsRows = lookupMultiRowFeed(readsState, playerId, playerName);
    const readsTable = buildPassingGradesRowsTable(
      {
        id: "reads",
        shortTitle: "Reads",
        title: "Grades by read progression",
      },
      readsRows,
      readsRankPools,
      playerId,
      playerName
    );
    if (readsTable) tables.push(readsTable);

    const coverageRows = lookupMultiRowFeed(coverageState, playerId, playerName);
    const coverageTable = buildPassingGradesRowsTable(
      {
        id: "coverage",
        shortTitle: "Coverage",
        title: "Grades vs coverage",
      },
      coverageRows,
      coverageRankPools,
      playerId,
      playerName
    );
    if (coverageTable) tables.push(coverageTable);

    const alignmentRow = lookupSingleRowFeed(alignmentState, playerId, playerName);
    const alignmentTable = buildPassingGradesAlignmentTable(
      alignmentRow,
      alignmentState?.rankPools
    );
    if (alignmentTable) tables.push(alignmentTable);

    if (!tables.length) return null;
    return { tables };
  }

  function depthGradeColor(grade) {
    const g = parseFloat(grade);
    if (Number.isNaN(g)) return "#9CA3AF";
    if (g >= 90) return "#1b7a2b";
    if (g >= 80) return "#2e9e3e";
    if (g >= 70) return "#6abf4b";
    if (g >= 60) return "#c8c828";
    if (g >= 50) return "#e8a020";
    return "#d04040";
  }

  function formatDepthStat(value, format) {
    if (value == null || !Number.isFinite(value)) return null;
    if (format === "grade") return value.toFixed(1);
    if (format === "int") return Math.round(value).toLocaleString("en-US");
    if (format === "pct") return `${value.toFixed(1)}%`;
    if (format === "signed") {
      const sign = value > 0 ? "+" : "";
      return `${sign}${value.toFixed(2)}`;
    }
    return value.toFixed(1);
  }

  function depthField(row, colKey, rowKey, field) {
    if (!row) return null;
    return parseNum(row[`${colKey}_${rowKey}_${field}`]);
  }

  function parsePassingDepthCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerId: {}, byPlayerName: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const row = {};
      Object.keys(idx).forEach((header) => {
        row[header] = cell(cols, idx, header);
      });

      const playerId = cell(cols, idx, "player_id");
      const playerName = cell(cols, idx, "player");
      if (playerId) byPlayerId[String(playerId).trim()] = row;
      const name = normalizePlayerKey(playerName);
      if (name) byPlayerName[name] = row;
    }

    return { byPlayerId, byPlayerName };
  }

  function buildPassingDepthCell(row, col, rowDef) {
    const colKey = col.key;
    const rowKey = rowDef.key;
    const attempts = depthField(row, colKey, rowKey, "attempts");
    const completions = depthField(row, colKey, rowKey, "completions");
    const yards = depthField(row, colKey, rowKey, "yards");
    const touchdowns = depthField(row, colKey, rowKey, "touchdowns");
    const interceptions = depthField(row, colKey, rowKey, "interceptions");
    const grade = depthField(row, colKey, rowKey, "grades_pass");
    const qbRating = depthField(row, colKey, rowKey, "qb_rating");
    const ypa = depthField(row, colKey, rowKey, "ypa");
    const completionPercent = depthField(row, colKey, rowKey, "completion_percent");

    const detail = DEPTH_DETAIL_FIELDS.map(({ field, label, format }) => {
      const raw = depthField(row, colKey, rowKey, field);
      const value = formatDepthStat(raw, format);
      if (value == null) return null;
      return { label, value };
    }).filter(Boolean);

    return {
      colKey,
      rowKey,
      label: `${col.label} — ${rowDef.desc}`,
      attempts,
      completions,
      yards,
      touchdowns,
      interceptions,
      grade,
      gradeColor: depthGradeColor(grade),
      qbRating,
      ypa,
      completionPercent,
      detail,
    };
  }

  function buildPassingDepthModel(row) {
    if (!row) return null;

    const cells = [];
    const byKey = {};
    DEPTH_ROWS.forEach((rowDef) => {
      DEPTH_COLS.forEach((col) => {
        const cell = buildPassingDepthCell(row, col, rowDef);
        cells.push(cell);
        byKey[`${cell.colKey}|${cell.rowKey}`] = cell;
      });
    });

    const hasData = cells.some((cell) => cell.attempts != null && cell.attempts > 0);
    if (!hasData) return null;

    return {
      baseAttempts: parseNum(row.base_attempts),
      cols: DEPTH_COLS,
      rows: DEPTH_ROWS,
      cells,
      byKey,
    };
  }

  function getPassingDepthForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    let row = pid ? feedState.byPlayerId?.[pid] : null;
    if (!row && playerName) {
      row = feedState.byPlayerName?.[normalizePlayerKey(playerName)];
    }
    return buildPassingDepthModel(row);
  }

  const ACCURACY_DEPTH_COLS = [
    { key: "left", attempts: "left_attempts", accuracy: "left_accuracy" },
    { key: "right", attempts: "right_attempts", accuracy: "right_accuracy" },
    { key: "center", attempts: "center_attempts", accuracy: "center_accuracy" },
  ];

  function normalizeAccuracyDepthKey(raw) {
    const key = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[–—]/g, "-");
    if (!key) return null;
    if (key.includes("behind")) return "behind_los";
    if (key.includes("deep") || key.includes("20+")) return "deep";
    if (key.includes("medium") || key.includes("10-19")) return "medium";
    if (key.includes("short") || key.includes("0-9") || key.includes("1-9")) return "short";
    return null;
  }

  function buildAccuracyLeagueByZone(rows) {
    const accum = {};
    (rows || []).forEach((row) => {
      const rowKey = row.rowKey;
      if (!rowKey) return;
      ACCURACY_DEPTH_COLS.forEach((col) => {
        const attempts = parseNum(row[col.attempts]);
        const accuracy = parseNum(row[col.accuracy]);
        if (!attempts || attempts <= 0 || accuracy == null) return;
        const zoneKey = `${rowKey}|${col.key}`;
        if (!accum[zoneKey]) accum[zoneKey] = { attempts: 0, weightedAccuracy: 0 };
        accum[zoneKey].attempts += attempts;
        accum[zoneKey].weightedAccuracy += accuracy * attempts;
      });
    });

    const leagueByZone = {};
    Object.entries(accum).forEach(([zoneKey, bucket]) => {
      leagueByZone[zoneKey] = {
        attempts: bucket.attempts,
        accuracy: bucket.attempts ? bucket.weightedAccuracy / bucket.attempts : null,
      };
    });
    return leagueByZone;
  }

  function parseAccuracyByDepthCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, leagueByZone: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const rowKey = normalizeAccuracyDepthKey(cell(cols, idx, "targeted_depth"));
      if (!rowKey) continue;

      const record = {
        playerId: String(cell(cols, idx, "player_id") || "").trim(),
        name: cell(cols, idx, "name"),
        rowKey,
        left_attempts: cell(cols, idx, "left_attempts"),
        left_accuracy: cell(cols, idx, "left_accuracy"),
        right_attempts: cell(cols, idx, "right_attempts"),
        right_accuracy: cell(cols, idx, "right_accuracy"),
        center_attempts: cell(cols, idx, "center_attempts"),
        center_accuracy: cell(cols, idx, "center_accuracy"),
      };
      rows.push(record);

      if (record.playerId) {
        if (!byPlayerId[record.playerId]) byPlayerId[record.playerId] = [];
        byPlayerId[record.playerId].push(record);
      }
      const nameKey = normalizePlayerKey(record.name);
      if (nameKey) {
        if (!byPlayerName[nameKey]) byPlayerName[nameKey] = [];
        byPlayerName[nameKey].push(record);
      }
    }

    return {
      byPlayerId,
      byPlayerName,
      leagueByZone: buildAccuracyLeagueByZone(rows),
      rows,
    };
  }

  function buildAccuracyByDepthCell(playerRows, col, rowDef, leagueByZone) {
    const playerRow = (playerRows || []).find((row) => row.rowKey === rowDef.key);
    const colMeta = ACCURACY_DEPTH_COLS.find((entry) => entry.key === col.key);
    const attempts = playerRow ? parseNum(playerRow[colMeta.attempts]) : null;
    const accuracy = playerRow ? parseNum(playerRow[colMeta.accuracy]) : null;
    const league = leagueByZone?.[`${rowDef.key}|${col.key}`] || null;
    const leagueAccuracy = league?.accuracy ?? null;
    const delta =
      accuracy != null && leagueAccuracy != null ? accuracy - leagueAccuracy : null;
    const deltaPp = delta != null ? delta * 100 : null;

    return {
      colKey: col.key,
      rowKey: rowDef.key,
      label: `${col.label} — ${rowDef.desc}`,
      attempts,
      accuracy,
      leagueAccuracy,
      leagueAttempts: league?.attempts ?? null,
      delta,
      deltaPp,
      hasData: attempts != null && attempts > 0 && accuracy != null,
    };
  }

  function buildAccuracyByDepthModel(playerRows, leagueByZone) {
    if (!playerRows?.length) return null;

    const cells = [];
    const byKey = {};
    DEPTH_ROWS.forEach((rowDef) => {
      DEPTH_COLS.forEach((col) => {
        const cell = buildAccuracyByDepthCell(playerRows, col, rowDef, leagueByZone);
        cells.push(cell);
        byKey[`${cell.colKey}|${cell.rowKey}`] = cell;
      });
    });

    const hasData = cells.some((cell) => cell.hasData);
    if (!hasData) return null;

    return {
      cols: DEPTH_COLS,
      rows: DEPTH_ROWS,
      cells,
      byKey,
    };
  }

  function getAccuracyByDepthForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    let playerRows = pid ? feedState.byPlayerId?.[pid] : null;
    if (!playerRows?.length && playerName) {
      playerRows = feedState.byPlayerName?.[normalizePlayerKey(playerName)];
    }
    return buildAccuracyByDepthModel(playerRows, feedState.leagueByZone);
  }

  function buildGeneralAccuracyLeague(rows) {
    const accum = {};
    (rows || []).forEach((row) => {
      const key = row.depthKey;
      if (!key) return;
      const attempts = parseNum(row.attempts);
      const accuracy = parsePct(row.accuracyRaw);
      if (!attempts || attempts <= 0 || accuracy == null) return;
      if (!accum[key]) accum[key] = { attempts: 0, weightedAccuracy: 0 };
      accum[key].attempts += attempts;
      accum[key].weightedAccuracy += accuracy * attempts;
    });

    const leagueByDepth = {};
    Object.entries(accum).forEach(([depthKey, bucket]) => {
      leagueByDepth[depthKey] = {
        attempts: bucket.attempts,
        accuracy: bucket.attempts ? bucket.weightedAccuracy / bucket.attempts : null,
      };
    });
    return leagueByDepth;
  }

  function parseGeneralAccuracyCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, leagueByDepth: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const depthKey = normalizeAccuracyDepthKey(cell(cols, idx, "targeted depth"));
      if (!depthKey) continue;

      const record = {
        playerId: String(cell(cols, idx, "player id") || "").trim(),
        name: cell(cols, idx, "name"),
        depthKey,
        attempts: cell(cols, idx, "att"),
        accuracyRaw: cell(cols, idx, "acc%"),
      };
      rows.push(record);

      if (record.playerId) {
        if (!byPlayerId[record.playerId]) byPlayerId[record.playerId] = [];
        byPlayerId[record.playerId].push(record);
      }
      const nameKey = normalizePlayerKey(record.name);
      if (nameKey) {
        if (!byPlayerName[nameKey]) byPlayerName[nameKey] = [];
        byPlayerName[nameKey].push(record);
      }
    }

    return {
      byPlayerId,
      byPlayerName,
      leagueByDepth: buildGeneralAccuracyLeague(rows),
      rows,
    };
  }

  function buildGeneralAccuracyModel(playerRows, leagueByDepth) {
    if (!playerRows?.length) return null;

    const byDepth = {};
    playerRows.forEach((row) => {
      byDepth[row.depthKey] = row;
    });

    const buckets = GENERAL_ACCURACY_BUCKETS.map((bucket) => {
      const row = byDepth[bucket.key];
      const attempts = row ? parseNum(row.attempts) : null;
      const accuracy = row ? parsePct(row.accuracyRaw) : null;
      const league = leagueByDepth?.[bucket.key] || null;
      const leagueAccuracy = league?.accuracy ?? null;
      const deltaPp =
        accuracy != null && leagueAccuracy != null ? accuracy - leagueAccuracy : null;

      return {
        key: bucket.key,
        label: bucket.label,
        attempts,
        accuracy,
        leagueAccuracy,
        deltaPp,
        hasData: attempts != null && attempts > 0 && accuracy != null,
      };
    });

    if (!buckets.some((bucket) => bucket.hasData)) return null;

    return { buckets };
  }

  function getGeneralAccuracyForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    let playerRows = pid ? feedState.byPlayerId?.[pid] : null;
    if (!playerRows?.length && playerName) {
      playerRows = feedState.byPlayerName?.[normalizePlayerKey(playerName)];
    }
    return buildGeneralAccuracyModel(playerRows, feedState.leagueByDepth);
  }

  function parsePlusMetric(raw) {
    const n = parseNum(raw);
    if (n == null) return null;
    if (Math.abs(n) <= 2) return n * 100;
    return n;
  }

  function formatQbAccuracyValue(value, format) {
    if (value == null || !Number.isFinite(value)) return "—";
    if (format === "plus") {
      const sign = value > 0 ? "+" : value < 0 ? "−" : "";
      return `${sign}${Math.abs(value).toFixed(1)}%`;
    }
    return `${value.toFixed(1)}%`;
  }

  function findPctKeyForCount(idx, countLower) {
    const exact = `${countLower} %`;
    if (idx[exact] != null) return exact;
    return (
      Object.keys(idx).find((key) => {
        if (!key.endsWith(" %") && !key.endsWith("%")) return false;
        const stem = key.replace(/ %?$/, "").trim();
        return stem === countLower || stem === `${countLower} %`.replace(/ %$/, "");
      }) || null
    );
  }

  function incompletionHigherBetter(label) {
    const key = normalizeMetricKey(label);
    if (key === "receiver error") return true;
    if (key.startsWith("def")) return true;
    return false;
  }

  function parseQbAccuracyCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, rankPools: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const metrics = {};
      QB_ACCURACY_METRICS.forEach((metric) => {
        const raw = cell(cols, idx, metric.header);
        const value =
          metric.format === "plus" ? parsePlusMetric(raw) : parsePct(raw);
        metrics[metric.id] = {
          label: metric.label,
          value,
          format: metric.format,
          higherBetter: metric.higherBetter,
        };
      });

      const row = {
        player: cell(cols, idx, "player"),
        playerId: String(cell(cols, idx, "player_id") || "").trim(),
        includedInRank: isRankIncluded(cell(cols, idx, "included in rank?")),
        metrics,
      };
      rows.push(row);
      if (row.playerId) byPlayerId[row.playerId] = row;
      const nameKey = normalizePlayerKey(row.player);
      if (nameKey) byPlayerName[nameKey] = row;
    }

    const rankPools = {};
    QB_ACCURACY_METRICS.forEach((metric) => {
      rankPools[metric.id] = rows
        .filter(
          (row) =>
            row.includedInRank &&
            row.metrics[metric.id]?.value != null &&
            Number.isFinite(row.metrics[metric.id].value)
        )
        .map((row) => ({
          playerId: row.playerId,
          player: row.player,
          value: row.metrics[metric.id].value,
        }))
        .sort((a, b) =>
          metric.higherBetter ? b.value - a.value : a.value - b.value
        );
    });

    return { byPlayerId, byPlayerName, rankPools, rows };
  }

  function parseIncompletionRatesCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, categoryDefs: [], rankPools: {} };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const skip = new Set(["player id", "player_id", "name", "incomp"]);
    const categoryDefs = [];

    headers.forEach((header) => {
      const label = String(header || "").trim();
      const lower = label.toLowerCase();
      if (!label || skip.has(lower) || lower.endsWith("%") || lower.endsWith(" %")) return;
      const pctKey = findPctKeyForCount(idx, lower);
      if (!pctKey) return;
      categoryDefs.push({
        id: normalizeMetricId(label),
        label,
        countKey: lower,
        pctKey,
        higherBetter: incompletionHigherBetter(label),
      });
    });

    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const categories = {};
      categoryDefs.forEach((def) => {
        categories[def.id] = {
          label: def.label,
          count: parseNum(cell(cols, idx, def.countKey)),
          share: parsePct(cell(cols, idx, def.pctKey)),
          higherBetter: def.higherBetter,
        };
      });

      const row = {
        player: cell(cols, idx, "name"),
        playerId: String(cell(cols, idx, "player id") || cell(cols, idx, "player_id") || "").trim(),
        totalIncompletions: parseNum(cell(cols, idx, "incomp")),
        categories,
      };
      rows.push(row);
      if (row.playerId) byPlayerId[row.playerId] = row;
      const nameKey = normalizePlayerKey(row.player);
      if (nameKey) byPlayerName[nameKey] = row;
    }

    const rankPools = {};
    categoryDefs.forEach((def) => {
      rankPools[def.id] = rows
        .filter(
          (row) =>
            row.categories[def.id]?.share != null &&
            Number.isFinite(row.categories[def.id].share)
        )
        .map((row) => ({
          playerId: row.playerId,
          player: row.player,
          value: row.categories[def.id].share,
        }))
        .sort((a, b) => (def.higherBetter ? b.value - a.value : a.value - b.value));
    });

    return { byPlayerId, byPlayerName, categoryDefs, rankPools, rows };
  }

  function lookupSingleAccuracyRow(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    if (pid && feedState.byPlayerId?.[pid]) return feedState.byPlayerId[pid];
    if (playerName) return feedState.byPlayerName?.[normalizePlayerKey(playerName)] || null;
    return null;
  }

  function computeValueRank(rankPool, playerId, playerName) {
    const pool = rankPool || [];
    if (!pool.length) return { rank: null, total: 0 };

    const pid = String(playerId || "").trim();
    const nameKey = normalizePlayerKey(playerName);
    let rank = null;
    pool.forEach((entry, i) => {
      if (rank != null) return;
      if (pid && String(entry.playerId).trim() === pid) rank = i + 1;
      else if (!pid && normalizePlayerKey(entry.player) === nameKey) rank = i + 1;
    });

    return { rank, total: pool.length };
  }

  function buildQbAccuracyRatesTable(row, rankPools, playerId, playerName) {
    if (!row?.metrics) return null;
    const pid = String(playerId || "").trim();
    const tableRows = QB_ACCURACY_METRICS.map((metric) => {
      const entry = row.metrics[metric.id];
      if (!entry || entry.value == null || !Number.isFinite(entry.value)) return null;
      const { rank, total } = computeValueRank(rankPools?.[metric.id], pid, playerName);
      return {
        label: metric.label,
        value: entry.value,
        displayValue: formatQbAccuracyValue(entry.value, metric.format),
        format: metric.format,
        higherBetter: metric.higherBetter,
        rank,
        rankTotal: total,
        rankLabel: rank != null ? ordinal(rank) : "—",
      };
    }).filter(Boolean);

    if (!tableRows.length) return null;
    return {
      id: "accuracy-rates",
      shortTitle: "Accuracy rates",
      title: "Accuracy rates",
      layout: "rates",
      showRank: true,
      rows: tableRows,
    };
  }

  function buildIncompletionBreakdownTable(row, rankPools, playerId, playerName) {
    if (!row?.categories) return null;
    const pid = String(playerId || "").trim();
    const tableRows = Object.entries(row.categories)
      .map(([metricId, entry]) => {
        if (!entry || entry.share == null || !Number.isFinite(entry.share)) return null;
        const { rank, total } = computeValueRank(rankPools?.[metricId], pid, playerName);
        return {
          label: entry.label,
          count: entry.count,
          share: entry.share,
          displayShare: `${entry.share.toFixed(1)}%`,
          higherBetter: entry.higherBetter,
          rank,
          rankTotal: total,
          rankLabel: rank != null ? ordinal(rank) : "—",
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    if (!tableRows.length) return null;
    return {
      id: "incompletion",
      shortTitle: "Incompletions",
      title: "Incompletion breakdown",
      layout: "incompletion",
      showRank: true,
      totalIncompletions: row.totalIncompletions,
      rows: tableRows,
    };
  }

  function getAccuracySectionForPlayer(qbAccuracyState, incompletionState, playerId, playerName) {
    const tables = [];
    const qualifyingPlayerIds = new Set(
      Object.values(qbAccuracyState?.byPlayerId || {})
        .filter((row) => row?.includedInRank && row.playerId)
        .map((row) => String(row.playerId).trim())
    );

    const accuracyRow = lookupSingleAccuracyRow(qbAccuracyState, playerId, playerName);
    const ratesTable = buildQbAccuracyRatesTable(
      accuracyRow,
      qbAccuracyState?.rankPools,
      playerId,
      playerName
    );
    if (ratesTable) tables.push(ratesTable);

    const incompletionRow = lookupSingleAccuracyRow(incompletionState, playerId, playerName);
    let incompletionRankPools = incompletionState?.rankPools;
    if (qualifyingPlayerIds.size) {
      incompletionRankPools = {};
      Object.entries(incompletionState?.rankPools || {}).forEach(([metricId, pool]) => {
        incompletionRankPools[metricId] = (pool || []).filter((entry) =>
          qualifyingPlayerIds.has(String(entry.playerId).trim())
        );
      });
    }
    const incompletionTable = buildIncompletionBreakdownTable(
      incompletionRow,
      incompletionRankPools,
      playerId,
      playerName
    );
    if (incompletionTable) tables.push(incompletionTable);

    if (!tables.length) return null;
    return { tables };
  }

  function parseShareDecimal(raw) {
    const n = parseNum(raw);
    if (n == null) return null;
    if (Math.abs(n) <= 1.5) return n * 100;
    return n;
  }

  function parseQbAlignmentCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, rankPools: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const alignments = {};
      QB_ALIGNMENT_TYPES.forEach((type) => {
        alignments[type.id] = {
          label: type.label,
          count: parseNum(cell(cols, idx, type.countKey)),
          share: parseShareDecimal(cell(cols, idx, type.shareKey)),
        };
      });

      const row = {
        player: cell(cols, idx, "player"),
        playerId: String(cell(cols, idx, "player_id") || "").trim(),
        includedInRank: isRankIncluded(cell(cols, idx, "included in rank?")),
        totalDropbacks: parseNum(cell(cols, idx, "dropbacks")),
        alignments,
      };
      rows.push(row);
      if (row.playerId) byPlayerId[row.playerId] = row;
      const nameKey = normalizePlayerKey(row.player);
      if (nameKey) byPlayerName[nameKey] = row;
    }

    const rankPools = {};
    QB_ALIGNMENT_TYPES.forEach((type) => {
      rankPools[type.id] = rows
        .filter(
          (row) =>
            row.includedInRank &&
            row.alignments[type.id]?.share != null &&
            Number.isFinite(row.alignments[type.id].share)
        )
        .map((row) => ({
          playerId: row.playerId,
          player: row.player,
          value: row.alignments[type.id].share,
        }))
        .sort((a, b) => b.value - a.value);
    });

    return { byPlayerId, byPlayerName, rankPools, rows };
  }

  function getQbAlignmentForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const row = lookupSingleAccuracyRow(feedState, playerId, playerName);
    if (!row?.alignments) return null;

    const pid = String(playerId || "").trim();
    const tableRows = QB_ALIGNMENT_TYPES.map((type) => {
      const entry = row.alignments[type.id];
      if (!entry || entry.share == null || !Number.isFinite(entry.share)) return null;
      const { rank, total } = computeValueRank(feedState.rankPools?.[type.id], pid, playerName);
      return {
        id: type.id,
        label: entry.label,
        count: entry.count,
        share: entry.share,
        displayShare: `${entry.share.toFixed(1)}%`,
        rank,
        rankTotal: total,
        rankLabel: rank != null ? ordinal(rank) : "—",
      };
    })
      .filter(Boolean)
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    if (!tableRows.length) return null;
    return {
      totalDropbacks: row.totalDropbacks,
      rows: tableRows,
    };
  }

  function getQualifyingPlayerIdsFromPassingSummary(passingState, displaySeason) {
    const ids = new Set();
    const season = String(displaySeason || "2025");
    (passingState?.rows || []).forEach((row) => {
      if (!row?.includedInRank || !row.playerId) return;
      if (season && String(row.season || "") !== season) return;
      ids.add(String(row.playerId).trim());
    });
    return ids;
  }

  function parseAllowedPressureCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, rankPools: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const sources = {};
      ALLOWED_PRESSURE_SOURCES.forEach((source) => {
        sources[source.id] = {
          label: source.label,
          count: parseNum(cell(cols, idx, source.countKey)),
          share: parseNum(cell(cols, idx, source.shareKey)),
          lowerBetter: Boolean(source.lowerBetter),
        };
      });

      const row = {
        player: cell(cols, idx, "player"),
        playerId: String(cell(cols, idx, "player_id") || "").trim(),
        teamName: cell(cols, idx, "team_name"),
        pressuresAllowed: parseNum(cell(cols, idx, "pressures_allowed")),
        allowedPressureDropbacks: parseNum(cell(cols, idx, "allowed_pressure_dropbacks")),
        hitsAllowed: parseNum(cell(cols, idx, "hits_allowed")),
        hurriesAllowed: parseNum(cell(cols, idx, "hurries_allowed")),
        sacksAllowed: parseNum(cell(cols, idx, "sacks_allowed")),
        sources,
      };
      rows.push(row);
      if (row.playerId) byPlayerId[row.playerId] = row;
      const nameKey = normalizePlayerKey(row.player);
      if (nameKey) byPlayerName[nameKey] = row;
    }

    const rankPools = {};
    ALLOWED_PRESSURE_SOURCES.forEach((source) => {
      rankPools[source.id] = rows
        .filter(
          (row) =>
            row.sources[source.id]?.share != null &&
            Number.isFinite(row.sources[source.id].share)
        )
        .map((row) => ({
          playerId: row.playerId,
          player: row.player,
          value: row.sources[source.id].share,
        }))
        .sort((a, b) =>
          source.lowerBetter ? a.value - b.value : b.value - a.value
        );
    });

    return { byPlayerId, byPlayerName, rankPools, rows };
  }

  function getAllowedPressuresForPlayer(
    feedState,
    passingState,
    playerId,
    playerName,
    displaySeason
  ) {
    if (!feedState) return null;
    const row = lookupSingleAccuracyRow(feedState, playerId, playerName);
    if (!row?.sources) return null;

    const qualifyingPlayerIds = getQualifyingPlayerIdsFromPassingSummary(
      passingState,
      displaySeason
    );
    const pid = String(playerId || "").trim();

    const tableRows = ALLOWED_PRESSURE_SOURCES.map((source) => {
      const entry = row.sources[source.id];
      if (!entry || entry.share == null || !Number.isFinite(entry.share)) return null;

      let rankPool = feedState.rankPools?.[source.id] || [];
      if (qualifyingPlayerIds.size) {
        rankPool = rankPool.filter((entry) =>
          qualifyingPlayerIds.has(String(entry.playerId).trim())
        );
      }
      const { rank, total } = computeValueRank(rankPool, pid, playerName);

      return {
        id: source.id,
        label: entry.label,
        count: entry.count,
        share: entry.share,
        displayShare: `${entry.share.toFixed(1)}%`,
        lowerBetter: entry.lowerBetter,
        rank,
        rankTotal: total,
        rankLabel: rank != null ? ordinal(rank) : "—",
      };
    })
      .filter(Boolean)
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    if (!tableRows.length) return null;

    return {
      pressuresAllowed: row.pressuresAllowed,
      allowedPressureDropbacks: row.allowedPressureDropbacks,
      hitsAllowed: row.hitsAllowed,
      hurriesAllowed: row.hurriesAllowed,
      sacksAllowed: row.sacksAllowed,
      rows: tableRows,
    };
  }

  function parseClutchMetricValue(raw, format) {
    if (format === "grade" || format === "ypa") return parseNum(raw);
    return parseShareDecimal(raw);
  }

  function formatClutchValue(value, format) {
    if (value == null || !Number.isFinite(value)) return "—";
    if (format === "grade" || format === "ypa") return value.toFixed(1);
    return `${value.toFixed(1)}%`;
  }

  function parseClutchCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, rankPools: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const metrics = {};
      CLUTCH_METRICS.forEach((metric) => {
        metrics[metric.id] = parseClutchMetricValue(cell(cols, idx, metric.column), metric.format);
      });

      const row = {
        player: cell(cols, idx, "name") || cell(cols, idx, "player"),
        playerId: String(cell(cols, idx, "player id") || cell(cols, idx, "player_id") || "").trim(),
        teamName: cell(cols, idx, "team"),
        season: cell(cols, idx, "season"),
        includedInRank: isRankIncluded(cell(cols, idx, "included in rank?")),
        dropbacks: parseNum(cell(cols, idx, "db")),
        metrics,
      };
      rows.push(row);
      if (row.playerId) byPlayerId[row.playerId] = row;
      const nameKey = normalizePlayerKey(row.player);
      if (nameKey) byPlayerName[nameKey] = row;
    }

    const rankPools = {};
    CLUTCH_METRICS.forEach((metric) => {
      rankPools[metric.id] = rows
        .filter(
          (row) =>
            row.includedInRank &&
            row.metrics[metric.id] != null &&
            Number.isFinite(row.metrics[metric.id])
        )
        .map((row) => ({
          playerId: row.playerId,
          player: row.player,
          value: row.metrics[metric.id],
        }))
        .sort((a, b) =>
          metric.higherBetter ? b.value - a.value : a.value - b.value
        );
    });

    return { byPlayerId, byPlayerName, rankPools, rows };
  }

  function getClutchMomentsForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const row = lookupSingleAccuracyRow(feedState, playerId, playerName);
    if (!row?.metrics) return null;

    const pid = String(playerId || "").trim();
    const tableRows = CLUTCH_METRICS.map((metric) => {
      const value = row.metrics[metric.id];
      if (value == null || !Number.isFinite(value)) return null;

      let rank = null;
      let rankTotal = 0;
      if (row.includedInRank) {
        const ranked = computeValueRank(feedState.rankPools?.[metric.id], pid, playerName);
        rank = ranked.rank;
        rankTotal = ranked.total;
      }

      return {
        id: metric.id,
        label: metric.label,
        value,
        displayValue: formatClutchValue(value, metric.format),
        format: metric.format,
        higherBetter: metric.higherBetter,
        rank,
        rankTotal,
        rankLabel: rank != null ? ordinal(rank) : "—",
      };
    }).filter(Boolean);

    if (!tableRows.length) return null;

    return {
      dropbacks: row.dropbacks,
      includedInRank: row.includedInRank,
      rows: tableRows,
    };
  }

  async function ensureGeneralAccuracyLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      generalAccuracyState = parseGeneralAccuracyCsv(override);
      return generalAccuracyState;
    }
    if (generalAccuracyState) return generalAccuracyState;
    if (!generalAccuracyPromise) {
      generalAccuracyPromise = fetchCsvText(
        GENERAL_ACCURACY_URLS,
        "general-accuracy.csv",
        "generalAccuracyFeedText"
      )
        .then((text) => {
          generalAccuracyState = parseGeneralAccuracyCsv(text);
          return generalAccuracyState;
        })
        .catch((err) => {
          generalAccuracyPromise = null;
          throw err;
        });
    }
    return generalAccuracyPromise;
  }

  function invalidateGeneralAccuracyFeed() {
    generalAccuracyState = null;
    generalAccuracyPromise = null;
  }

  async function ensureQbAccuracyLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      qbAccuracyState = parseQbAccuracyCsv(override);
      return qbAccuracyState;
    }
    if (qbAccuracyState) return qbAccuracyState;
    if (!qbAccuracyPromise) {
      qbAccuracyPromise = fetchCsvText(
        QB_ACCURACY_URLS,
        "QB Accuracy.csv",
        "qbAccuracyFeedText"
      )
        .then((text) => {
          qbAccuracyState = parseQbAccuracyCsv(text);
          return qbAccuracyState;
        })
        .catch((err) => {
          qbAccuracyPromise = null;
          throw err;
        });
    }
    return qbAccuracyPromise;
  }

  function invalidateQbAccuracyFeed() {
    qbAccuracyState = null;
    qbAccuracyPromise = null;
  }

  async function ensureIncompletionRatesLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      incompletionRatesState = parseIncompletionRatesCsv(override);
      return incompletionRatesState;
    }
    if (incompletionRatesState) return incompletionRatesState;
    if (!incompletionRatesPromise) {
      incompletionRatesPromise = fetchCsvText(
        INCOMPLETION_RATES_URLS,
        "Incompletion rates.csv",
        "incompletionRatesFeedText"
      )
        .then((text) => {
          incompletionRatesState = parseIncompletionRatesCsv(text);
          return incompletionRatesState;
        })
        .catch((err) => {
          incompletionRatesPromise = null;
          throw err;
        });
    }
    return incompletionRatesPromise;
  }

  function invalidateIncompletionRatesFeed() {
    incompletionRatesState = null;
    incompletionRatesPromise = null;
  }

  async function ensureQbAlignmentLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      qbAlignmentState = parseQbAlignmentCsv(override);
      return qbAlignmentState;
    }
    if (qbAlignmentState) return qbAlignmentState;
    if (!qbAlignmentPromise) {
      qbAlignmentPromise = fetchCsvText(
        QB_ALIGNMENT_URLS,
        "qb-alignment.csv",
        "qbAlignmentFeedText"
      )
        .then((text) => {
          qbAlignmentState = parseQbAlignmentCsv(text);
          return qbAlignmentState;
        })
        .catch((err) => {
          qbAlignmentPromise = null;
          throw err;
        });
    }
    return qbAlignmentPromise;
  }

  function invalidateQbAlignmentFeed() {
    qbAlignmentState = null;
    qbAlignmentPromise = null;
  }

  async function ensureAllowedPressureLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      allowedPressureState = parseAllowedPressureCsv(override);
      return allowedPressureState;
    }
    if (allowedPressureState) return allowedPressureState;
    if (!allowedPressurePromise) {
      allowedPressurePromise = fetchCsvText(
        ALLOWED_PRESSURE_URLS,
        "passing_allowed_pressure.csv",
        "allowedPressureFeedText"
      )
        .then((text) => {
          allowedPressureState = parseAllowedPressureCsv(text);
          return allowedPressureState;
        })
        .catch((err) => {
          allowedPressurePromise = null;
          throw err;
        });
    }
    return allowedPressurePromise;
  }

  function invalidateAllowedPressureFeed() {
    allowedPressureState = null;
    allowedPressurePromise = null;
  }

  async function ensureClutchLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      clutchState = parseClutchCsv(override);
      return clutchState;
    }
    if (clutchState) return clutchState;
    if (!clutchPromise) {
      clutchPromise = fetchCsvText(CLUTCH_URLS, "clutch-2025.csv", "clutchFeedText")
        .then((text) => {
          clutchState = parseClutchCsv(text);
          return clutchState;
        })
        .catch((err) => {
          clutchPromise = null;
          throw err;
        });
    }
    return clutchPromise;
  }

  function invalidateClutchFeed() {
    clutchState = null;
    clutchPromise = null;
  }

  async function ensureWarSeasonLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      warSeasonState = parseWarSeasonCsv(override);
      return warSeasonState;
    }
    if (warSeasonState) return warSeasonState;
    if (!warSeasonPromise) {
      warSeasonPromise = fetchCsvText(WAR_SEASON_URL, "qb-war-season.csv", "warSeasonFeedText")
        .then((text) => {
          warSeasonState = parseWarSeasonCsv(text);
          return warSeasonState;
        })
        .catch((err) => {
          warSeasonPromise = null;
          throw err;
        });
    }
    return warSeasonPromise;
  }

  function invalidateWarSeasonFeed() {
    warSeasonState = null;
    warSeasonPromise = null;
  }

  async function ensureAccuracyByDepthLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      accuracyByDepthState = parseAccuracyByDepthCsv(override);
      return accuracyByDepthState;
    }
    if (accuracyByDepthState) return accuracyByDepthState;
    if (!accuracyByDepthPromise) {
      accuracyByDepthPromise = fetchCsvText(
        ACCURACY_BY_DEPTH_URL,
        "accuracy-by-depth.csv",
        "accuracyByDepthFeedText"
      )
        .then((text) => {
          accuracyByDepthState = parseAccuracyByDepthCsv(text);
          return accuracyByDepthState;
        })
        .catch((err) => {
          accuracyByDepthPromise = null;
          throw err;
        });
    }
    return accuracyByDepthPromise;
  }

  function invalidateAccuracyByDepthFeed() {
    accuracyByDepthState = null;
    accuracyByDepthPromise = null;
  }

  function buildInterceptionLuckModel(row, season) {
    if (!row) return null;

    const attempts = parseNum(row.attempts);
    const twps = parseNum(row.turnover_worthy_plays);
    const totalInts = parseNum(row.interceptions);
    const intsOnTwps = parseNum(row.ints_on_twps);
    const nonTwpInts = parseNum(row.non_twp_ints);
    const expectedTwps = parseNum(row.expected_ints_twp);
    const expectedClean = parseNum(row.expected_non_twp_int);
    const totalExpected = parseNum(row.total_expected_ints);
    const netLuck = parseNum(row.net_luck);
    const droppedInts = parseNum(row.total_dropped_interceptions);
    const droppedBad = parseNum(row.dropped_int_twp);

    if (
      attempts == null &&
      twps == null &&
      totalInts == null &&
      netLuck == null
    ) {
      return null;
    }

    const cleanAttempts =
      attempts != null && twps != null ? Math.max(0, attempts - twps) : null;
    const luckOnBad =
      expectedTwps != null && intsOnTwps != null ? expectedTwps - intsOnTwps : null;
    const luckOnGood =
      expectedClean != null && nonTwpInts != null ? expectedClean - nonTwpInts : null;
    const droppedGood =
      droppedInts != null && droppedBad != null
        ? Math.max(0, droppedInts - droppedBad)
        : null;
    const leagueTwpIntRate =
      twps && expectedTwps != null && twps > 0 ? expectedTwps / twps : null;
    const leagueCleanIntRate =
      cleanAttempts && expectedClean != null && cleanAttempts > 0
        ? expectedClean / cleanAttempts
        : null;
    const actualTotal =
      intsOnTwps != null && nonTwpInts != null ? intsOnTwps + nonTwpInts : totalInts;

    return {
      season: String(season || row.season || "").trim(),
      attempts,
      twps,
      totalInts,
      intsOnTwps,
      nonTwpInts,
      expectedTwps,
      expectedClean,
      totalExpected,
      netLuck,
      luckOnBad,
      luckOnGood,
      cleanAttempts,
      leagueTwpIntRate,
      leagueCleanIntRate,
      droppedInts,
      droppedBad,
      droppedGood,
      actualTotal,
    };
  }

  function parseIntLuckSeasonCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) return { byPlayerSeason: {} };

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerSeason = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const row = {};
      Object.keys(idx).forEach((header) => {
        row[header] = cell(cols, idx, header);
      });

      const playerId = cell(cols, idx, "player_id");
      const season = cell(cols, idx, "season");
      if (!playerId || !season) continue;

      const key = `${String(playerId).trim()}:${String(season).trim()}`;
      byPlayerSeason[key] = row;
    }

    return { byPlayerSeason };
  }

  function getInterceptionLuckForPlayer(feedState, playerId, season) {
    if (!feedState?.byPlayerSeason) return null;
    const pid = String(playerId || "").trim();
    const year = String(season || "").trim();
    if (!pid || !year) return null;

    const row = feedState.byPlayerSeason[`${pid}:${year}`];
    return buildInterceptionLuckModel(row, year);
  }

  function parseEpaSeasonCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { rows: [], byPlayerName: {}, leagueAvgBySeason: {} };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const rows = [];
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const season = parseNum(cell(cols, idx, "season"));
      const name = cell(cols, idx, "passer_name");
      const nameKey = normalizePlayerKey(name);
      const dropbacks = parseNum(cell(cols, idx, "dropbacks"));
      const totalEpa = parseNum(cell(cols, idx, "total_epa"));
        let epaPerDropback = parseNum(
          cell(cols, idx, "epa_per_dropback") ?? cell(cols, idx, "epadropback")
        );
      if (epaPerDropback == null && totalEpa != null && dropbacks) {
        epaPerDropback = totalEpa / dropbacks;
      }
      if (season == null || !nameKey || dropbacks == null) continue;

      const row = {
        season,
        gsisId: cell(cols, idx, "passer_player_gsis_id"),
        name,
        nameKey,
        dropbacks,
        totalEpa,
        epaPerDropback,
      };
      rows.push(row);

      if (!byPlayerName[nameKey]) byPlayerName[nameKey] = [];
      byPlayerName[nameKey].push(row);
    }

    const leagueAvgBySeason = {};
    const seasons = [...new Set(rows.map((row) => row.season))];
    seasons.forEach((season) => {
      const qualified = rows.filter(
        (row) => row.season === season && row.dropbacks >= SEASON_EPA_MIN_DROPBACKS
      );
      const totalDropbacks = qualified.reduce((sum, row) => sum + row.dropbacks, 0);
      const totalEpa = qualified.reduce((sum, row) => sum + (row.totalEpa ?? 0), 0);
      leagueAvgBySeason[season] = {
        epaPerDropback: totalDropbacks ? totalEpa / totalDropbacks : null,
        qualifiedCount: qualified.length,
        totalDropbacks,
      };
    });

    Object.values(byPlayerName).forEach((playerRows) => {
      playerRows.sort((a, b) => a.season - b.season);
    });

    return { rows, byPlayerName, leagueAvgBySeason };
  }

  function parseEpaCareerCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { rows: [], byPlayerName: {}, leagueAvg: null, leagueQualifiedCount: 0 };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const rows = [];
    const byPlayerName = {};

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const name = cell(cols, idx, "passer_name");
      const nameKey = normalizePlayerKey(name);
      const dropbacks = parseNum(cell(cols, idx, "dropbacks"));
      const totalEpa = parseNum(cell(cols, idx, "total_epa"));
        let epaPerDropback = parseNum(
          cell(cols, idx, "epa_per_dropback") ?? cell(cols, idx, "epadropback")
        );
      if (epaPerDropback == null && totalEpa != null && dropbacks) {
        epaPerDropback = totalEpa / dropbacks;
      }
      if (!nameKey || dropbacks == null) continue;

      const row = {
        name,
        nameKey,
        dropbacks,
        totalEpa,
        epaPerDropback,
      };
      rows.push(row);
      byPlayerName[nameKey] = row;
    }

    const qualified = rows.filter((row) => row.dropbacks >= CAREER_EPA_MIN_DROPBACKS);
    const totalDropbacks = qualified.reduce((sum, row) => sum + row.dropbacks, 0);
    const totalEpa = qualified.reduce((sum, row) => sum + (row.totalEpa ?? 0), 0);

    return {
      rows,
      byPlayerName,
      leagueAvg: totalDropbacks ? totalEpa / totalDropbacks : null,
      leagueQualifiedCount: qualified.length,
      leagueTotalDropbacks: totalDropbacks,
    };
  }

  function getEpaPerPlayForPlayer(epaState, playerName) {
    if (!epaState?.season?.byPlayerName) return null;

    const nameKey = normalizePlayerKey(playerName);
    if (!nameKey) return null;

    const playerSeasons = epaState.season.byPlayerName[nameKey] || [];
    const careerRow = epaState.career?.byPlayerName?.[nameKey] || null;
    if (!playerSeasons.length && !careerRow) return null;

    const seasons = playerSeasons.map((row) => {
      const league = epaState.season.leagueAvgBySeason?.[row.season] || {};
      return {
        season: row.season,
        epaPerDropback: row.epaPerDropback,
        dropbacks: row.dropbacks,
        totalEpa: row.totalEpa,
        leagueAvg: league.epaPerDropback ?? null,
        leagueQualifiedCount: league.qualifiedCount ?? 0,
      };
    });

    const career = careerRow
      ? {
          epaPerDropback: careerRow.epaPerDropback,
          dropbacks: careerRow.dropbacks,
          totalEpa: careerRow.totalEpa,
          leagueAvg: epaState.career?.leagueAvg ?? null,
          leagueQualifiedCount: epaState.career?.leagueQualifiedCount ?? 0,
          delta:
            careerRow.epaPerDropback != null && epaState.career?.leagueAvg != null
              ? careerRow.epaPerDropback - epaState.career.leagueAvg
              : null,
        }
      : null;

    return { seasons, career };
  }

  async function ensureEpaPerPlayLoaded(overrides = {}) {
    const seasonOverride = feedOverride(overrides.epaSeasonFeedText);
    const careerOverride = feedOverride(overrides.epaCareerFeedText);
    if (seasonOverride || careerOverride) {
      epaPerPlayState = {
        season: parseEpaSeasonCsv(seasonOverride || ""),
        career: parseEpaCareerCsv(careerOverride || ""),
      };
      return epaPerPlayState;
    }
    if (epaPerPlayState) return epaPerPlayState;
    if (!epaPerPlayPromise) {
      epaPerPlayPromise = Promise.all([
        fetchCsvText(EPA_SEASON_URL, "epa-per-play-season.csv", "epaSeasonFeedText"),
        fetchCsvText(EPA_CAREER_URL, "epa-per-play-career.csv", "epaCareerFeedText"),
      ])
        .then(([seasonText, careerText]) => {
          epaPerPlayState = {
            season: parseEpaSeasonCsv(seasonText),
            career: parseEpaCareerCsv(careerText),
          };
          return epaPerPlayState;
        })
        .catch((err) => {
          epaPerPlayPromise = null;
          throw err;
        });
    }
    return epaPerPlayPromise;
  }

  function invalidateEpaPerPlayFeed() {
    epaPerPlayState = null;
    epaPerPlayPromise = null;
  }

  function parseGradeDistributionCsv(text, playerRef) {
    const feedState = parseGradeDistributionFeedCsv(text);
    return getGradeDistributionFromFeed(
      feedState,
      playerRef?.playerId,
      playerRef?.playerName
    );
  }

  function formatHeroValue(label, value) {
    if (value == null || value === "") return "—";
    if (label === "Overall grade") return Number(value).toFixed(1);
    if (label === "Yards") return Math.round(Number(value)).toLocaleString("en-US");
    return String(Math.round(Number(value)));
  }

  function buildProfile(
    data,
    passingState,
    gameGradeFeedState,
    gradeDistributionFeedState,
    opponentsFeedState,
    gradingProfileFeedState,
    stableUnstableFeedState,
    passingPressureFeedState,
    passingConceptFeedState,
    timeInPocketFeedState,
    intLuckFeedState,
    passingDepthFeedState,
    epaPerPlayFeedState,
    accuracyByDepthFeedState,
    generalAccuracyFeedState,
    warSeasonFeedState,
    rushingFeedState,
    passingGradesSituationFeedState,
    passingGradesReadsFeedState,
    passingGradesCoverageFeedState,
    targetAlignmentFeedState,
    throwTypeFeedState,
    qbAccuracyFeedState,
    incompletionRatesFeedState,
    qbAlignmentFeedState,
    allowedPressureFeedState,
    clutchFeedState
  ) {
    const playerId = String(data.playerId || "").trim();
    const playerName = String(data.playerName || "").trim();
    const displaySeason = String(data.displaySeason || "2025");
    const errors = [];

    const passingRow = findPassingRow(passingState, playerId, playerName, displaySeason);
    const franchiseId = passingRow?.franchiseId || data.franchiseId || "";
    const teamColors = global.QbAnnualTeams.resolve(franchiseId);
    const teamName =
      teamColors.nickname || data.team || passingRow?.teamName || "Team";

    const resolvedPlayerId = playerId || passingRow?.playerId || "";
    const resolvedName = playerName || passingRow?.player || "Select a QB";

    const heroStats = [
      { label: "Overall grade", value: passingRow?.gradesPass },
      { label: "Attempts", value: passingRow?.attempts },
      { label: "Completions", value: passingRow?.completions },
      { label: "Yards", value: passingRow?.yards },
      { label: "Touchdowns", value: passingRow?.touchdowns },
      { label: "Interceptions", value: passingRow?.interceptions },
    ].map((s) => ({ label: s.label, value: formatHeroValue(s.label, s.value) }));

    const seasonGrades = SEASON_DONUT_YEARS.map((year) => {
      const row = findPassingRow(passingState, resolvedPlayerId, resolvedName, year);
      const grade = row?.gradesPass ?? null;
      const { rank, total } = computePassRank(
        year,
        grade,
        passingState?.rankPools || {},
        resolvedPlayerId,
        resolvedName
      );
      return {
        season: year,
        grade,
        rank,
        rankTotal: total,
        rankLabel: rank != null ? ordinal(rank) : "—",
      };
    });

    const seasonTimeToThrow = buildSeasonMetricSeries(
      passingState,
      resolvedPlayerId,
      resolvedName,
      SEASON_DONUT_YEARS,
      "avgTimeToThrow",
      passingState?.tttRankPools || {}
    ).map((entry) => ({
      ...entry,
      displayValue: formatTimeToThrow(entry.value),
    }));

    const seasonTargetDepth = buildSeasonMetricSeries(
      passingState,
      resolvedPlayerId,
      resolvedName,
      SEASON_DONUT_YEARS,
      "avgDepthOfTarget",
      passingState?.adotRankPools || {}
    ).map((entry) => ({
      ...entry,
      displayValue: formatAvgDepthOfTarget(entry.value),
    }));

    const seasonPressureToSackRate = buildSeasonMetricSeries(
      passingState,
      resolvedPlayerId,
      resolvedName,
      SEASON_DONUT_YEARS,
      "pressureToSackRate",
      passingState?.ptsRankPools || {}
    ).map((entry) => ({
      ...entry,
      displayValue: formatPressureToSackRate(entry.value),
    }));

    const gameGradeSeason = String(data.gameGradeSeason || "2025");
    let gameGrades = Array.isArray(data.gameGrades) ? data.gameGrades : [];
    if (!gameGrades.length) {
      gameGrades = getGameGradesFromFeed(
        gameGradeFeedState,
        resolvedPlayerId,
        gameGradeSeason
      );
    }
    if (!gameGrades.length && global.QbAnnualSeed?.gameGrades?.[resolvedPlayerId]) {
      gameGrades = global.QbAnnualSeed.gameGrades[resolvedPlayerId];
    }
    gameGrades = attachOpponentData(gameGrades, opponentsFeedState, resolvedPlayerId);

    let gradeDistribution = data.gradeDistribution || null;
    if (!gradeDistribution) {
      gradeDistribution = getGradeDistributionFromFeed(
        gradeDistributionFeedState,
        resolvedPlayerId,
        resolvedName
      );
    }
    if (
      !gradeDistribution &&
      global.QbAnnualSeed?.gradeDistribution?.[resolvedPlayerId]
    ) {
      gradeDistribution = global.QbAnnualSeed.gradeDistribution[resolvedPlayerId];
    }

    if (!passingRow && resolvedPlayerId) {
      errors.push(`No passing summary row for ${resolvedName} (${displaySeason}).`);
    }
    if (!gameGrades.length) {
      errors.push(
        `No ${gameGradeSeason} game grades found in game_grade_feed.csv for this QB.`
      );
    }
    if (!gradeDistribution) {
      errors.push(
        "No play-level grade distribution found in grade-distribution.csv for this QB."
      );
    }

    const seasonRankings = {};
    const timeToThrowRankings = {};
    const targetDepthRankings = {};
    const pressureToSackRateRankings = {};
    SEASON_DONUT_YEARS.forEach((year) => {
      seasonRankings[year] = getSeasonRankings(passingState?.rankPools, year);
      timeToThrowRankings[year] = getMetricSeasonRankings(
        passingState?.tttRankPools,
        year,
        "avgTimeToThrow",
        formatTimeToThrow
      );
      targetDepthRankings[year] = getMetricSeasonRankings(
        passingState?.adotRankPools,
        year,
        "avgDepthOfTarget",
        formatAvgDepthOfTarget
      );
      pressureToSackRateRankings[year] = getMetricSeasonRankings(
        passingState?.ptsRankPools,
        year,
        "pressureToSackRate",
        formatPressureToSackRate
      );
    });

    const warSeasons = getWarSeasonsForPlayer(warSeasonFeedState, resolvedPlayerId, resolvedName);
    const warSeasonRankings = {};
    WAR_DISPLAY_YEARS.forEach((year) => {
      warSeasonRankings[year] = getWarSeasonRankings(warSeasonFeedState?.rankPools, year);
    });

    const gradingProfile = buildGradingProfileModel(
      gradingProfileFeedState,
      resolvedPlayerId,
      passingState
    );
    if (!gradingProfile) {
      errors.push("No grading profile data found in grading profile.csv for scatter plots.");
    }

    const stableUnstable =
      getStableUnstableForPlayer(stableUnstableFeedState, resolvedName) ||
      emptyStableUnstableMetrics();

    const passingPressure = getPassingSplitsForPlayer(
      passingPressureFeedState,
      passingConceptFeedState,
      timeInPocketFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!passingPressure) {
      errors.push(
        "No passing split data found in passing_pressure.csv, passing_concept.csv, or time_in_pocket.csv for this QB."
      );
    }

    const rushing = getRushingForPlayer(rushingFeedState, resolvedPlayerId, resolvedName);
    if (!rushing) {
      errors.push("No rushing data found in rushing_summary.csv for this QB.");
    }

    const passingGradesTables = getPassingGradesTablesForPlayer(
      passingGradesSituationFeedState,
      passingGradesReadsFeedState,
      passingGradesCoverageFeedState,
      targetAlignmentFeedState,
      throwTypeFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!passingGradesTables) {
      errors.push(
        "No passing grade table data found in Passing grades by situation.csv, throw-type.csv, Reads.csv, Throws vs. coverage.csv, or target-alignment.csv for this QB."
      );
    }

    const interceptionLuck = getInterceptionLuckForPlayer(
      intLuckFeedState,
      resolvedPlayerId,
      displaySeason
    );
    if (!interceptionLuck) {
      errors.push(`No interception luck data found in int-luck-season.csv for ${displaySeason}.`);
    }

    const passingDepth = getPassingDepthForPlayer(
      passingDepthFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!passingDepth) {
      errors.push("No target depth data found in passing_depth.csv for this QB.");
    }

    const accuracyByDepth = getAccuracyByDepthForPlayer(
      accuracyByDepthFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!accuracyByDepth) {
      errors.push("No accuracy-by-depth data found in accuracy-by-depth.csv for this QB.");
    }

    const epaPerPlay = getEpaPerPlayForPlayer(epaPerPlayFeedState, resolvedName);
    if (!epaPerPlay) {
      errors.push("No EPA per play data found in epa-per-play CSVs for this QB.");
    }

    const generalAccuracy = getGeneralAccuracyForPlayer(
      generalAccuracyFeedState,
      resolvedPlayerId,
      resolvedName
    );

    const accuracySection = getAccuracySectionForPlayer(
      qbAccuracyFeedState,
      incompletionRatesFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!accuracySection) {
      errors.push(
        "No accuracy section data found in QB Accuracy.csv or Incompletion rates.csv for this QB."
      );
    }

    const qbAlignment = getQbAlignmentForPlayer(
      qbAlignmentFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!qbAlignment) {
      errors.push("No QB alignment data found in qb-alignment.csv for this QB.");
    }

    const allowedPressures = getAllowedPressuresForPlayer(
      allowedPressureFeedState,
      passingState,
      resolvedPlayerId,
      resolvedName,
      displaySeason
    );
    if (!allowedPressures) {
      errors.push(
        "No allowed pressure data found in passing_allowed_pressure.csv for this QB."
      );
    }

    const clutchMoments = getClutchMomentsForPlayer(
      clutchFeedState,
      resolvedPlayerId,
      resolvedName
    );
    if (!clutchMoments) {
      errors.push("No clutch moments data found in clutch-2025.csv for this QB.");
    }

    return {
      playerId: resolvedPlayerId,
      playerName: resolvedName,
      position: "QB",
      displaySeason,
      teamName,
      franchiseId,
      headshotUrl: headshotUrl(resolvedPlayerId),
      teamColors,
      heroStats,
      seasonGrades,
      seasonTimeToThrow,
      seasonTargetDepth,
      seasonPressureToSackRate,
      warSeasons,
      warSeasonRankings,
      timeToThrowRankings,
      targetDepthRankings,
      pressureToSackRateRankings,
      gameGrades,
      gameGradeSeason,
      gradeDistribution,
      seasonRankings,
      gradingProfile,
      stableUnstable,
      passingPressure,
      rushing,
      passingGradesTables,
      interceptionLuck,
      passingDepth,
      accuracyByDepth,
      generalAccuracy,
      accuracySection,
      qbAlignment,
      allowedPressures,
      clutchMoments,
      epaPerPlay,
      errors,
    };
  }

  async function ensureIntLuckLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      intLuckState = parseIntLuckSeasonCsv(override);
      return intLuckState;
    }
    if (intLuckState) return intLuckState;
    if (!intLuckPromise) {
      intLuckPromise = fetchCsvText(INT_LUCK_URL, "int-luck-season.csv", "intLuckFeedText")
        .then((text) => {
          intLuckState = parseIntLuckSeasonCsv(text);
          return intLuckState;
        })
        .catch((err) => {
          intLuckPromise = null;
          throw err;
        });
    }
    return intLuckPromise;
  }

  function invalidateIntLuckFeed() {
    intLuckState = null;
    intLuckPromise = null;
  }

  async function ensurePassingDepthLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingDepthState = parsePassingDepthCsv(override);
      return passingDepthState;
    }
    if (passingDepthState) return passingDepthState;
    if (!passingDepthPromise) {
      passingDepthPromise = fetchCsvText(
        PASSING_DEPTH_URL,
        "passing_depth.csv",
        "passingDepthFeedText"
      )
        .then((text) => {
          passingDepthState = parsePassingDepthCsv(text);
          return passingDepthState;
        })
        .catch((err) => {
          passingDepthPromise = null;
          throw err;
        });
    }
    return passingDepthPromise;
  }

  function invalidatePassingDepthFeed() {
    passingDepthState = null;
    passingDepthPromise = null;
  }

  async function ensurePassingPressureLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingPressureState = parsePassingPressureCsv(override);
      return passingPressureState;
    }
    if (passingPressureState) return passingPressureState;
    if (!passingPressurePromise) {
      passingPressurePromise = fetchCsvText(
        PASSING_PRESSURE_URL,
        "passing_pressure.csv",
        "passingPressureFeedText"
      )
        .then((text) => {
          passingPressureState = parsePassingPressureCsv(text);
          return passingPressureState;
        })
        .catch((err) => {
          passingPressurePromise = null;
          throw err;
        });
    }
    return passingPressurePromise;
  }

  function invalidatePassingPressureFeed() {
    passingPressureState = null;
    passingPressurePromise = null;
  }

  async function ensurePassingConceptLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingConceptState = parsePassingPressureCsv(override);
      return passingConceptState;
    }
    if (passingConceptState) return passingConceptState;
    if (!passingConceptPromise) {
      passingConceptPromise = fetchCsvText(
        PASSING_CONCEPT_URL,
        "passing_concept.csv",
        "passingConceptFeedText"
      )
        .then((text) => {
          passingConceptState = parsePassingPressureCsv(text);
          return passingConceptState;
        })
        .catch((err) => {
          passingConceptPromise = null;
          throw err;
        });
    }
    return passingConceptPromise;
  }

  function invalidatePassingConceptFeed() {
    passingConceptState = null;
    passingConceptPromise = null;
  }

  async function ensureTimeInPocketLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      timeInPocketState = parsePassingPressureCsv(override);
      return timeInPocketState;
    }
    if (timeInPocketState) return timeInPocketState;
    if (!timeInPocketPromise) {
      timeInPocketPromise = fetchCsvText(
        TIME_IN_POCKET_URL,
        "time_in_pocket.csv",
        "timeInPocketFeedText"
      )
        .then((text) => {
          timeInPocketState = parsePassingPressureCsv(text);
          return timeInPocketState;
        })
        .catch((err) => {
          timeInPocketPromise = null;
          throw err;
        });
    }
    return timeInPocketPromise;
  }

  function invalidateTimeInPocketFeed() {
    timeInPocketState = null;
    timeInPocketPromise = null;
  }

  async function ensureStableUnstableLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      stableUnstableState = parseStableUnstableFeedCsv(override);
      return stableUnstableState;
    }
    if (stableUnstableState) return stableUnstableState;
    if (!stableUnstablePromise) {
      stableUnstablePromise = fetchCsvText(
        STABLE_UNSTABLE_URLS,
        "Stable and unstable.csv",
        "stableUnstableFeedText"
      )
        .then((text) => {
          stableUnstableState = parseStableUnstableFeedCsv(text);
          return stableUnstableState;
        })
        .catch((err) => {
          stableUnstablePromise = null;
          throw err;
        });
    }
    return stableUnstablePromise;
  }

  function invalidateStableUnstableFeed() {
    stableUnstableState = null;
    stableUnstablePromise = null;
  }

  async function ensureGradingProfileLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      gradingProfileState = parseGradingProfileFeedCsv(override);
      return gradingProfileState;
    }
    if (gradingProfileState) return gradingProfileState;
    if (!gradingProfilePromise) {
      gradingProfilePromise = fetchCsvText(
        GRADING_PROFILE_URLS,
        "grading profile.csv",
        "gradingProfileFeedText"
      )
        .then((text) => {
          gradingProfileState = parseGradingProfileFeedCsv(text);
          return gradingProfileState;
        })
        .catch((err) => {
          gradingProfilePromise = null;
          throw err;
        });
    }
    return gradingProfilePromise;
  }

  function invalidateGradingProfileFeed() {
    gradingProfileState = null;
    gradingProfilePromise = null;
  }

  async function ensureOpponentsLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      opponentsState = parseOpponentsFeedCsv(override);
      return opponentsState;
    }
    if (opponentsState) return opponentsState;
    if (!opponentsPromise) {
      opponentsPromise = fetchCsvText(OPPONENTS_URL, "opponents.csv", "opponentsFeedText")
        .then((text) => {
          opponentsState = parseOpponentsFeedCsv(text);
          return opponentsState;
        })
        .catch((err) => {
          opponentsPromise = null;
          throw err;
        });
    }
    return opponentsPromise;
  }

  function invalidateOpponentsFeed() {
    opponentsState = null;
    opponentsPromise = null;
  }

  async function ensureGameGradeFeedLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      gameGradeFeedState = parseGameGradeFeedCsv(override);
      return gameGradeFeedState;
    }
    if (gameGradeFeedState) return gameGradeFeedState;
    if (!gameGradeFeedPromise) {
      gameGradeFeedPromise = fetchCsvText(
        GAME_GRADE_FEED_URL,
        "game_grade_feed.csv",
        "gameGradeFeedText"
      )
        .then((text) => {
          gameGradeFeedState = parseGameGradeFeedCsv(text);
          return gameGradeFeedState;
        })
        .catch((err) => {
          gameGradeFeedPromise = null;
          throw err;
        });
    }
    return gameGradeFeedPromise;
  }

  function invalidateGameGradeFeed() {
    gameGradeFeedState = null;
    gameGradeFeedPromise = null;
  }

  async function ensureGradeDistributionLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      gradeDistributionState = parseGradeDistributionFeedCsv(override);
      return gradeDistributionState;
    }
    if (gradeDistributionState) return gradeDistributionState;
    if (!gradeDistributionPromise) {
      gradeDistributionPromise = fetchCsvText(
        GRADE_DISTRIBUTION_URL,
        "grade-distribution.csv",
        "gradeDistributionFeedText"
      )
        .then((text) => {
          gradeDistributionState = parseGradeDistributionFeedCsv(text);
          return gradeDistributionState;
        })
        .catch((err) => {
          gradeDistributionPromise = null;
          throw err;
        });
    }
    return gradeDistributionPromise;
  }

  function invalidateGradeDistributionFeed() {
    gradeDistributionState = null;
    gradeDistributionPromise = null;
  }

  async function ensurePassingSummaryLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingSummaryState = parsePassingSummaryCsv(override);
      return passingSummaryState;
    }
    if (passingSummaryState) return passingSummaryState;
    if (!passingSummaryPromise) {
      passingSummaryPromise = fetchCsvText(
        PASSING_SUMMARY_URLS,
        "passing summary 23-25.csv",
        "passingSummaryText"
      )
        .then((text) => {
          passingSummaryState = parsePassingSummaryCsv(text);
          return passingSummaryState;
        })
        .catch((err) => {
          passingSummaryPromise = null;
          throw err;
        });
    }
    return passingSummaryPromise;
  }

  function invalidatePassingSummary() {
    passingSummaryState = null;
    passingSummaryPromise = null;
  }

  async function ensureRushingSummaryLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      rushingSummaryState = parseRushingSummaryCsv(override);
      return rushingSummaryState;
    }
    if (rushingSummaryState) return rushingSummaryState;
    if (!rushingSummaryPromise) {
      rushingSummaryPromise = fetchCsvText(
        RUSHING_SUMMARY_URL,
        "rushing_summary.csv",
        "rushingSummaryFeedText"
      )
        .then((text) => {
          rushingSummaryState = parseRushingSummaryCsv(text);
          return rushingSummaryState;
        })
        .catch((err) => {
          rushingSummaryPromise = null;
          throw err;
        });
    }
    return rushingSummaryPromise;
  }

  function invalidateRushingSummaryFeed() {
    rushingSummaryState = null;
    rushingSummaryPromise = null;
  }

  async function ensurePassingGradesSituationLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingGradesSituationState = parsePassingGradesSituationCsv(override);
      return passingGradesSituationState;
    }
    if (passingGradesSituationState) return passingGradesSituationState;
    if (!passingGradesSituationPromise) {
      passingGradesSituationPromise = fetchCsvText(
        PASSING_GRADES_SITUATION_URLS,
        "Passing grades by situation.csv",
        "passingGradesSituationFeedText"
      )
        .then((text) => {
          passingGradesSituationState = parsePassingGradesSituationCsv(text);
          return passingGradesSituationState;
        })
        .catch((err) => {
          passingGradesSituationPromise = null;
          throw err;
        });
    }
    return passingGradesSituationPromise;
  }

  function invalidatePassingGradesSituationFeed() {
    passingGradesSituationState = null;
    passingGradesSituationPromise = null;
  }

  async function ensurePassingGradesReadsLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingGradesReadsState = parsePassingGradesReadsCsv(override);
      return passingGradesReadsState;
    }
    if (passingGradesReadsState) return passingGradesReadsState;
    if (!passingGradesReadsPromise) {
      passingGradesReadsPromise = fetchCsvText(
        PASSING_GRADES_READS_URLS,
        "Reads.csv",
        "passingGradesReadsFeedText"
      )
        .then((text) => {
          passingGradesReadsState = parsePassingGradesReadsCsv(text);
          return passingGradesReadsState;
        })
        .catch((err) => {
          passingGradesReadsPromise = null;
          throw err;
        });
    }
    return passingGradesReadsPromise;
  }

  function invalidatePassingGradesReadsFeed() {
    passingGradesReadsState = null;
    passingGradesReadsPromise = null;
  }

  async function ensurePassingGradesCoverageLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      passingGradesCoverageState = parsePassingGradesCoverageCsv(override);
      return passingGradesCoverageState;
    }
    if (passingGradesCoverageState) return passingGradesCoverageState;
    if (!passingGradesCoveragePromise) {
      passingGradesCoveragePromise = fetchCsvText(
        PASSING_GRADES_COVERAGE_URLS,
        "Throws vs. coverage.csv",
        "passingGradesCoverageFeedText"
      )
        .then((text) => {
          passingGradesCoverageState = parsePassingGradesCoverageCsv(text);
          return passingGradesCoverageState;
        })
        .catch((err) => {
          passingGradesCoveragePromise = null;
          throw err;
        });
    }
    return passingGradesCoveragePromise;
  }

  function invalidatePassingGradesCoverageFeed() {
    passingGradesCoverageState = null;
    passingGradesCoveragePromise = null;
  }

  async function ensureTargetAlignmentLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      targetAlignmentState = parsePassingGradesSituationCsv(override);
      return targetAlignmentState;
    }
    if (targetAlignmentState) return targetAlignmentState;
    if (!targetAlignmentPromise) {
      targetAlignmentPromise = fetchCsvText(
        TARGET_ALIGNMENT_URLS,
        "target-alignment.csv",
        "targetAlignmentFeedText"
      )
        .then((text) => {
          targetAlignmentState = parsePassingGradesSituationCsv(text);
          return targetAlignmentState;
        })
        .catch((err) => {
          targetAlignmentPromise = null;
          throw err;
        });
    }
    return targetAlignmentPromise;
  }

  function invalidateTargetAlignmentFeed() {
    targetAlignmentState = null;
    targetAlignmentPromise = null;
  }

  async function ensureThrowTypeLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      throwTypeState = parsePassingGradesSituationCsv(override);
      return throwTypeState;
    }
    if (throwTypeState) return throwTypeState;
    if (!throwTypePromise) {
      throwTypePromise = fetchCsvText(
        THROW_TYPE_URLS,
        "throw-type.csv",
        "throwTypeFeedText"
      )
        .then((text) => {
          throwTypeState = parsePassingGradesSituationCsv(text);
          return throwTypeState;
        })
        .catch((err) => {
          throwTypePromise = null;
          throw err;
        });
    }
    return throwTypePromise;
  }

  function invalidateThrowTypeFeed() {
    throwTypeState = null;
    throwTypePromise = null;
  }

  async function ensureAllDataLoaded(overrides = {}) {
    const jobs = [
      {
        label: "passing summary",
        run: () => ensurePassingSummaryLoaded(overrides.passingSummaryText),
      },
      {
        label: "game_grade_feed.csv",
        run: () => ensureGameGradeFeedLoaded(overrides.gameGradeFeedText),
      },
      {
        label: "grade-distribution.csv",
        run: () => ensureGradeDistributionLoaded(overrides.gradeDistributionFeedText),
      },
      {
        label: "opponents.csv",
        run: () => ensureOpponentsLoaded(overrides.opponentsFeedText),
      },
      {
        label: "grading profile.csv",
        run: () => ensureGradingProfileLoaded(overrides.gradingProfileFeedText),
      },
      {
        label: "Stable and unstable.csv",
        run: () => ensureStableUnstableLoaded(overrides.stableUnstableFeedText),
      },
      {
        label: "passing_pressure.csv",
        run: () => ensurePassingPressureLoaded(overrides.passingPressureFeedText),
      },
      {
        label: "passing_concept.csv",
        run: () => ensurePassingConceptLoaded(overrides.passingConceptFeedText),
      },
      {
        label: "time_in_pocket.csv",
        run: () => ensureTimeInPocketLoaded(overrides.timeInPocketFeedText),
      },
      {
        label: "int-luck-season.csv",
        run: () => ensureIntLuckLoaded(overrides.intLuckFeedText),
      },
      {
        label: "passing_depth.csv",
        run: () => ensurePassingDepthLoaded(overrides.passingDepthFeedText),
      },
      {
        label: "accuracy-by-depth.csv",
        run: () => ensureAccuracyByDepthLoaded(overrides.accuracyByDepthFeedText),
      },
      {
        label: "general-accuracy.csv",
        run: () => ensureGeneralAccuracyLoaded(overrides.generalAccuracyFeedText),
      },
      {
        label: "QB Accuracy.csv",
        run: () => ensureQbAccuracyLoaded(overrides.qbAccuracyFeedText),
      },
      {
        label: "Incompletion rates.csv",
        run: () => ensureIncompletionRatesLoaded(overrides.incompletionRatesFeedText),
      },
      {
        label: "qb-alignment.csv",
        run: () => ensureQbAlignmentLoaded(overrides.qbAlignmentFeedText),
      },
      {
        label: "passing_allowed_pressure.csv",
        run: () => ensureAllowedPressureLoaded(overrides.allowedPressureFeedText),
      },
      {
        label: "clutch-2025.csv",
        run: () => ensureClutchLoaded(overrides.clutchFeedText),
      },
      {
        label: "qb-war-season.csv",
        run: () => ensureWarSeasonLoaded(overrides.warSeasonFeedText),
      },
      {
        label: "rushing_summary.csv",
        run: () => ensureRushingSummaryLoaded(overrides.rushingSummaryFeedText),
      },
      {
        label: "Passing grades by situation.csv",
        run: () => ensurePassingGradesSituationLoaded(overrides.passingGradesSituationFeedText),
      },
      {
        label: "Reads.csv",
        run: () => ensurePassingGradesReadsLoaded(overrides.passingGradesReadsFeedText),
      },
      {
        label: "Throws vs. coverage.csv",
        run: () => ensurePassingGradesCoverageLoaded(overrides.passingGradesCoverageFeedText),
      },
      {
        label: "target-alignment.csv",
        run: () => ensureTargetAlignmentLoaded(overrides.targetAlignmentFeedText),
      },
      {
        label: "throw-type.csv",
        run: () => ensureThrowTypeLoaded(overrides.throwTypeFeedText),
      },
      {
        label: "epa-per-play CSVs",
        run: () => ensureEpaPerPlayLoaded(overrides),
      },
    ];

    const results = await Promise.allSettled(jobs.map((job) => job.run()));
    const errors = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push(`${jobs[index].label}: ${result.reason?.message || "load failed"}`);
      }
    });

    lastLoadErrors = errors;
    return { errors };
  }

  global.QbAnnualApi = {
    PASSING_SUMMARY_URLS,
    GAME_GRADE_FEED_URL,
    GRADE_DISTRIBUTION_URL,
    OPPONENTS_URL,
    GRADING_PROFILE_URLS,
    STABLE_UNSTABLE_URLS,
    parsePassingSummaryCsv,
    parseGameGradeFeedCsv,
    parseGameGradesCsv,
    parseGradeDistributionFeedCsv,
    parseGradeDistributionCsv,
    parseOpponentsFeedCsv,
    parseGradingProfileFeedCsv,
    buildGradingProfileModel,
    parseStableUnstableFeedCsv,
    getStableUnstableForPlayer,
    parsePassingPressureCsv,
    getPassingSplitsForPlayer,
    getPassingPressureForPlayer,
    parseRushingSummaryCsv,
    getRushingForPlayer,
    formatRushingValue,
    parsePassingGradesSituationCsv,
    parsePassingGradesReadsCsv,
    parsePassingGradesCoverageCsv,
    getPassingGradesTablesForPlayer,
    depthGradeColor,
    parseIntLuckSeasonCsv,
    getInterceptionLuckForPlayer,
    buildInterceptionLuckModel,
    parseEpaSeasonCsv,
    parseEpaCareerCsv,
    getEpaPerPlayForPlayer,
    ensureEpaPerPlayLoaded,
    invalidateEpaPerPlayFeed,
    parsePassingDepthCsv,
    getPassingDepthForPlayer,
    buildPassingDepthModel,
    parseAccuracyByDepthCsv,
    getAccuracyByDepthForPlayer,
    ensureAccuracyByDepthLoaded,
    invalidateAccuracyByDepthFeed,
    parseGeneralAccuracyCsv,
    getGeneralAccuracyForPlayer,
    ensureGeneralAccuracyLoaded,
    invalidateGeneralAccuracyFeed,
    parseQbAccuracyCsv,
    parseIncompletionRatesCsv,
    getAccuracySectionForPlayer,
    ensureQbAccuracyLoaded,
    invalidateQbAccuracyFeed,
    ensureIncompletionRatesLoaded,
    invalidateIncompletionRatesFeed,
    parseQbAlignmentCsv,
    getQbAlignmentForPlayer,
    ensureQbAlignmentLoaded,
    invalidateQbAlignmentFeed,
    parseAllowedPressureCsv,
    getAllowedPressuresForPlayer,
    ensureAllowedPressureLoaded,
    invalidateAllowedPressureFeed,
    parseClutchCsv,
    getClutchMomentsForPlayer,
    ensureClutchLoaded,
    invalidateClutchFeed,
    parseWarSeasonCsv,
    getWarSeasonsForPlayer,
    getWarSeasonRankings,
    ensureWarSeasonLoaded,
    ensureRushingSummaryLoaded,
    ensurePassingGradesSituationLoaded,
    ensurePassingGradesReadsLoaded,
    ensurePassingGradesCoverageLoaded,
    ensureTargetAlignmentLoaded,
    invalidateWarSeasonFeed,
    invalidateRushingSummaryFeed,
    invalidatePassingGradesSituationFeed,
    invalidatePassingGradesReadsFeed,
    invalidatePassingGradesCoverageFeed,
    invalidateTargetAlignmentFeed,
    ensureThrowTypeLoaded,
    invalidateThrowTypeFeed,
    ensurePassingDepthLoaded,
    invalidatePassingDepthFeed,
    getGameGradesFromFeed,
    getGradeDistributionFromFeed,
    getOpponentGameFromFeed,
    getSeasonRankings,
    buildProfile,
    ensurePassingSummaryLoaded,
    ensureGameGradeFeedLoaded,
    ensureGradeDistributionLoaded,
    ensureOpponentsLoaded,
    ensureGradingProfileLoaded,
    ensureStableUnstableLoaded,
    ensurePassingPressureLoaded,
    ensurePassingConceptLoaded,
    ensureTimeInPocketLoaded,
    ensureIntLuckLoaded,
    ensureAllDataLoaded,
    invalidatePassingSummary,
    invalidateGameGradeFeed,
    invalidateGradeDistributionFeed,
    invalidateOpponentsFeed,
    invalidateGradingProfileFeed,
    invalidateStableUnstableFeed,
    invalidatePassingPressureFeed,
    invalidatePassingConceptFeed,
    invalidateTimeInPocketFeed,
    invalidateIntLuckFeed,
    getPassingSummaryState: () => passingSummaryState,
    getGameGradeFeedState: () => gameGradeFeedState,
    getGradeDistributionState: () => gradeDistributionState,
    getOpponentsState: () => opponentsState,
    getGradingProfileState: () => gradingProfileState,
    getStableUnstableState: () => stableUnstableState,
    getPassingPressureState: () => passingPressureState,
    getPassingConceptState: () => passingConceptState,
    getTimeInPocketState: () => timeInPocketState,
    getIntLuckState: () => intLuckState,
    getEpaPerPlayState: () => epaPerPlayState,
    getPassingDepthState: () => passingDepthState,
    getAccuracyByDepthState: () => accuracyByDepthState,
    getGeneralAccuracyState: () => generalAccuracyState,
    getQbAccuracyState: () => qbAccuracyState,
    getIncompletionRatesState: () => incompletionRatesState,
    getQbAlignmentState: () => qbAlignmentState,
    getAllowedPressureState: () => allowedPressureState,
    getClutchState: () => clutchState,
    getWarSeasonState: () => warSeasonState,
    getRushingSummaryState: () => rushingSummaryState,
    getPassingGradesSituationState: () => passingGradesSituationState,
    getPassingGradesReadsState: () => passingGradesReadsState,
    getPassingGradesCoverageState: () => passingGradesCoverageState,
    getTargetAlignmentState: () => targetAlignmentState,
    getThrowTypeState: () => throwTypeState,
    getLastLoadErrors: () => lastLoadErrors,
  };
})(window);
