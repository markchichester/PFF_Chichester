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
  const STEM_NODES_FALLBACK = [498, 430, 288, 195, 85];
  const SVG_SCALE_Y = 0.84;
  const SVG_TRANSLATE_Y = 26;
  const SVG_VIEW_MIN_Y = -44;
  const SVG_VIEW_H = 560;
  const LABEL_FO_W = 80;
  const LABEL_FO_H = 50;
  const LABEL_TIP_GAP = 2;

  function routeArrowGeometry(def) {
    const startY = def.key === "go" ? 502 : def.branchY;
    const ex = STEM_X + (def.endX - STEM_X) * SCALE_X;
    const ey = def.endY;
    const dx = ex - STEM_X;
    const dy = ey - startY;
    const ln = Math.hypot(dx, dy) || 1;
    return { startY, ex, ey, ux: dx / ln, uy: dy / ln };
  }

  function labelForeignObjectRect(def) {
    const { ex, ey, ux, uy } = routeArrowGeometry(def);
    const anchorX = ex + ux * LABEL_TIP_GAP;
    const anchorY = ey + uy * LABEL_TIP_GAP;
    let x = anchorX - LABEL_FO_W / 2;
    let y = anchorY - LABEL_FO_H / 2;

    if (Math.abs(ux) >= Math.abs(uy)) {
      x = ux >= 0 ? anchorX : anchorX - LABEL_FO_W;
      y = anchorY - LABEL_FO_H / 2;
    } else {
      x = anchorX - LABEL_FO_W / 2;
      y = uy >= 0 ? anchorY : anchorY - LABEL_FO_H;
    }

    return { x, y };
  }

  function buildLabelForeignObject(def, routes, maxAttempts) {
    const route = routes[def.key];
    const hasData = !!route?.attempts;
    const { x, y } = labelForeignObjectRect(def);
    const vol = hasData
      ? Math.max(0.15, Math.min(1, (route.attempts || 0) / maxAttempts))
      : 0.06;
    const gc = hasData ? gradeColorFor(route.passingGrade) : "#6B7280";
    const gradeHtml = hasData
      ? `<span class="qb-route-tree-label-grade">${escapeHtml(formatDecimal(route.passingGrade, 1))}</span>`
      : `<span class="qb-route-tree-label-grade is-empty">—</span>`;

    return `<foreignObject class="qb-route-tree-fo" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${LABEL_FO_W}" height="${LABEL_FO_H}">
<div xmlns="http://www.w3.org/1999/xhtml" class="qb-route-tree-fo-wrap">
<button type="button" class="qb-route-tree-label-pill${hasData ? " has-data" : ""}" data-route-key="${escapeAttr(def.key)}" style="--grade:${gc};--vol:${vol.toFixed(3)};" aria-label="${escapeAttr(`${def.label}${hasData ? `: grade ${formatDecimal(route.passingGrade, 1)}` : ""}`)}"${hasData ? "" : " disabled"}>
${gradeHtml}
<span class="qb-route-tree-label-name">${escapeHtml(def.label)}</span>
</button>
</div>
</foreignObject>`;
  }

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

  function gradeColorFor(value) {
    const g = parseFloat(value);
    if (Number.isNaN(g)) return "#6B7280";
    if (g >= 90) return "#1b7a2b";
    if (g >= 80) return "#2e9e3e";
    if (g >= 70) return "#6abf4b";
    if (g >= 60) return "#c8c828";
    if (g >= 50) return "#e8a020";
    return "#d04040";
  }

  function stemNodesFromDefs(defs) {
    const ys = new Set(
      defs
        .filter((d) => d.key !== "go")
        .map((d) => d.branchY)
        .filter((y) => Number.isFinite(y))
    );
    if (!ys.size) return STEM_NODES_FALLBACK;
    return [...ys].sort((a, b) => b - a);
  }

  function routeTreeDefs(model) {
    return Api().ROUTE_TREE_DEFS;
  }

  function buildRouteSvg(model) {
    const defs = routeTreeDefs(model);
    const routes = model.routes || {};
    const maxAttempts = Math.max(...Object.values(routes).map((r) => r.attempts || 0), 1);
    const stemTop = 14;
    const branchStroke = 2.8;
    const stemNodes = stemNodesFromDefs(defs);
    const parts = [
      `<svg class="qb-route-tree-svg" viewBox="0 ${SVG_VIEW_MIN_Y} 480 ${SVG_VIEW_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Route tree">`,
    ];

    parts.push(`<g transform="translate(0, ${SVG_TRANSLATE_Y}) scale(1, ${SVG_SCALE_Y}) translate(0, -5)">`);
    parts.push(`<line x1="${STEM_X}" y1="502" x2="${STEM_X}" y2="${stemTop}" class="qb-route-tree-stem"/>`);
    stemNodes.forEach((y) => {
      parts.push(`<circle cx="${STEM_X}" cy="${y}" r="5" class="qb-route-tree-node"/>`);
    });

    function addRoute(def) {
      const route = routes[def.key];
      const hasData = !!route?.attempts;
      const { startY, ex, ey } = routeArrowGeometry(def);
      const [bx, by] = arrowBase(STEM_X, startY, ex, ey);
      const keyAttr = ` data-route-key="${escapeAttr(def.key)}"`;

      parts.push(
        `<g class="qb-route-tree-group${hasData ? " has-data" : ""}" data-route-key="${escapeAttr(def.key)}"${hasData ? ' role="button" tabindex="0"' : ""}>`
      );
      parts.push(
        `<line class="qb-route-tree-line"${hasData ? keyAttr : ""} x1="${STEM_X}" y1="${startY}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke-width="${branchStroke}"/>`
      );
      const ah = arrowHead(STEM_X, startY, ex, ey);
      if (ah) {
        parts.push(
          `<polygon class="qb-route-tree-arrow"${hasData ? keyAttr : ""} points="${ah}"/>`
        );
      }
      if (hasData) {
        parts.push(
          `<circle class="qb-route-tree-hit qb-route-tree-hit-node"${keyAttr} cx="${STEM_X}" cy="${startY}" r="12"/>`
        );
        parts.push(
          `<line class="qb-route-tree-hit"${keyAttr} x1="${STEM_X}" y1="${startY}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke-width="18"/>`
        );
        parts.push(
          `<circle class="qb-route-tree-hit qb-route-tree-hit-tip"${keyAttr} cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="14"/>`
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
    parts.push('<g class="qb-route-tree-labels">');
    defs.forEach((def) => {
      parts.push(buildLabelForeignObject(def, routes, maxAttempts));
    });
    parts.push("</g>");
    parts.push("</g></svg>");
    return parts.join("");
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

  function setSelectLabel(widget, text) {
    const label = widget.querySelector(".qb-route-tree-select-label");
    if (label) label.textContent = text;
  }

  function setSelectOpen(widget, open) {
    const wrap = widget.querySelector(".qb-route-tree-select-wrap");
    const trigger = widget.querySelector(".qb-route-tree-select-trigger");
    if (!wrap || !trigger) return;
    wrap.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function buildSelectOptions(model) {
    const defs = Api().ROUTE_TREE_DEFS;
    const routes = model.routes || {};
    return defs
      .filter((def) => routes[def.key]?.attempts)
      .map((def) => {
        const route = routes[def.key];
        const name = route.label || route.routeName || def.label;
        return `<button type="button" class="qb-route-tree-option" data-route-key="${escapeAttr(def.key)}" role="option" aria-selected="false">${escapeHtml(name)}</button>`;
      })
      .join("");
  }

  function routeKeyFromTarget(target) {
    const pill = target.closest(".qb-route-tree-label-pill");
    if (pill?.dataset.routeKey) {
      return pill.disabled ? null : pill.dataset.routeKey;
    }
    const group = target.closest(".qb-route-tree-group.has-data");
    return group?.dataset.routeKey || null;
  }

  function clearSelection(widget) {
    widget.dataset.selectedRoute = "";
    widget.querySelector(".qb-route-tree-field")?.classList.remove("has-selection");
    widget.querySelector(".qb-route-tree-mini-wrap")?.setAttribute("hidden", "");
    widget.querySelector(".qb-route-tree-panel-wrap")?.setAttribute("hidden", "");
    widget.querySelectorAll(".qb-route-tree-group, .qb-route-tree-label-pill").forEach(
      (el) => el.classList.remove("is-active")
    );
    widget.querySelectorAll(".qb-route-tree-option").forEach((btn) => btn.classList.remove("is-active"));
    widget.querySelectorAll(".qb-route-tree-option").forEach((btn) => btn.setAttribute("aria-selected", "false"));
    setSelectLabel(widget, "Select a route…");
  }

  function selectRoute(widget, key, options = {}) {
    const model = readModel(widget);
    const route = model?.routes?.[key];
    if (!route) return;
    const usePanel = options.panel === true;

    widget.dataset.selectedRoute = key;
    widget.querySelector(".qb-route-tree-field")?.classList.add("has-selection");

    widget.querySelectorAll(".qb-route-tree-group, .qb-route-tree-label-pill").forEach(
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
      const active = btn.dataset.routeKey === key;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    setSelectLabel(widget, route.label || route.routeName || "Route");
  }

  function wireWidget(widget) {
    if (!widget || widget.dataset.routeTreeWired === "true") return;
    widget.dataset.routeTreeWired = "true";

    widget.addEventListener("click", (event) => {
      const routeKey = routeKeyFromTarget(event.target);
      if (routeKey) {
        selectRoute(widget, routeKey, { panel: false });
        return;
      }

      const option = event.target.closest(".qb-route-tree-option");
      if (option?.dataset.routeKey) {
        selectRoute(widget, option.dataset.routeKey, { panel: true });
        setSelectOpen(widget, false);
        return;
      }

      if (event.target.closest(".qb-route-tree-mini-close") || event.target.closest(".qb-route-tree-panel-close")) {
        clearSelection(widget);
        return;
      }

      if (event.target.closest(".qb-route-tree-select-trigger")) {
        const wrap = widget.querySelector(".qb-route-tree-select-wrap");
        setSelectOpen(widget, !wrap?.classList.contains("is-open"));
      }
    });

    widget.addEventListener("keydown", (event) => {
      const group = event.target.closest(".qb-route-tree-group.has-data");
      if (!group?.dataset.routeKey) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRoute(widget, group.dataset.routeKey, { panel: false });
      }
    });

    document.addEventListener("click", (event) => {
      const selectWrap = widget.querySelector(".qb-route-tree-select-wrap");
      if (selectWrap && !selectWrap.contains(event.target)) {
        setSelectOpen(widget, false);
      }
    });
  }

  function renderWidget(widget) {
    const model = readModel(widget);
    if (!model) return;

    wireWidget(widget);

    const field = widget.querySelector(".qb-route-tree-field");
    if (field) {
      field.innerHTML = `${buildRouteSvg(model)}<div class="qb-route-tree-mini-wrap" hidden><div class="qb-route-tree-mini"><button type="button" class="qb-route-tree-mini-close" aria-label="Close">&times;</button><div class="qb-route-tree-mini-body"></div></div></div>`;
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
