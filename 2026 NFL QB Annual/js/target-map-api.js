/**
 * Target map data — separate from passing depth / main QB Annual API.
 */
(function (global) {
  const TARGET_MAP_URL = "target-map.csv";

  let targetMapState = null;
  let targetMapPromise = null;

  function feedOverride(text) {
    return typeof text === "string" && text.trim() ? text : null;
  }

  async function fetchCsvText(url, label, bundledKey) {
    const bundled = bundledKey && global.QbAnnualBundledData?.[bundledKey];
    if (global.location?.protocol === "file:" && bundled) {
      return bundled;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (bundled) return bundled;
      throw new Error(`Could not load ${label}: ${err.message}`);
    }
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

  function cell(cols, idx, header) {
    const i = idx[String(header).toLowerCase()];
    if (i == null) return "";
    return cols[i] ?? "";
  }

  function normalizePlayerKey(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function keyVariants(key) {
    const base = String(key || "").trim().toLowerCase();
    return [...new Set([base, base.replace(/\s+/g, "_"), base.replace(/_/g, " ")])];
  }

  function pickValue(row, keys) {
    for (const key of keys) {
      for (const variant of keyVariants(key)) {
        const val = row[variant];
        if (val != null && String(val).trim() !== "") return val;
      }
    }
    return null;
  }

  function parseNum(value) {
    if (value == null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeResult(value) {
    if (value == null) return "";
    const v = String(value).trim().toLowerCase();
    if (v.includes("touch")) return "TOUCHDOWN";
    if (v.includes("interception") || v === "int") return "INTERCEPTION";
    if (v.includes("incomplete") || v === "inc") return "INCOMPLETE";
    if (v.includes("complete") || v === "comp") return "COMPLETE";
    return "INCOMPLETE";
  }

  function isTruthyOne(value) {
    if (value === 1 || value === true || value === "Y" || value === "Yes") return true;
    const n = Number(value);
    return Number.isFinite(n) && n === 1;
  }

  function normalizeResultFromRow(row) {
    if (isTruthyOne(row.touchdown)) {
      return "TOUCHDOWN";
    }
    return normalizeResult(row.result);
  }

  function parseYards(row) {
    const direct = pickValue(row, ["yards", "yds", "yards_gained", "yards_gained_on_play"]);
    if (direct != null && direct !== "") {
      const num = Number(direct);
      if (Number.isFinite(num)) return num;
    }
    const source = row.result || "";
    const match = String(source).match(/(-?\d+)\s*-?\s*yard/i);
    if (match) {
      const num = Number(match[1]);
      if (Number.isFinite(num)) return num;
    }
    return 0;
  }

  function getFormation(play) {
    const shotgun = String(play.shotgun || "").trim().toUpperCase();
    const pistol = String(play.pistol || "").trim().toUpperCase();
    if (pistol === "P") return "Pistol";
    if (shotgun === "S") return "Shotgun";
    return "Under center";
  }

  function toTitleCase(value) {
    if (value == null || value === "") return "";
    const raw = String(value).trim();
    if (!raw || raw === "0") return "";
    if (/^(pa|rpo|td|int)$/i.test(raw)) return raw.toUpperCase();
    const letters = raw.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2 && letters === letters.toUpperCase()) return raw;
    return raw
      .toLowerCase()
      .replace(/\b([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  function formatCoverageLabel(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    const upper = value.toUpperCase();
    if (/^COVER\b/.test(upper) || upper === "RED ZONE" || upper === "BRACKET") {
      return upper;
    }
    return "";
  }

  function formatAlignmentLabel(raw) {
    const value = String(raw || "").trim();
    if (!value || /\s/.test(value)) return "";
    if (/^[A-Z]{2}[a-z][A-Z]{1,3}$/.test(value)) return value;
    if (/^[A-Za-z0-9]{2,8}(?:[-/][A-Za-z0-9]{1,4})*$/.test(value)) {
      return value
        .split(/([-/])/)
        .map((part) => (/^[-/]$/.test(part) ? part : part.toUpperCase()))
        .join("");
    }
    return "";
  }

  function shouldPreserveTargetMapLabel(raw) {
    if (/^(pa|rpo|td|int|qb)$/i.test(raw)) return true;
    if (formatCoverageLabel(raw)) return true;
    if (formatAlignmentLabel(raw)) return true;
    const letters = raw.replace(/[^A-Za-z]/g, "");
    if (letters.length >= 2 && letters === letters.toUpperCase()) return true;
    if (/^[A-Z]{2,6}$/.test(raw)) return true;
    if (/^[A-Z][a-z]*(?:[-'][A-Z][a-z]+)+$/.test(raw)) return true;
    return false;
  }

  function formatTargetMapLabel(value, fieldKey) {
    if (value == null || value === "") return "";
    const raw = String(value).trim();
    if (!raw || raw === "0") return "";
    if (raw === "Yes" || raw === "No") return raw;

    const key = String(fieldKey || "").trim().toLowerCase();
    if (key === "coverage" || (!key && formatCoverageLabel(raw))) {
      const coverage = formatCoverageLabel(raw);
      if (coverage) return coverage;
    }
    if (
      key === "target_play_position" ||
      key === "coverage_play_position" ||
      key === "dropback_type" ||
      (!key && formatAlignmentLabel(raw))
    ) {
      const alignment = formatAlignmentLabel(raw);
      if (alignment) return alignment;
    }
    if (shouldPreserveTargetMapLabel(raw)) return raw;
    return toTitleCase(raw);
  }

  function formatTargetMapResult(value) {
    const normalized = normalizeResult(value);
    if (normalized === "TOUCHDOWN") return "Touchdown";
    if (normalized === "INTERCEPTION") return "Interception";
    if (normalized === "COMPLETE") return "Complete";
    if (normalized === "INCOMPLETE") return "Incomplete";
    return formatTargetMapLabel(value);
  }

  const TARGET_MAP_FILTER_FIELDS = [
    { key: "target_name", label: "Receiver" },
    { key: "coverage_type", label: "Coverage type" },
    { key: "coverage", label: "Coverage" },
    { key: "coverage_name", label: "Coverage player" },
    { key: "dropback_type", label: "Dropback type" },
    { key: "route", label: "Route" },
    { key: "pass_location", label: "Accuracy category" },
    { key: "target_play_position", label: "Receiver alignment" },
    { key: "separation", label: "Separation" },
    { key: "qb_decision", label: "QB decision" },
    { key: "throw_type", label: "Throw type" },
    { key: "quarter", label: "Quarter" },
    { key: "down", label: "Down" },
    { key: "formation", label: "Formation" },
    { key: "play_action", label: "Play-action" },
    { key: "run_pass_option", label: "RPO" },
  ];

  function isEmptyFilterValue(value) {
    if (value == null || value === "") return true;
    const s = String(value).trim();
    return s === "" || s === "0" || s === "0.0";
  }

  function getPlayFilterValue(play, fieldKey) {
    if (!play) return "";
    if (fieldKey === "formation") return getFormation(play);
    if (fieldKey === "play_action") return isTruthyOne(play.play_action) ? "Yes" : "No";
    if (fieldKey === "run_pass_option") return isTruthyOne(play.run_pass_option) ? "Yes" : "No";
    const val = play[fieldKey];
    return val == null ? "" : String(val).trim();
  }

  function buildTargetMapFilterOptions(plays) {
    const options = {};
    TARGET_MAP_FILTER_FIELDS.forEach(({ key }) => {
      const counts = {};
      (plays || []).forEach((play) => {
        const value = getPlayFilterValue(play, key);
        if (isEmptyFilterValue(value)) return;
        counts[value] = (counts[value] || 0) + 1;
      });
      options[key] = Object.entries(counts)
        .map(([value, count]) => ({
          value,
          label: formatTargetMapLabel(value, key),
          count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    });
    return options;
  }

  function filterTargetMapPlays(plays, criteria = {}) {
    const rows = Array.isArray(plays) ? plays : [];
    const results = criteria.results || {};
    const fields = criteria.fields || {};
    const activeFields = Object.entries(fields).filter(([, value]) => value);

    return rows.filter((play) => {
      const result = normalizeResultFromRow(play);
      if (results[result] === false) return false;

      for (const [key, selected] of activeFields) {
        const value = getPlayFilterValue(play, key);
        if (value !== selected) return false;
      }

      const x = Number(play.x);
      const y = Number(play.y);
      return !Number.isNaN(x) && !Number.isNaN(y);
    });
  }

  function normalizePlay(row) {
    const normalized = Object.keys(row || {}).reduce((acc, key) => {
      acc[String(key).trim()] = row[key];
      return acc;
    }, {});

    return {
      play_id: pickValue(normalized, ["play_id"]),
      quarter: pickValue(normalized, ["quarter"]),
      down: pickValue(normalized, ["down"]),
      distance: pickValue(normalized, ["distance"]),
      game_clock: pickValue(normalized, ["game_clock"]),
      passer_player_id: pickValue(normalized, ["passer_player_id", "player_id"]),
      passer_name: pickValue(normalized, ["passer_name", "qb", "quarterback", "passer"]),
      target_player_id: pickValue(normalized, ["target_player_id"]),
      target_name: pickValue(normalized, ["target_name", "receiver", "target"]),
      coverage_player_id: pickValue(normalized, ["coverage_player_id"]),
      coverage_name: pickValue(normalized, ["coverage_name", "defender", "coverage_player"]),
      coverage_play_position: pickValue(normalized, ["coverage_play_position"]),
      x: pickValue(normalized, ["x", "target_x", "x_coord"]),
      y: pickValue(normalized, ["y", "target_y", "y_coord"]),
      result: pickValue(normalized, ["result", "outcome", "completion"]),
      touchdown: pickValue(normalized, ["touchdown", "td"]),
      first_down_conv: pickValue(normalized, ["first_down_conv"]),
      yards: pickValue(normalized, ["yards", "yds", "yards_gained", "yards_gained_on_play"]),
      yards_after_catch: pickValue(normalized, ["yards_after_catch"]),
      pass_location: pickValue(normalized, ["pass_location"]),
      dropback_type: pickValue(normalized, ["dropback_type", "qb_dropback"]),
      step_drop: pickValue(normalized, ["step_drop"]),
      route: pickValue(normalized, ["route"]),
      target_play_position: pickValue(normalized, ["target_play_position"]),
      separation: pickValue(normalized, ["separation"]),
      qb_decision: pickValue(normalized, ["qb_decision"]),
      time_to_throw: pickValue(normalized, ["time_to_throw"]),
      passer_grade: pickValue(normalized, ["passer_grade", "player_grade"]),
      target_grade: pickValue(normalized, ["target_grade"]),
      coverage_grade: pickValue(normalized, ["coverage_grade"]),
      shotgun: pickValue(normalized, ["shotgun"]),
      pistol: pickValue(normalized, ["pistol"]),
      play_action: pickValue(normalized, ["play_action"]),
      run_pass_option: pickValue(normalized, ["run_pass_option"]),
      coverage: pickValue(normalized, ["coverage"]),
      coverage_type: pickValue(normalized, ["coverage_type"]),
      epa: pickValue(normalized, ["epa"]),
      throw_type: pickValue(normalized, ["throw_type"]),
    };
  }

  function parseTargetMapCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPasserId: {}, byPasserName: {} };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPasserId = {};
    const byPasserName = {};
    const allPlays = [];

    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;

      const raw = {};
      Object.keys(idx).forEach((header) => {
        raw[header] = cell(cols, idx, header);
      });

      const play = normalizePlay(raw);
      allPlays.push(play);
      const pid = String(play.passer_player_id || "").trim();
      if (pid) {
        if (!byPasserId[pid]) byPasserId[pid] = [];
        byPasserId[pid].push(play);
      }

      const nameKey = normalizePlayerKey(play.passer_name);
      if (nameKey) {
        if (!byPasserName[nameKey]) byPasserName[nameKey] = [];
        byPasserName[nameKey].push(play);
      }
    }

    return {
      byPasserId,
      byPasserName,
      allPlays,
    };
  }

  function getTargetMapPlaysForPasser(feedState, playerId, playerName) {
    if (!feedState) return [];
    const pid = String(playerId || "").trim();
    if (pid && feedState.byPasserId?.[pid]?.length) {
      return feedState.byPasserId[pid];
    }
    const nameKey = normalizePlayerKey(playerName);
    if (nameKey && feedState.byPasserName?.[nameKey]?.length) {
      return feedState.byPasserName[nameKey];
    }
    return [];
  }

  function buildTargetMapStatline(plays) {
    const rows = Array.isArray(plays) ? plays : [];
    const attempts = rows.length;
    const completions = rows.filter((r) => normalizeResultFromRow(r) === "COMPLETE").length;
    const touchdowns = rows.filter((r) => normalizeResultFromRow(r) === "TOUCHDOWN").length;
    const interceptions = rows.filter((r) => normalizeResultFromRow(r) === "INTERCEPTION").length;
    const yards = rows.reduce((sum, r) => sum + parseYards(r), 0);

    return { attempts, completions, yards, touchdowns, interceptions };
  }

  function buildTargetMapModel(plays, profile) {
    const list = Array.isArray(plays) ? plays : [];
    if (!list.length) return null;

    const playerName = profile?.playerName || list[0]?.passer_name || "Quarterback";
    const season = profile?.displaySeason || "2025";

    return {
      title: `${playerName}: Target Map (${season})`,
      season,
      playerName,
      statline: buildTargetMapStatline(list),
      filterOptions: buildTargetMapFilterOptions(list),
      filterFields: TARGET_MAP_FILTER_FIELDS,
      plays: list,
    };
  }

  async function ensureTargetMapLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      targetMapState = parseTargetMapCsv(override);
      return targetMapState;
    }
    if (targetMapState) return targetMapState;
    if (!targetMapPromise) {
      targetMapPromise = fetchCsvText(TARGET_MAP_URL, "target-map.csv", "targetMapFeedText")
        .then((text) => {
          targetMapState = parseTargetMapCsv(text);
          return targetMapState;
        })
        .catch((err) => {
          targetMapPromise = null;
          throw err;
        });
    }
    return targetMapPromise;
  }

  function invalidateTargetMapFeed() {
    targetMapState = null;
    targetMapPromise = null;
  }

  global.QbAnnualTargetMapApi = {
    TARGET_MAP_URL,
    parseTargetMapCsv,
    normalizeResultFromRow,
    parseYards,
    getTargetMapPlaysForPasser,
    buildTargetMapStatline,
    buildTargetMapModel,
    buildTargetMapFilterOptions,
    filterTargetMapPlays,
    getPlayFilterValue,
    getFormation,
    TARGET_MAP_FILTER_FIELDS,
    toTitleCase,
    formatTargetMapLabel,
    formatTargetMapResult,
    ensureTargetMapLoaded,
    invalidateTargetMapFeed,
    getTargetMapState: () => targetMapState,
  };
})(window);
