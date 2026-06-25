/**
 * Target map chart — Plotly field + play-detail overlay (preview only).
 * Separate from target depth; uses QbAnnualTargetMapApi data only.
 */
(function (global) {
  const { escapeHtml } = global.QbAnnualUtils || { escapeHtml: (s) => String(s) };
  const Api = () => global.QbAnnualTargetMapApi;
  const PLOTLY_URL = "https://cdn.plot.ly/plotly-2.30.0.min.js";

  const RESULT_COLORS = {
    COMPLETE: "#E8C838",
    INCOMPLETE: "#94A3B8",
    TOUCHDOWN: "#4ADE80",
    INTERCEPTION: "#F87171",
  };

  const RESULT_LABELS = {
    COMPLETE: "Complete",
    INCOMPLETE: "Incomplete",
    TOUCHDOWN: "Touchdown",
    INTERCEPTION: "Interception",
  };

  let plotlyPromise = null;
  let cachedFieldDecor = null;

  function ensurePlotly() {
    if (global.Plotly) return Promise.resolve(global.Plotly);
    if (plotlyPromise) return plotlyPromise;
    plotlyPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PLOTLY_URL;
      script.onload = () => resolve(global.Plotly);
      script.onerror = () => reject(new Error("Plotly failed to load"));
      document.head.appendChild(script);
    });
    return plotlyPromise;
  }

  function readModel(widget) {
    const node = widget.querySelector(".qb-target-map-data");
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || "");
    } catch {
      return null;
    }
  }

  function formatLabel(value, fieldKey) {
    return Api()?.formatTargetMapLabel?.(value, fieldKey) || String(value ?? "");
  }

  function formatResultLabel(value) {
    return Api()?.formatTargetMapResult?.(value) || formatLabel(value);
  }

  function displayValue(value, fieldKey) {
    if (value == null || value === "") return "—";
    const s = String(value).trim();
    if (s === "" || s === "0" || (s.startsWith("#") && s.length < 50)) return "—";
    return formatLabel(s, fieldKey) || s;
  }

  function formatGrade(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    const sign = num >= 0 ? "+" : "";
    return `${sign}${num.toFixed(1)}`;
  }

  function formatTimeToThrow(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return num.toFixed(2);
  }

  function formatClock(value) {
    if (value == null || value === "") return "";
    const str = String(value).trim();
    const match = str.match(/(\d{1,2}:\d{2})/);
    if (match) return match[1];
    const num = Number(str);
    if (!Number.isFinite(num)) return str;
    let totalSeconds = num;
    if (num > 0 && num < 1) totalSeconds = num * 24 * 60 * 60;
    else if (num > 1 && num < 3600) totalSeconds = num;
    totalSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function formatEpa(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return num.toFixed(3);
  }

  function getFormation(row) {
    return Api()?.getFormation?.(row) || "Under Center";
  }

  function buildCustomData(row) {
    return {
      play_id: String(row.play_id || "").trim(),
      quarter: displayValue(row.quarter),
      down: displayValue(row.down),
      distance: displayValue(row.distance),
      game_clock: displayValue(formatClock(row.game_clock)),
      formation: displayValue(getFormation(row)),
      play_action: isTruthyOne(row.play_action) ? "Yes" : "No",
      run_pass_option: isTruthyOne(row.run_pass_option) ? "Yes" : "No",
      passer_name: displayValue(row.passer_name),
      target_name: displayValue(row.target_name),
      coverage_name: displayValue(row.coverage_name),
      passing_grade: displayValue(formatGrade(row.passer_grade)),
      result: formatResultLabel(row.result),
      pass_location: displayValue(row.pass_location),
      dropback_type: displayValue(row.dropback_type, "dropback_type"),
      route: displayValue(row.route),
      target_play_position: displayValue(row.target_play_position, "target_play_position"),
      separation: displayValue(row.separation),
      qb_decision: displayValue(row.qb_decision),
      time_to_throw: displayValue(formatTimeToThrow(row.time_to_throw)),
      coverage: displayValue(row.coverage, "coverage"),
      coverage_type: displayValue(row.coverage_type),
      throw_type: displayValue(row.throw_type),
      epa: displayValue(formatEpa(row.epa)),
      targeted_depth: displayValue(row.y),
      yards_gained: displayValue(row.yards),
      yards_after_catch: displayValue(row.yards_after_catch),
      step_drop: displayValue(row.step_drop),
    };
  }

  function isTruthyOne(value) {
    if (value === 1 || value === true || value === "Y" || value === "Yes") return true;
    const n = Number(value);
    return Number.isFinite(n) && n === 1;
  }

  function isMobileTargetMap() {
    return window.matchMedia("(max-width: 480px)").matches;
  }

  const MOBILE_HIDDEN_MAP_SLIDES = new Set(["scatter", "routes"]);

  function isSlideHiddenOnMobile(slideId) {
    return isMobileTargetMap() && MOBILE_HIDDEN_MAP_SLIDES.has(slideId);
  }

  function getVisibleMapSlides(track) {
    if (!track) return [];
    return [...track.querySelectorAll(".qb-target-map-slide")].filter(
      (slide) => !isSlideHiddenOnMobile(slide.dataset.mapSlide)
    );
  }

  function resolveMapSlide(slideId, track) {
    if (!isSlideHiddenOnMobile(slideId)) return slideId;
    return getVisibleMapSlides(track)[0]?.dataset.mapSlide || slideId;
  }

  function getActiveMapSlide(widget) {
    return widget?.dataset?.activeMapSlide || "scatter";
  }

  function getChartElement(widget) {
    return (
      widget.querySelector('[data-map-chart-role="scatter"]') ||
      widget.querySelector(".qb-target-map-chart")
    );
  }

  function scrollToMapSlide(track, slideId) {
    const slides = getVisibleMapSlides(track);
    const resolved = resolveMapSlide(slideId, track);
    const idx = slides.findIndex((s) => s.dataset.mapSlide === resolved);
    if (idx === -1) return;
    // Scroll only the carousel track — do not affect page scroll position
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
  }

  function syncMapTabsFromScroll(widget) {
    const track = widget.querySelector(".qb-target-map-track");
    const tabs = [...widget.querySelectorAll(".qb-target-map-tab")].filter(
      (tab) => !isSlideHiddenOnMobile(tab.dataset.mapSlideTarget)
    );
    const slides = getVisibleMapSlides(track);
    if (!track || !slides.length) return;

    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
    const slideId = slide?.dataset.mapSlide;
    if (!slideId) return;

    tabs.forEach((tab) => {
      tab.setAttribute(
        "aria-pressed",
        tab.dataset.mapSlideTarget === slideId ? "true" : "false"
      );
    });
    setViewMode(widget, slideId);
  }

  function wireMapCarousel(widget) {
    const track = widget.querySelector(".qb-target-map-track");
    if (!track) return;

    widget.querySelectorAll(".qb-target-map-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const slideId = resolveMapSlide(tab.dataset.mapSlideTarget, track);
        scrollToMapSlide(track, slideId);
        widget.querySelectorAll(".qb-target-map-tab").forEach((btn) => {
          btn.setAttribute(
            "aria-pressed",
            btn.dataset.mapSlideTarget === slideId ? "true" : "false"
          );
        });
        setViewMode(widget, slideId);
        if (slideId === "scatter") {
          renderWidget(widget).catch((err) => {
            console.warn("Target map render failed:", err);
          });
        }
      });
    });

    let scrollTimer = null;
    track.addEventListener("scroll", () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const slideBefore = widget.dataset.activeMapSlide || "";
        syncMapTabsFromScroll(widget);
        const slideAfter = getActiveMapSlide(widget);
        if (slideAfter !== "scatter") return;
        if (slideBefore !== "scatter") {
          renderWidget(widget).catch((err) => {
            console.warn("Target map render failed:", err);
          });
          return;
        }
        const chartEl = getChartElement(widget);
        if (chartEl && global.Plotly?.Plots?.resize) global.Plotly.Plots.resize(chartEl);
      }, 120);
    });

    const defaultSlide = resolveMapSlide(widget.dataset.defaultMapSlide || "depth", track);
    scrollToMapSlide(track, defaultSlide);
    setViewMode(widget, defaultSlide);
  }

  function getResultFilters(widget) {
    return {
      COMPLETE: widget.querySelector('[data-result-filter="COMPLETE"]')?.checked !== false,
      INCOMPLETE: widget.querySelector('[data-result-filter="INCOMPLETE"]')?.checked !== false,
      TOUCHDOWN: widget.querySelector('[data-result-filter="TOUCHDOWN"]')?.checked !== false,
      INTERCEPTION: widget.querySelector('[data-result-filter="INTERCEPTION"]')?.checked !== false,
    };
  }

  function getFieldFilters(widget) {
    const fields = {};
    widget.querySelectorAll("[data-map-filter]").forEach((select) => {
      const key = select.getAttribute("data-map-filter");
      const value = String(select.value || "").trim();
      if (key && value) fields[key] = value;
    });
    return fields;
  }

  function countActiveFilters(widget) {
    let count = 0;
    widget.querySelectorAll("[data-map-filter]").forEach((select) => {
      if (String(select.value || "").trim()) count += 1;
    });
    const results = getResultFilters(widget);
    if (!results.COMPLETE || !results.INCOMPLETE || !results.TOUCHDOWN || !results.INTERCEPTION) {
      count += 1;
    }
    return count;
  }

  function updateActiveFilterBadge(widget) {
    const badge = widget.querySelector("[data-map-active-filters]");
    if (!badge) return;
    const count = countActiveFilters(widget);
    badge.textContent = count ? `${count} Filter${count === 1 ? "" : "s"} Applied` : "No Filters Applied";
    badge.classList.toggle("is-active", count > 0);
  }

  function getFilteredPlays(widget, allPlays) {
    return Api().filterTargetMapPlays(allPlays, {
      results: getResultFilters(widget),
      fields: getFieldFilters(widget),
    });
  }

  function updateFilterCount(widget, filteredCount, totalCount) {
    const node = widget.querySelector("[data-map-filter-count]");
    if (!node) return;
    node.textContent = `Showing ${filteredCount.toLocaleString("en-US")} of ${totalCount.toLocaleString("en-US")} throws`;
  }

  function clearFilters(widget) {
    widget.querySelectorAll("[data-map-filter]").forEach((select) => {
      select.value = "";
    });
    widget.querySelectorAll("[data-result-filter]").forEach((input) => {
      input.checked = true;
    });
    updateActiveFilterBadge(widget);
  }

  function fieldLineShape(x0, y0, x1, y1, color, width) {
    return {
      type: "line",
      xref: "x",
      yref: "y",
      x0,
      y0,
      x1,
      y1,
      line: { color, width },
      layer: "below",
    };
  }

  function fieldLabelAnnotation(x, y, text, color, size = 12) {
    return {
      x,
      y,
      text,
      showarrow: false,
      xref: "x",
      yref: "y",
      font: { size, color, family: "Archivo, sans-serif" },
    };
  }

  function fieldRectShape(x0, y0, x1, y1, fillcolor) {
    return { type: "rect", xref: "x", yref: "y", x0, y0, x1, y1, fillcolor, line: { width: 0 }, layer: "below" };
  }

  function buildFieldDecor() {
    const fieldLeft = 0;
    const fieldRight = 53.33;
    const sidelineColor = "rgba(255,255,255,0.98)";
    const yardLineColor = "rgba(255,255,255,0.92)";
    const yardLine5Color = "rgba(255,255,255,0.38)";
    const hashColor = "rgba(255,255,255,0.82)";
    const hashVColor = "rgba(255,255,255,0.44)";
    const losColor = "rgba(120,210,255,1)";
    const losGlowColor = "rgba(120,210,255,0.28)";
    const labelColor = "rgba(255,255,255,0.86)";
    const losLabelColor = "rgba(120,210,255,0.98)";
    const marginLabelColor = "rgba(255,255,255,0.38)";
    const hashColumns = [23.58, 29.75];
    const majorYards = [-10, 0, 10, 20, 30, 40, 50, 60];
    const shapes = [];
    const annotations = [];

    // Field background
    shapes.push(fieldRectShape(fieldLeft, -10, fieldRight, 60, "rgba(8,12,18,.68)"));
    // End zone background
    shapes.push(fieldRectShape(fieldLeft, -10, fieldRight, 0, "rgba(6,10,16,.82)"));
    // Subtle depth-zone tints
    shapes.push(fieldRectShape(fieldLeft, 20, fieldRight, 60, "rgba(60,120,255,.03)"));
    // Out-of-bounds strips (intentional margin feel)
    shapes.push(fieldRectShape(-5.8, -10, fieldLeft, 60, "rgba(255,255,255,.018)"));
    shapes.push(fieldRectShape(fieldRight, -10, 59.1, 60, "rgba(255,255,255,.018)"));

    shapes.push(fieldLineShape(fieldLeft, -10, fieldLeft, 60, sidelineColor, 2.4));
    shapes.push(fieldLineShape(fieldRight, -10, fieldRight, 60, sidelineColor, 2.4));
    shapes.push(fieldLineShape(fieldLeft, -10, fieldRight, -10, sidelineColor, 2.4));
    shapes.push(fieldLineShape(fieldLeft, 0, fieldRight, 0, losGlowColor, 5.5));

    for (let y = -10; y <= 60; y += 5) {
      const isLos = y === 0;
      const isMajor = y % 10 === 0 || isLos;
      const color = isLos ? losColor : isMajor ? yardLineColor : yardLine5Color;
      const width = isLos ? 2.6 : isMajor ? 1.7 : 1;
      shapes.push(fieldLineShape(fieldLeft, y, fieldRight, y, color, width));
    }

    majorYards.forEach((y) => {
      hashColumns.forEach((hx) => {
        shapes.push(fieldLineShape(hx - 1.5, y, hx + 1.5, y, hashColor, 1.4));
      });
      shapes.push(fieldLineShape(fieldLeft, y, fieldLeft + 1.7, y, hashColor, 1.3));
      shapes.push(fieldLineShape(fieldRight - 1.7, y, fieldRight, y, hashColor, 1.3));
    });

    for (let y = -9.5; y < 60; y += 2) {
      if (majorYards.some((my) => Math.abs(my - y) < 0.01)) continue;
      hashColumns.forEach((hx) => {
        shapes.push(fieldLineShape(hx, y - 0.48, hx, y + 0.48, hashVColor, 0.9));
      });
    }

    // Yard numbers (inside margins)
    [10, 20, 30, 40, 50].forEach((y) => {
      annotations.push(fieldLabelAnnotation(-1.6, y, String(y), labelColor));
      annotations.push(fieldLabelAnnotation(54.93, y, String(y), labelColor));
    });
    annotations.push(fieldLabelAnnotation(-1.6, 0, "LOS", losLabelColor, 11));

    // Depth zone labels — right OOB margin
    const zoneFont = { size: 8.5, color: marginLabelColor, family: "Archivo, sans-serif" };
    [
      [40, "DEEP"],
      [15, "MEDIUM"],
      [5,  "SHORT"],
      [-5, "BEHIND"],
    ].forEach(([y, label]) => {
      annotations.push({ x: 57.2, y, text: label, showarrow: false, xref: "x", yref: "y", font: zoneFont, textangle: -90 });
    });

    // QB position marker
    annotations.push({
      x: 26.67, y: -9,
      text: "▲  QB",
      showarrow: false, xref: "x", yref: "y",
      font: { size: 9, color: "rgba(120,210,255,.6)", family: "Archivo, sans-serif" },
      xanchor: "center",
    });

    return { shapes, annotations };
  }

  function getFieldDecor() {
    if (!cachedFieldDecor) {
      cachedFieldDecor = buildFieldDecor();
    }
    return cachedFieldDecor;
  }

  const MARKER_SIZE_BASE = 13;
  const MARKER_LINE_BASE = 1.5;

  function getRenderFingerprint(widget, filteredPlays) {
    return JSON.stringify({
      results: getResultFilters(widget),
      fields: getFieldFilters(widget),
      count: filteredPlays.length,
    });
  }

  function getPlotData(plays) {
    const groups = {
      COMPLETE: [],
      INCOMPLETE: [],
      TOUCHDOWN: [],
      INTERCEPTION: [],
    };

    (plays || []).forEach((row, rowIndex) => {
      const result = Api().normalizeResultFromRow(row);
      if (!groups[result]) return;
      const x = Number(row.x);
      const y = Number(row.y);
      if (Number.isNaN(x) || Number.isNaN(y)) return;
      groups[result].push({ x, y, rowIndex });
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length)
      .map(([result, items]) => ({
        type: "scatter",
        mode: "markers",
        name: RESULT_LABELS[result] || formatLabel(result),
        x: items.map((i) => i.x),
        y: items.map((i) => i.y),
        customdata: items.map((i) => i.rowIndex),
        hoverinfo: "none",
        hovertemplate: "<extra></extra>",
        marker: {
          size: MARKER_SIZE_BASE,
          color: RESULT_COLORS[result],
          opacity: 0.96,
          line: { width: MARKER_LINE_BASE, color: "rgba(255,255,255,0.96)" },
        },
      }));
  }

  function buildChartLayout(showLegend) {
    const field = getFieldDecor();
    return {
      height: undefined,
      autosize: true,
      margin: { l: 2, r: 0, t: 4, b: showLegend ? 40 : 28 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      shapes: field.shapes,
      annotations: field.annotations,
      xaxis: {
        range: [-5.8, 59.1],
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
      },
      yaxis: {
        range: [-10.5, 60.5],
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
        scaleanchor: "x",
        scaleratio: 0.66,
      },
      showlegend: showLegend,
      legend: showLegend
        ? {
            orientation: "h",
            y: -0.01,
            x: 0.5,
            xanchor: "center",
            bgcolor: "rgba(0,0,0,0)",
            font: { size: 11, color: "rgba(255,255,255,0.88)", family: "Archivo, sans-serif" },
          }
        : undefined,
      hovermode: "closest",
      clickmode: "event",
    };
  }

  function setViewMode(widget, mode) {
    const slide =
      mode === "scatter" || mode === "depth" || mode === "accuracy" || mode === "routes"
        ? mode
        : getActiveMapSlide(widget);
    widget.dataset.activeMapSlide = slide;
    widget.classList.toggle("is-depth-view", slide === "depth" || slide === "accuracy" || slide === "routes");
    widget.querySelector("[data-map-tools]")?.classList.toggle(
      "is-hidden",
      slide === "depth" || slide === "accuracy" || slide === "routes"
    );

    const meta = widget.querySelector("[data-map-meta]");
    if (meta) {
      meta.textContent =
        slide === "depth"
          ? "Passing by depth and field location"
          : slide === "accuracy"
            ? "Accuracy percentage vs league average by field zone"
            : slide === "routes"
              ? "Click a route branch for passing stats by concept"
              : "Use the table below or activate a throw point for play details";
    }

    const hover = widget.querySelector(".qb-target-map-hover");
    if (hover && slide !== "scatter") hover.hidden = true;

    if (slide === "routes") {
      global.QbAnnualRouteTree?.renderWidget(widget.querySelector(".qb-route-tree"));
    }
  }

  function toTitleCase(str) {
    if (!str || str === "—") return str;
    return String(str).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function renderHoverPanel(widget, data) {
    const panel = widget.querySelector(".qb-target-map-hover");
    if (!panel || !data) return;

    const playId = String(data.play_id || "").trim();
    const wasHidden = panel.hidden;
    if (!wasHidden && panel.dataset.playId === playId) return;

    const pills = [
      { label: "Quarter", value: data.quarter || "—" },
      { label: "Down", value: data.down || "—" },
      { label: "Distance", value: data.distance || "—" },
      { label: "Clock", value: data.game_clock || "—" },
      { label: "Formation", value: data.formation || "—" },
    ];
    if (data.play_action === "Yes") pills.push({ label: "Play Action", flag: true });
    if (data.run_pass_option === "Yes") pills.push({ label: "Run-Pass Option", flag: true });

    const pillHtml = pills
      .map((pill) => {
        if (pill.flag) {
          return `<span class="qb-target-map-pill is-flag"><span class="qb-target-map-pill-label">${escapeHtml(pill.label)}</span></span>`;
        }
        return `<span class="qb-target-map-pill"><span class="qb-target-map-pill-label">${escapeHtml(pill.label)}</span><span class="qb-target-map-pill-value">${escapeHtml(String(pill.value))}</span></span>`;
      })
      .join("");

    const rows = [
      ["QB", data.passer_name],
      ["Target", data.target_name],
      ["Coverage Player", data.coverage_name],
      ["Result", data.result],
      ["Accuracy Category", toTitleCase(data.pass_location)],
      ["Dropback Type", data.dropback_type],
      ["Route", toTitleCase(data.route)],
      ["Receiver Alignment Pre-Snap", data.target_play_position],
      ["Receiver Separation", toTitleCase(data.separation)],
      ["QB Decision", data.qb_decision],
      ["Time To Throw", data.time_to_throw],
      ["Targeted Depth", data.targeted_depth],
      ["Yards Gained", data.yards_gained],
      ["Yards After Catch", data.yards_after_catch],
      ["Dropback Steps", data.step_drop],
      ["Coverage", toTitleCase(data.coverage)],
      ["Coverage Type", data.coverage_type],
      ["EPA", data.epa],
    ]
      .filter(([, value]) => value && value !== "—")
      .map(
        ([label, value]) =>
          `<div class="qb-target-map-hover-row"><span>${escapeHtml(label)}</span><span class="value">${escapeHtml(String(value))}</span></div>`
      )
      .join("");

    panel.innerHTML = `<button type="button" class="qb-target-map-hover-close qb-depth-detail-close" aria-label="Close">&times;</button>
<div class="qb-target-map-hover-header"><div class="qb-target-map-pills">${pillHtml}</div></div>
<div class="qb-target-map-hover-grid">${rows}</div>`;
    panel.dataset.playId = playId;
    panel.hidden = false;
    panel.classList.remove("is-opening");
    if (wasHidden) {
      panel.classList.add("is-opening");
      window.setTimeout(() => panel.classList.remove("is-opening"), 220);
    }
    panel.querySelector(".qb-target-map-hover-close")?.addEventListener("click", () => {
      closeHover(widget);
    });
  }

  function closeHover(widget) {
    const panel = widget.querySelector(".qb-target-map-hover");
    if (!panel) return;
    panel.hidden = true;
    panel.dataset.playId = "";
  }

  function wireScatterInteractions(widget, chartEl) {
    if (!chartEl?.on) return;

    if (chartEl.removeAllListeners) {
      chartEl.removeAllListeners("plotly_click");
    }

    chartEl.on("plotly_click", (event) => {
      const point = event?.points?.[0];
      if (!point) return;

      const rowIndex = Number(point.customdata);
      if (!Number.isFinite(rowIndex)) return;

      const row = widget._targetMapFilteredPlays?.[rowIndex];
      if (!row) return;

      renderHoverPanel(widget, buildCustomData(row));
    });
  }

  function renderAccessibleAlternatives(/* widget, plays */) {
    // play picker and accessible table removed
  }

  function updateStatline(widget, plays) {
    const statline = Api().buildTargetMapStatline(plays);
    widget.querySelector('[data-stat="attempts"]')?.replaceChildren(
      document.createTextNode(String(statline.attempts ?? 0))
    );
    widget.querySelector('[data-stat="completions"]')?.replaceChildren(
      document.createTextNode(String(statline.completions ?? 0))
    );
    widget.querySelector('[data-stat="yards"]')?.replaceChildren(
      document.createTextNode(Number(statline.yards || 0).toLocaleString("en-US"))
    );
    widget.querySelector('[data-stat="touchdowns"]')?.replaceChildren(
      document.createTextNode(String(statline.touchdowns ?? 0))
    );
    widget.querySelector('[data-stat="interceptions"]')?.replaceChildren(
      document.createTextNode(String(statline.interceptions ?? 0))
    );
  }

  async function renderWidget(widget) {
    const model = readModel(widget);
    const slide = getActiveMapSlide(widget);
    if (slide === "depth" || slide === "accuracy" || slide === "routes") return;

    const chartEl = getChartElement(widget);
    if (!model || !chartEl || !model.plays?.length) return;

    const renderToken = (widget._targetMapRenderToken = (widget._targetMapRenderToken || 0) + 1);
    const isCurrentRender = () => widget._targetMapRenderToken === renderToken;

    const filteredPlays = getFilteredPlays(widget, model.plays);
    const fingerprint = getRenderFingerprint(widget, filteredPlays);
    widget._targetMapFilteredPlays = filteredPlays;

    updateStatline(widget, filteredPlays);
    renderAccessibleAlternatives(widget, filteredPlays);
    updateFilterCount(widget, filteredPlays.length, model.plays.length);
    updateActiveFilterBadge(widget);
    setViewMode(widget, slide);

    if (
      widget._targetMapFingerprint === fingerprint &&
      chartEl.data?.length &&
      chartEl.dataset.mapRendered === "true"
    ) {
      if (global.Plotly?.Plots?.resize) global.Plotly.Plots.resize(chartEl);
      wireScatterInteractions(widget, chartEl);
      return;
    }

    const Plotly = await ensurePlotly();
    if (!isCurrentRender()) return;

    const layout = buildChartLayout(true);
    const config = { displayModeBar: false, responsive: true, doubleClick: false };

    await Plotly.react(chartEl, getPlotData(filteredPlays), layout, config);
    if (!isCurrentRender()) return;

    widget._targetMapFingerprint = fingerprint;
    chartEl.dataset.mapRendered = "true";

    window.requestAnimationFrame(() => {
      if (!isCurrentRender()) return;
      if (global.Plotly?.Plots?.resize) global.Plotly.Plots.resize(chartEl);
    });
    wireScatterInteractions(widget, chartEl);
  }

  function initWidget(widget) {
    if (!widget || widget.dataset.mapWired === "true") return;
    widget.dataset.mapWired = "true";

    let filterTimer = null;
    const rerender = () => {
      if (filterTimer) window.clearTimeout(filterTimer);
      filterTimer = window.setTimeout(() => {
        closeHover(widget);
        renderWidget(widget).catch((err) => {
          console.warn("Target map render failed:", err);
        });
      }, 100);
    };

    wireMapCarousel(widget);
    ensurePlotly().catch(() => {});

    const model = readModel(widget);
    if (!model?.plays?.length) {
      const track = widget.querySelector(".qb-target-map-track");
      const defaultSlide = resolveMapSlide(widget.dataset.defaultMapSlide || "depth", track);
      setViewMode(widget, defaultSlide);
      return;
    }

    widget.querySelectorAll("[data-result-filter]").forEach((input) => {
      input.addEventListener("change", rerender);
    });
    widget.querySelectorAll("[data-map-filter]").forEach((select) => {
      select.addEventListener("change", rerender);
    });
    widget.querySelector("[data-map-filter-clear]")?.addEventListener("click", () => {
      clearFilters(widget);
      rerender();
    });

    const defaultSlide = resolveMapSlide(widget.dataset.defaultMapSlide || "scatter", track);
    setViewMode(widget, defaultSlide);
    if (defaultSlide === "scatter") {
      renderWidget(widget).catch((err) => {
        console.warn("Target map render failed:", err);
      });
    }
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-target-map").forEach(initWidget);
  }

  function destroy() {
    /* re-render replaces DOM */
  }

  global.QbAnnualTargetMap = { init, destroy, renderWidget };
})(window);
