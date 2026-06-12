/**
 * QB Annual — interactive route tree visualizer
 */
(function (global) {
  const Api = () => global.QbAnnualRouteTreeApi;
  const { escapeHtml, escapeAttr } = global.QbAnnualUtils;

  const STEM_X = 240;
  const SCALE_X = 0.88;
  const ARROW_L = 14;
  const ARROW_W = 6;
  const STEM_NODES = [498, 430, 330, 230, 85];

  function readModel(root) {
    const node = root.querySelector(".qb-route-tree-data");
    if (!node?.textContent?.trim()) return null;
    try {
      return JSON.parse(node.textContent);
    } catch {
      return null;
    }
  }

  function arrowHead(sx, sy, ex, ey) {
    const dx = ex - sx;
    const dy = ey - sy;
    const ln = Math.hypot(dx, dy);
    if (ln < 1) return "";
    const ux = dx / ln;
    const uy = dy / ln;
    const px = -uy;
    const py = ux;
    const b1x = ex - ARROW_L * ux + ARROW_W * px;
    const b1y = ey - ARROW_L * uy + ARROW_W * py;
    const b2x = ex - ARROW_L * ux - ARROW_W * px;
    const b2y = ey - ARROW_L * uy - ARROW_W * py;
    return `${ex},${ey} ${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}`;
  }

  function arrowBase(sx, sy, ex, ey) {
    const dx = ex - sx;
    const dy = ey - sy;
    const ln = Math.hypot(dx, dy);
    if (ln < 1) return [ex, ey];
    const ux = dx / ln;
    const uy = dy / ln;
    return [ex - ARROW_L * ux, ey - ARROW_L * uy];
  }

  function formatCount(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return Math.round(value).toLocaleString("en-US");
  }

  function formatDecimal(value, digits = 1) {
    if (value == null || !Number.isFinite(value)) return "—";
    return value.toFixed(digits);
  }

  function formatPct(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    const normalized = value <= 1 && value >= 0 ? value * 100 : value;
    return `${normalized.toFixed(1)}%`;
  }

  function routeStrokeWidth(attempts, maxAttempts) {
    if (!attempts || !maxAttempts) return 2.5;
    const t = Math.min(1, attempts / maxAttempts);
    return 2 + t * 3.5;
  }

  function buildRouteSvg(model) {
    const defs = model.defs || Api().ROUTE_TREE_DEFS;
    const routes = model.routes || {};
    const maxAttempts = Math.max(...Object.values(routes).map((r) => r.attempts || 0), 1);
    const stemTop = 14;
    const scaleY = 0.9;
    const translateY = 22;
    const parts = [
      '<svg class="qb-route-tree-svg" viewBox="0 -5 480 515" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Route tree">',
    ];

    for (let y = 100; y <= 400; y += 100) {
      parts.push(
        `<line x1="15" y1="${y}" x2="465" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`
      );
    }

    parts.push(`<g transform="translate(0, ${translateY}) scale(1, ${scaleY}) translate(0, -5)">`);
    parts.push(`<line x1="${STEM_X}" y1="502" x2="${STEM_X}" y2="${stemTop}" class="qb-route-tree-stem"/>`);
    STEM_NODES.forEach((y) => {
      parts.push(`<circle cx="${STEM_X}" cy="${y}" r="5" class="qb-route-tree-node"/>`);
    });

    function addRoute(def) {
      const route = routes[def.key];
      const hasData = !!route?.attempts;
      const startY = def.key === "go" ? 502 : def.branchY;
      const ex = STEM_X + (def.endX - STEM_X) * SCALE_X;
      const ey = def.endY;
      const [bx, by] = arrowBase(STEM_X, startY, ex, ey);
      const width = routeStrokeWidth(route?.attempts, maxAttempts);

      parts.push(
        `<g class="qb-route-tree-group${hasData ? " has-data" : ""}" data-route-key="${escapeAttr(def.key)}">`
      );
      parts.push(`<circle cx="${STEM_X}" cy="${startY}" r="5" class="qb-route-tree-group-node"/>`);
      parts.push(
        `<line class="qb-route-tree-line" data-route-key="${escapeAttr(def.key)}" x1="${STEM_X}" y1="${startY}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke-width="${width.toFixed(2)}"/>`
      );
      const ah = arrowHead(STEM_X, startY, ex, ey);
      if (ah) {
        parts.push(
          `<polygon class="qb-route-tree-arrow" data-route-key="${escapeAttr(def.key)}" points="${ah}"/>`
        );
      }
      parts.push("</g>");
    }

    const goDef = defs.find((d) => d.key === "go");
    if (goDef) addRoute(goDef);
    defs.filter((d) => d.key !== "go").forEach(addRoute);

    parts.push(`<circle cx="${STEM_X}" cy="502" r="13" class="qb-route-tree-qb-dot"/>`);
    parts.push(
      `<text x="${STEM_X}" y="507" class="qb-route-tree-qb-text" text-anchor="middle">QB</text>`
    );
    parts.push(
      '<ellipse cx="428" cy="492" rx="14" ry="6" class="qb-route-tree-ball" transform="rotate(90 428 492)"/>'
    );
    parts.push(
      '<text x="455" y="496" class="qb-route-tree-ball-text" text-anchor="start">Ball</text>'
    );
    parts.push("</g></svg>");
    return parts.join("");
  }

  function labelPosition(def) {
    const scaleY = 0.9;
    const translateY = 22;
    const vbW = 480;
    const vbH = 520;
    const lx = STEM_X + (def.labelX - STEM_X) * SCALE_X;
    const ly = def.labelY;
    const yt = (ly - 5) * scaleY + translateY + 5;
    return {
      left: (lx / vbW) * 100,
      top: (yt / vbH) * 100,
      anchor: def.anchor || "middle",
    };
  }

  function buildLabelPills(model) {
    const defs = model.defs || Api().ROUTE_TREE_DEFS;
    const routes = model.routes || {};

    return defs
      .map((def) => {
        const route = routes[def.key];
        const hasData = !!route?.attempts;
        const pos = labelPosition(def);
        const anchorClass =
          pos.anchor === "end" ? " is-end" : pos.anchor === "start" ? " is-start" : " is-middle";
        const gradeHtml = hasData
          ? `<span class="qb-route-tree-label-grade">${escapeHtml(formatDecimal(route.passingGrade, 1))}</span>`
          : `<span class="qb-route-tree-label-grade is-empty">—</span>`;

        return `<button type="button" class="qb-route-tree-label-pill${anchorClass}${hasData ? " has-data" : ""}" data-route-key="${escapeAttr(def.key)}" style="left:${pos.left.toFixed(2)}%;top:${pos.top.toFixed(2)}%;" aria-label="${escapeAttr(`${def.label}${hasData ? `: grade ${formatDecimal(route.passingGrade, 1)}` : ""}`)}"${hasData ? "" : " disabled"}>
  <span class="qb-route-tree-label-name">${escapeHtml(def.label)}</span>
  ${gradeHtml}
</button>`;
      })
      .join("");
  }

  function buildHitAreas() {
    return "";
  }

  function detailRows(route) {
    return [
      ["Passing grade", formatDecimal(route.passingGrade, 1)],
      ["Attempts", formatCount(route.attempts)],
      ["Completions", formatCount(route.completions)],
      ["Passing yards", formatCount(route.yards)],
      ["Yards per attempt", formatDecimal(route.ypa, 1)],
      ["Touchdowns", formatCount(route.touchdowns)],
      ["Interceptions", formatCount(route.interceptions)],
      ["First downs", formatCount(route.firstDowns)],
      ["Dropped passes", formatCount(route.drops)],
      ["Passer rating", formatDecimal(route.passerRating, 1)],
      ["Avg target depth", formatDecimal(route.avgTargetDepth, 1)],
      ["Accuracy rate", formatPct(route.accuracyRate)],
      ["Completion %", formatPct(route.completionPct)],
      ["Avg time to throw", route.avgTimeToThrow != null ? `${formatDecimal(route.avgTimeToThrow, 2)}s` : "—"],
      ["Turnover-worthy plays", formatCount(route.twp)],
      ["TWP rate", formatPct(route.twpRate)],
      ["Big-time throws", formatCount(route.btt)],
      ["BTT rate", formatPct(route.bttRate)],
    ];
  }

  function buildMiniHtml(route) {
    const miniStats = [
      ["Passing grade", formatDecimal(route.passingGrade, 1)],
      ["Attempts", formatCount(route.attempts)],
      ["Completions", formatCount(route.completions)],
      ["Passing yards", formatCount(route.yards)],
      ["Touchdowns", formatCount(route.touchdowns)],
      ["Passer rating", formatDecimal(route.passerRating, 1)],
    ];
    const rows = miniStats
      .map(
        ([label, value]) =>
          `<div class="qb-route-tree-mini-row"><span>${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`
      )
      .join("");
    return `<span class="qb-route-tree-mini-pill">${escapeHtml(route.label || route.routeName)}</span><div class="qb-route-tree-mini-grid">${rows}</div>`;
  }

  function buildPanelHtml(route) {
    const pills = [
      route.label || route.routeName,
      `Attempts: ${formatCount(route.attempts)}`,
      `Completions: ${formatCount(route.completions)}`,
      `Yards: ${formatCount(route.yards)}`,
    ];
    const pillHtml = pills
      .map((pill) => `<span class="qb-route-tree-detail-pill">${escapeHtml(pill)}</span>`)
      .join("");
    const rows = detailRows(route)
      .map(
        ([label, value]) =>
          `<div class="qb-route-tree-detail-row"><span>${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`
      )
      .join("");
    return `<div class="qb-route-tree-detail-header">${pillHtml}</div><div class="qb-route-tree-detail-grid">${rows}</div>`;
  }

  function buildSelectOptions(model) {
    const routes = model.routeList || [];
    return routes
      .map(
        (route) =>
          `<button type="button" class="qb-route-tree-option" data-route-key="${escapeAttr(route.key)}">${escapeHtml(route.label || route.routeName)} · ${escapeHtml(formatDecimal(route.passingGrade, 1))}</button>`
      )
      .join("");
  }

  function clearSelection(widget) {
    widget.dataset.selectedRoute = "";
    widget.querySelector(".qb-route-tree-field")?.classList.remove("has-selection");
    widget.querySelector(".qb-route-tree-mini-wrap")?.setAttribute("hidden", "");
    widget.querySelector(".qb-route-tree-panel-wrap")?.setAttribute("hidden", "");
    widget.querySelectorAll(".qb-route-tree-line, .qb-route-tree-arrow, .qb-route-tree-group-node, .qb-route-tree-label-pill").forEach(
      (el) => el.classList.remove("is-active")
    );
    widget.querySelectorAll(".qb-route-tree-option").forEach((btn) => btn.classList.remove("is-active"));
    const trigger = widget.querySelector(".qb-route-tree-select-trigger");
    if (trigger) trigger.textContent = "Select a route…";
  }

  function selectRoute(widget, key, options = {}) {
    const model = readModel(widget);
    const route = model?.routes?.[key];
    if (!route) return;
    const usePanel = options.panel === true;

    widget.dataset.selectedRoute = key;
    widget.querySelector(".qb-route-tree-field")?.classList.add("has-selection");

    widget.querySelectorAll(".qb-route-tree-line, .qb-route-tree-arrow, .qb-route-tree-group-node, .qb-route-tree-label-pill").forEach(
      (el) => {
        el.classList.toggle("is-active", el.dataset.routeKey === key);
      }
    );

    const miniBody = widget.querySelector(".qb-route-tree-mini-body");
    if (miniBody) miniBody.innerHTML = buildMiniHtml(route);

    const panelBody = widget.querySelector(".qb-route-tree-panel-body");
    if (panelBody) panelBody.innerHTML = buildPanelHtml(route);

    if (usePanel) {
      widget.querySelector(".qb-route-tree-panel-wrap")?.removeAttribute("hidden");
      widget.querySelector(".qb-route-tree-mini-wrap")?.setAttribute("hidden", "");
    } else {
      widget.querySelector(".qb-route-tree-mini-wrap")?.removeAttribute("hidden");
      widget.querySelector(".qb-route-tree-panel-wrap")?.setAttribute("hidden", "");
    }

    widget.querySelectorAll(".qb-route-tree-option").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.routeKey === key);
    });

    const trigger = widget.querySelector(".qb-route-tree-select-trigger");
    if (trigger) {
      trigger.textContent = `${route.label || route.routeName} · ${formatDecimal(route.passingGrade, 1)}`;
    }
  }

  function wireWidget(widget) {
    if (!widget || widget.dataset.routeTreeWired === "true") return;
    widget.dataset.routeTreeWired = "true";

    widget.addEventListener("click", (event) => {
      const pill = event.target.closest(".qb-route-tree-label-pill");
      if (pill?.dataset.routeKey) {
        selectRoute(widget, pill.dataset.routeKey, { panel: false });
        return;
      }

      const option = event.target.closest(".qb-route-tree-option");
      if (option?.dataset.routeKey) {
        selectRoute(widget, option.dataset.routeKey, { panel: true });
        widget.querySelector(".qb-route-tree-select-wrap")?.classList.remove("is-open");
        return;
      }

      if (event.target.closest(".qb-route-tree-mini-close") || event.target.closest(".qb-route-tree-panel-close")) {
        clearSelection(widget);
        return;
      }

      if (event.target.closest(".qb-route-tree-select-trigger")) {
        widget.querySelector(".qb-route-tree-select-wrap")?.classList.toggle("is-open");
      }
    });

    document.addEventListener("click", (event) => {
      const selectWrap = widget.querySelector(".qb-route-tree-select-wrap");
      if (selectWrap && !selectWrap.contains(event.target)) {
        selectWrap.classList.remove("is-open");
      }
    });
  }

  function renderWidget(widget) {
    const model = readModel(widget);
    if (!model) return;

    wireWidget(widget);

    const field = widget.querySelector(".qb-route-tree-field");
    if (field) {
      field.innerHTML = `${buildRouteSvg(model)}<div class="qb-route-tree-labels">${buildLabelPills(model)}</div><div class="qb-route-tree-mini-wrap" hidden><div class="qb-route-tree-mini"><button type="button" class="qb-route-tree-mini-close" aria-label="Close">&times;</button><div class="qb-route-tree-mini-body"></div></div></div>`;
    }

    const options = widget.querySelector(".qb-route-tree-options");
    if (options) options.innerHTML = buildSelectOptions(model);

    const selected = widget.dataset.selectedRoute;
    if (selected && model.routes?.[selected]) {
      selectRoute(widget, selected);
    } else {
      clearSelection(widget);
    }
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-route-tree").forEach(renderWidget);
  }

  global.QbAnnualRouteTree = { init, renderWidget, selectRoute, clearSelection };
})(window);
