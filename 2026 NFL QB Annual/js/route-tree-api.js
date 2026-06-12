/**
 * QB Annual — route tree data from route-data.csv
 */
(function (global) {
  const ROUTE_DATA_URLS = ["route-data.csv", encodeURI("Route data.csv")];

  const ROUTE_TREE_DEFS = [
    { key: "screen", label: "Screen", branchY: 498, endX: 70, endY: 502, labelX: 55, labelY: 502, anchor: "end" },
    { key: "flat", label: "Flat", branchY: 430, endX: 70, endY: 415, labelX: 55, labelY: 413, anchor: "end" },
    { key: "slant", label: "Slant", branchY: 430, endX: 400, endY: 360, labelX: 405, labelY: 358, anchor: "start" },
    { key: "cross", label: "Cross", branchY: 430, endX: 435, endY: 410, labelX: 450, labelY: 408, anchor: "start" },
    { key: "out", label: "Out", branchY: 330, endX: 55, endY: 330, labelX: 50, labelY: 326, anchor: "end" },
    { key: "in", label: "In", branchY: 330, endX: 425, endY: 330, labelX: 430, labelY: 326, anchor: "start" },
    { key: "comeback", label: "Comeback", branchY: 230, endX: 95, endY: 275, labelX: 80, labelY: 277, anchor: "end" },
    { key: "hitch", label: "Hitch", branchY: 230, endX: 385, endY: 275, labelX: 390, labelY: 277, anchor: "start" },
    { key: "corner", label: "Corner", branchY: 85, endX: 85, endY: 25, labelX: 70, labelY: 21, anchor: "end" },
    { key: "post", label: "Post", branchY: 85, endX: 395, endY: 25, labelX: 400, labelY: 21, anchor: "start" },
    { key: "go", label: "Go", branchY: 85, endX: 240, endY: 0, labelX: 240, labelY: -2, anchor: "middle" },
  ];

  const ROUTE_TREE_KEYS = new Set(ROUTE_TREE_DEFS.map((d) => d.key));

  const ROUTE_NAME_MAP = {
    screen: "screen",
    "wide screen": "screen",
    "backfield screen": "screen",
    flat: "flat",
    "speed out": "flat",
    slant: "slant",
    "slant route": "slant",
    "slant & go": "slant-go",
    cross: "cross",
    "crossing route": "cross",
    "cross route": "cross",
    out: "out",
    "out route": "out",
    "backfield out": "out",
    in: "in",
    "in route": "in",
    dig: "in",
    comeback: "comeback",
    "comeback route": "comeback",
    hitch: "hitch",
    "hitch route": "hitch",
    "hitch/stop & go": "hitch-stop-go",
    corner: "corner",
    "corner route": "corner",
    post: "post",
    "post route": "post",
    "post-corner route": "post-corner",
    go: "go",
    "go route": "go",
    "back shoulder go": "back-shoulder-go",
  };

  let routeDataState = null;
  let routeDataPromise = null;

  function normalizePlayerKey(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

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
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
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
    const n = parseFloat(String(raw ?? "").replace(/,/g, "").replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/[()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function routeToKey(routeName) {
    const raw = String(routeName || "").trim().toLowerCase();
    if (!raw || raw === "n/a") return null;
    if (ROUTE_NAME_MAP[raw]) return ROUTE_NAME_MAP[raw];
    const slug = slugify(routeName);
    if (slug) return slug;
    return null;
  }

  function routeLabel(routeName) {
    return String(routeName || "")
      .trim()
      .replace(/\s*Route\s*$/i, "");
  }

  function parseRouteRow(cols, idx) {
    const routeName = cell(cols, idx, "route");
    const key = routeToKey(routeName);
    if (!key) return null;

    const attempts = parseNum(cell(cols, idx, "attempts"));
    if (!attempts || attempts <= 0) return null;

    return {
      playerId: String(cell(cols, idx, "player id") || "").trim(),
      name: cell(cols, idx, "name"),
      routeName,
      key,
      label: routeLabel(routeName),
      passingGrade: parseNum(cell(cols, idx, "passing grade")),
      attempts,
      completions: parseNum(cell(cols, idx, "completions")) ?? 0,
      yards: parseNum(cell(cols, idx, "passing yards")) ?? 0,
      ypa: parseNum(cell(cols, idx, "yards per attempt")),
      touchdowns: parseNum(cell(cols, idx, "touchdowns")) ?? 0,
      interceptions: parseNum(cell(cols, idx, "interceptions")) ?? 0,
      firstDowns: parseNum(cell(cols, idx, "first downs & touchdowns")) ?? 0,
      drops: parseNum(cell(cols, idx, "dropped passes thrown")) ?? 0,
      passerRating: parseNum(cell(cols, idx, "passer rating")),
      avgTargetDepth: parseNum(cell(cols, idx, "average target depth")),
      accuracyRate: parseNum(cell(cols, idx, "accuracy rate")),
      completionPct: parseNum(cell(cols, idx, "completion %")),
      avgTimeToThrow: parseNum(cell(cols, idx, "avg. time to throw")),
      twp: parseNum(cell(cols, idx, "turnover-worthy plays")) ?? 0,
      twpRate: parseNum(cell(cols, idx, "turnover-worthy play rate")),
      btt: parseNum(cell(cols, idx, "big-time throws")) ?? 0,
      bttRate: parseNum(cell(cols, idx, "big-time throw rate")),
      onTree: ROUTE_TREE_KEYS.has(key),
    };
  }

  function mergeRouteRecords(existing, incoming) {
    if (!existing) return { ...incoming, routeNames: [incoming.routeName] };
    const attempts = (existing.attempts || 0) + (incoming.attempts || 0);
    const completions = (existing.completions || 0) + (incoming.completions || 0);
    const yards = (existing.yards || 0) + (incoming.yards || 0);
    const touchdowns = (existing.touchdowns || 0) + (incoming.touchdowns || 0);
    const interceptions = (existing.interceptions || 0) + (incoming.interceptions || 0);
    const firstDowns = (existing.firstDowns || 0) + (incoming.firstDowns || 0);
    const drops = (existing.drops || 0) + (incoming.drops || 0);
    const twp = (existing.twp || 0) + (incoming.twp || 0);
    const btt = (existing.btt || 0) + (incoming.btt || 0);

    function weightedAvg(field) {
      const total = attempts;
      if (!total) return null;
      const left = existing[field];
      const right = incoming[field];
      if (left == null && right == null) return null;
      if (left == null) return right;
      if (right == null) return left;
      return (
        ((existing.attempts || 0) * left + (incoming.attempts || 0) * right) / total
      );
    }

    const routeNames = [...(existing.routeNames || []), incoming.routeName];

    return {
      ...existing,
      routeName: routeNames.length > 1 ? routeNames.join(" / ") : incoming.routeName,
      routeNames,
      onTree: existing.onTree || incoming.onTree,
      label:
        existing.onTree || incoming.onTree
          ? ROUTE_TREE_DEFS.find((d) => d.key === existing.key)?.label || existing.label
          : existing.label,
      attempts,
      completions,
      yards,
      ypa: attempts ? yards / attempts : null,
      touchdowns,
      interceptions,
      firstDowns,
      drops,
      twp,
      btt,
      passingGrade: weightedAvg("passingGrade"),
      passerRating: weightedAvg("passerRating"),
      avgTargetDepth: weightedAvg("avgTargetDepth"),
      accuracyRate: weightedAvg("accuracyRate"),
      completionPct: weightedAvg("completionPct"),
      avgTimeToThrow: weightedAvg("avgTimeToThrow"),
      twpRate: weightedAvg("twpRate"),
      bttRate: weightedAvg("bttRate"),
    };
  }

  function parseRouteDataCsv(text) {
    const lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());
    if (lines.length < 2) {
      return { byPlayerId: {}, byPlayerName: {}, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const idx = headerIndex(headers);
    const byPlayerId = {};
    const byPlayerName = {};
    const rows = [];

    for (let li = 1; li < lines.length; li += 1) {
      const cols = parseCsvLine(lines[li]);
      if (!cols.some((c) => c.trim())) continue;
      const record = parseRouteRow(cols, idx);
      if (!record) continue;
      rows.push(record);

      if (record.playerId) {
        if (!byPlayerId[record.playerId]) byPlayerId[record.playerId] = {};
        byPlayerId[record.playerId][record.key] = mergeRouteRecords(
          byPlayerId[record.playerId][record.key],
          record
        );
      }

      const nameKey = normalizePlayerKey(record.name);
      if (nameKey) {
        if (!byPlayerName[nameKey]) byPlayerName[nameKey] = {};
        byPlayerName[nameKey][record.key] = mergeRouteRecords(
          byPlayerName[nameKey][record.key],
          record
        );
      }
    }

    return { byPlayerId, byPlayerName, rows };
  }

  function buildRouteTreeModel(playerRoutes) {
    if (!playerRoutes || !Object.keys(playerRoutes).length) return null;

    const routes = Object.values(playerRoutes)
      .filter((route) => route?.attempts > 0)
      .sort((a, b) => b.attempts - a.attempts);

    if (!routes.length) return null;

    const treeRoutes = ROUTE_TREE_DEFS.map((def) => playerRoutes[def.key]).filter(Boolean);
    const extraRoutes = routes.filter((route) => !ROUTE_TREE_KEYS.has(route.key));
    const totalAttempts = routes.reduce((sum, route) => sum + (route.attempts || 0), 0);

    return {
      defs: ROUTE_TREE_DEFS,
      routes: playerRoutes,
      routeList: routes,
      treeRoutes,
      extraRoutes,
      totalAttempts,
    };
  }

  function getRouteTreeForPlayer(feedState, playerId, playerName) {
    if (!feedState) return null;
    const pid = String(playerId || "").trim();
    let playerRoutes = pid ? feedState.byPlayerId?.[pid] : null;
    if (!playerRoutes && playerName) {
      const nameKey = normalizePlayerKey(playerName);
      playerRoutes = nameKey ? feedState.byPlayerName?.[nameKey] : null;
    }
    return buildRouteTreeModel(playerRoutes);
  }

  async function ensureRouteDataLoaded(customText) {
    const override = feedOverride(customText);
    if (override) {
      routeDataState = parseRouteDataCsv(override);
      return routeDataState;
    }
    if (routeDataState) return routeDataState;
    if (!routeDataPromise) {
      routeDataPromise = fetchCsvText(ROUTE_DATA_URLS, "route-data.csv", "routeDataFeedText")
        .then((text) => {
          routeDataState = parseRouteDataCsv(text);
          return routeDataState;
        })
        .catch((err) => {
          routeDataPromise = null;
          throw err;
        });
    }
    return routeDataPromise;
  }

  function invalidateRouteDataFeed() {
    routeDataState = null;
    routeDataPromise = null;
  }

  global.QbAnnualRouteTreeApi = {
    ROUTE_TREE_DEFS,
    ROUTE_TREE_KEYS,
    parseRouteDataCsv,
    getRouteTreeForPlayer,
    buildRouteTreeModel,
    ensureRouteDataLoaded,
    invalidateRouteDataFeed,
    getRouteDataState: () => routeDataState,
  };
})(window);
