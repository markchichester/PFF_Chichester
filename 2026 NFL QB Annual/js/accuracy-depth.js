/**
 * Accuracy by depth field — zone click detail panel (preview only).
 */
(function (global) {
  const { escapeHtml } = global.QbAnnualUtils || { escapeHtml: (s) => String(s) };

  function readModel(widget) {
    const node = widget.querySelector(".qb-accuracy-depth-data");
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || "");
    } catch {
      return null;
    }
  }

  function formatPct(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return `${(value * 100).toFixed(1)}%`;
  }

  function formatDeltaPp(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)} pp`;
  }

  function formatCount(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return Math.round(value).toLocaleString("en-US");
  }

  function buildDetailHtml(cell) {
    if (!cell?.hasData) {
      return '<div class="qb-depth-detail-placeholder">No accuracy data for this zone.</div>';
    }

    const rows = [
      ["Aimed passes", formatCount(cell.attempts)],
      ["Accuracy", formatPct(cell.accuracy)],
      ["League average", formatPct(cell.leagueAccuracy)],
      ["Vs league", formatDeltaPp(cell.deltaPp)],
    ];

    return `<div class="qb-depth-detail-header"><span class="qb-depth-detail-pill">${escapeHtml(cell.label || "Zone")}</span></div><div class="qb-depth-detail-grid">${rows
      .map(
        ([label, value]) =>
          `<div class="qb-depth-detail-row"><span>${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`
      )
      .join("")}</div>`;
  }

  function closeDetail(widget) {
    const detail = widget.querySelector(".qb-accuracy-depth-detail");
    const body = widget.querySelector(".qb-accuracy-depth-detail-body");
    if (!detail || !body) return;
    detail.hidden = true;
    body.innerHTML =
      '<div class="qb-depth-detail-placeholder">Click a zone to compare accuracy with league average</div>';
    widget.querySelectorAll(".qb-accuracy-depth-cell.is-active").forEach((cell) => {
      cell.classList.remove("is-active");
    });
  }

  function openDetail(widget, cellEl) {
    const model = readModel(widget);
    const detail = widget.querySelector(".qb-accuracy-depth-detail");
    const body = widget.querySelector(".qb-accuracy-depth-detail-body");
    if (!detail || !body || !model) return;

    const colKey = cellEl.getAttribute("data-accuracy-col");
    const rowKey = cellEl.getAttribute("data-accuracy-row");
    const zone = model.byKey?.[`${colKey}|${rowKey}`];

    widget.querySelectorAll(".qb-accuracy-depth-cell.is-active").forEach((el) => {
      el.classList.remove("is-active");
    });
    cellEl.classList.add("is-active");
    body.innerHTML = buildDetailHtml(zone);
    detail.hidden = false;
  }

  function initWidget(widget) {
    if (!widget || widget.dataset.accuracyDepthWired === "true") return;
    widget.dataset.accuracyDepthWired = "true";

    widget.querySelectorAll(".qb-accuracy-depth-cell").forEach((cell) => {
      cell.addEventListener("click", () => openDetail(widget, cell));
    });

    widget.querySelector(".qb-accuracy-depth-detail-close")?.addEventListener("click", () => {
      closeDetail(widget);
    });
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-accuracy-depth").forEach(initWidget);
  }

  global.QbAnnualAccuracyDepth = { init };
})(window);
