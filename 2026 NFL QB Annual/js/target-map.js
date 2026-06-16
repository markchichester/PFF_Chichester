/**
 * Target map chart — Plotly field + play-detail overlay (preview only).
 * Separate from target depth; uses QbAnnualTargetMapApi data only.
 */
(function (global) {
  const { escapeHtml } = global.QbAnnualUtils || { escapeHtml: (s) => String(s) };
  const Api = () => global.QbAnnualTargetMapApi;
  const PLOTLY_URL = "https://cdn.plot.ly/plotly-2.30.0.min.js";

  const RESULT_COLORS = {
    COMPLETE: "#C8A800",
    INCOMPLETE: "#9CA3AF",
    TOUCHDOWN: "#2D6A4F",
    INTERCEPTION: "#DC2626",
  };

  const RESULT_LABELS = {
    COMPLETE: "Complete",
    INCOMPLETE: "Incomplete",
    TOUCHDOWN: "Touchdown",
    INTERCEPTION: "Interception",
  };

  let plotlyPromise = null;

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

  function getActiveMapSlide(widget) {
    const track = widget.querySelector(".qb-target-map-track");
    const slides = track ? [...track.querySelectorAll(".qb-target-map-slide")] : [];
    if (!track || !slides.length) return "scatter";

    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
    return slide?.dataset.mapSlide || "scatter";
  }

  function getChartElement(widget) {
    return (
      widget.querySelector('[data-map-chart-role="scatter"]') ||
      widget.querySelector(".qb-target-map-chart")
    );
  }

  function scrollToMapSlide(track, slideId) {
    const slides = [...track.querySelectorAll(".qb-target-map-slide")];
    const idx = slides.findIndex((s) => s.dataset.mapSlide === slideId);
    if (idx === -1) return;
    // Scroll only the carousel track — do not affect page scroll position
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
  }

  function syncMapTabsFromScroll(widget) {
    const track = widget.querySelector(".qb-target-map-track");
    const tabs = [...widget.querySelectorAll(".qb-target-map-tab")];
    const slides = track ? [...track.querySelectorAll(".qb-target-map-slide")] : [];
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
        const slideId = tab.dataset.mapSlideTarget;
        scrollToMapSlide(track, slideId);
        widget.querySelectorAll(".qb-target-map-tab").forEach((btn) => {
          btn.setAttribute(
            "aria-pressed",
            btn.dataset.mapSlideTarget === slideId ? "true" : "false"
          );
        });
        setViewMode(widget, slideId);
        renderWidget(widget).catch(() => {});
      });
    });

    let scrollTimer = null;
    track.addEventListener("scroll", () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        syncMapTabsFromScroll(widget);
        renderWidget(widget).catch(() => {});
      }, 80);
    });

    const defaultSlide = widget.dataset.defaultMapSlide || "depth";
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

  function buildFieldTraces(options = {}) {
    const light = options.light === true;
    const lineColor = light ? "rgba(17, 24, 39, 0.12)" : "rgba(255,255,255,0.14)";
    const losColor = light ? "rgba(17, 24, 39, 0.42)" : "rgba(255,255,255,0.85)";
    const labelColor = light ? "rgba(75, 85, 99, 0.9)" : "rgba(255,255,255,0.72)";
    const losLabelColor = light ? "rgba(55, 65, 81, 0.95)" : "rgba(255,255,255,0.9)";
    const lines = [];
    const yardLines = [-10, 10, 20, 30, 40, 50, 60];

    lines.push({
      type: "scatter",
      mode: "lines",
      x: [0, 0],
      y: [-10, 60],
      line: { width: 1, color: lineColor },
      hoverinfo: "skip",
      showlegend: false,
    });
    lines.push({
      type: "scatter",
      mode: "lines",
      x: [53.33, 53.33],
      y: [-10, 60],
      line: { width: 1, color: lineColor },
      hoverinfo: "skip",
      showlegend: false,
    });
    yardLines.forEach((y) => {
      lines.push({
        type: "scatter",
        mode: "lines",
        x: [0, 53.33],
        y: [y, y],
        line: { width: 1, color: lineColor },
        hoverinfo: "skip",
        showlegend: false,
      });
    });
    lines.push({
      type: "scatter",
      mode: "text",
      x: yardLines.map(() => -1.6),
      y: yardLines,
      text: yardLines.map((y) => String(y)),
      textfont: { size: 11, color: labelColor, family: "Archivo, sans-serif" },
      textposition: "middle left",
      hoverinfo: "skip",
      showlegend: false,
    });
    lines.push({
      type: "scatter",
      mode: "lines",
      x: [0, 53.33],
      y: [0, 0],
      line: { width: 2.5, color: losColor },
      hoverinfo: "skip",
      showlegend: false,
    });
    lines.push({
      type: "scatter",
      mode: "text",
      x: [-1.6],
      y: [0],
      text: ["Los"],
      textfont: { size: 12, color: losLabelColor, family: "Archivo, sans-serif" },
      textposition: "middle left",
      hoverinfo: "skip",
      showlegend: false,
    });
    return lines;
  }

  const MARKER_SIZE_BASE = 13;
  const MARKER_SIZE_HOVER = 20;
  const MARKER_LINE_BASE = 1.5;
  const MARKER_LINE_HOVER = 2.5;

  function getMarkerTraceIndices(chartEl) {
    return (chartEl.data || [])
      .map((trace, index) => ({ trace, index }))
      .filter(
        ({ trace }) =>
          trace.type === "scatter" && String(trace.mode || "").includes("markers")
      )
      .map(({ index }) => index);
  }

  function resetMarkerHighlights(chartEl) {
    const Plotly = global.Plotly;
    if (!Plotly || !chartEl) return;
    getMarkerTraceIndices(chartEl).forEach((traceIndex) => {
      const trace = chartEl.data[traceIndex];
      if (!trace?.x?.length) return;
      Plotly.restyle(
        chartEl,
        {
          "marker.size": [Array(trace.x.length).fill(MARKER_SIZE_BASE)],
          "marker.line.width": MARKER_LINE_BASE,
        },
        [traceIndex]
      );
    });
  }

  function highlightMarker(chartEl, point) {
    const Plotly = global.Plotly;
    if (!Plotly || !point || point.curveNumber == null) return;

    resetMarkerHighlights(chartEl);

    const traceIndex = point.curveNumber;
    const trace = chartEl.data[traceIndex];
    if (!trace?.x?.length) return;

    const sizes = Array(trace.x.length).fill(MARKER_SIZE_BASE);
    sizes[point.pointIndex] = MARKER_SIZE_HOVER;
    Plotly.restyle(
      chartEl,
      {
        "marker.size": [sizes],
        "marker.line.width": MARKER_LINE_HOVER,
      },
      [traceIndex]
    );
  }

  function getPlotData(plays) {
    const groups = {
      COMPLETE: [],
      INCOMPLETE: [],
      TOUCHDOWN: [],
      INTERCEPTION: [],
    };

    (plays || []).forEach((row) => {
      const result = Api().normalizeResultFromRow(row);
      if (!groups[result]) return;
      const x = Number(row.x);
      const y = Number(row.y);
      if (Number.isNaN(x) || Number.isNaN(y)) return;
      groups[result].push({ x, y, customdata: buildCustomData(row) });
    });

    return Object.entries(groups)
      .filter(([, items]) => items.length)
      .map(([result, items]) => ({
        type: "scatter",
        mode: "markers",
        name: RESULT_LABELS[result] || formatLabel(result),
        x: items.map((i) => i.x),
        y: items.map((i) => i.y),
        customdata: items.map((i) => i.customdata),
        hoverinfo: "none",
        hovertemplate: "<extra></extra>",
        marker: {
          size: MARKER_SIZE_BASE,
          color: RESULT_COLORS[result],
          opacity: 0.92,
          line: { width: MARKER_LINE_BASE, color: "rgba(255,255,255,0.85)" },
        },
      }));
  }

  function buildChartLayout(showLegend) {
    return {
      height: 640,
      margin: { l: 36, r: 20, t: 12, b: showLegend ? 48 : 36 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      xaxis: {
        range: [-4, 57],
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
      },
      yaxis: {
        range: [-10, 63],
        showgrid: false,
        zeroline: false,
        showticklabels: false,
        fixedrange: true,
        scaleanchor: "x",
        scaleratio: 1,
      },
      showlegend: showLegend,
      legend: showLegend
        ? {
            orientation: "h",
            y: -0.06,
            x: 0.5,
            xanchor: "center",
            font: { size: 11, color: "rgba(255,255,255,0.82)", family: "Archivo, sans-serif" },
          }
        : undefined,
      hovermode: showLegend ? "closest" : false,
      hoverdistance: 24,
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
              : "Click a dot for play details";
    }

    const hover = widget.querySelector(".qb-target-map-hover");
    if (hover && slide !== "scatter") hover.hidden = true;

    if (slide === "routes") {
      global.QbAnnualRouteTree?.renderWidget(widget.querySelector(".qb-route-tree"));
    }
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
      ["Accuracy Category", data.pass_location],
      ["Dropback Type", data.dropback_type],
      ["Route", data.route],
      ["Receiver Alignment Pre-Snap", data.target_play_position],
      ["Receiver Separation", data.separation],
      ["QB Decision", data.qb_decision],
      ["Time To Throw", data.time_to_throw],
      ["Targeted Depth", data.targeted_depth],
      ["Yards Gained", data.yards_gained],
      ["Yards After Catch", data.yards_after_catch],
      ["Dropback Steps", data.step_drop],
      ["Coverage", data.coverage],
      ["Coverage Type", data.coverage_type],
      ["EPA", data.epa],
    ]
      .filter(([, value]) => value && value !== "—")
      .map(
        ([label, value]) =>
          `<div class="qb-target-map-hover-row"><span>${escapeHtml(label)}</span><span class="value">${escapeHtml(String(value))}</span></div>`
      )
      .join("");

    panel.innerHTML = `<button type="button" class="qb-target-map-hover-close" aria-label="Close">&times;</button>
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
    chartEl.on("plotly_click", (event) => {
      const point = event?.points?.[0];
      if (!point?.customdata) return;
      renderHoverPanel(widget, point.customdata);
    });

    chartEl.on("plotly_hover", (event) => {
      highlightMarker(chartEl, event?.points?.[0]);
    });

    chartEl.on("plotly_unhover", () => {
      resetMarkerHighlights(chartEl);
    });
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

    const Plotly = await ensurePlotly();
    const filteredPlays = getFilteredPlays(widget, model.plays);
    const data = [...buildFieldTraces(), ...getPlotData(filteredPlays)];
    const layout = buildChartLayout(true);
    const config = { displayModeBar: false, responsive: true };

    await Plotly.react(chartEl, data, layout, config);
    closeHover(widget);
    updateStatline(widget, filteredPlays);
    updateFilterCount(widget, filteredPlays.length, model.plays.length);
    updateActiveFilterBadge(widget);
    setViewMode(widget, slide);

    window.setTimeout(() => {
      if (global.Plotly?.Plots?.resize) global.Plotly.Plots.resize(chartEl);
    }, 60);

    if (chartEl.removeAllListeners) {
      chartEl.removeAllListeners("plotly_click");
      chartEl.removeAllListeners("plotly_hover");
      chartEl.removeAllListeners("plotly_unhover");
    }

    wireScatterInteractions(widget, chartEl);
  }

  function initWidget(widget) {
    if (!widget || widget.dataset.mapWired === "true") return;
    widget.dataset.mapWired = "true";

    const rerender = () => {
      renderWidget(widget).catch(() => {});
    };

    wireMapCarousel(widget);

    const model = readModel(widget);
    if (!model?.plays?.length) {
      const defaultSlide = widget.dataset.defaultMapSlide || "depth";
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

    const defaultSlide = widget.dataset.defaultMapSlide || "scatter";
    setViewMode(widget, defaultSlide);
    renderWidget(widget).catch(() => {});
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
