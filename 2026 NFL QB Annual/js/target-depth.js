/**
 * Target depth field — zone click detail panel (preview only).
 */
(function (global) {
  const { escapeHtml } = global.QbAnnualUtils || { escapeHtml: (s) => String(s) };

  function readDepthModel(widget) {
    const node = widget.querySelector(".qb-depth-data");
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || "");
    } catch {
      return null;
    }
  }

  function formatCount(value) {
    if (value == null || !Number.isFinite(value)) return "—";
    return Math.round(value).toLocaleString("en-US");
  }

  function buildDetailHtml(cell) {
    if (!cell) {
      return '<div class="qb-depth-detail-placeholder">No stats available for this zone.</div>';
    }

    const pills = [
      cell.label,
      `Attempts: ${formatCount(cell.attempts)}`,
      `Completions: ${formatCount(cell.completions)}`,
      `Yards: ${formatCount(cell.yards)}`,
    ];

    const rows = (cell.detail || [])
      .map(
        ({ label, value }) =>
          `<div class="qb-depth-detail-row"><span>${escapeHtml(label)}</span><span class="value">${escapeHtml(String(value))}</span></div>`
      )
      .join("");

    if (!rows) {
      return '<div class="qb-depth-detail-placeholder">No stats available for this zone.</div>';
    }

    return `<div class="qb-depth-detail-header">${pills
      .map((pill) => `<span class="qb-depth-detail-pill">${escapeHtml(pill)}</span>`)
      .join("")}</div><div class="qb-depth-detail-grid">${rows}</div>`;
  }

  function closeDetail(widget) {
    const detail = widget.querySelector(".qb-depth-detail");
    const body = widget.querySelector(".qb-depth-detail-body");
    if (!detail || !body) return;
    detail.hidden = true;
    body.innerHTML =
      '<div class="qb-depth-detail-placeholder">Click a zone on the field to see detailed stats</div>';
    widget.querySelectorAll(".qb-depth-cell.is-active").forEach((cell) => {
      cell.classList.remove("is-active");
    });
  }

  function openDetail(widget, cell) {
    const model = readDepthModel(widget);
    const detail = widget.querySelector(".qb-depth-detail");
    const body = widget.querySelector(".qb-depth-detail-body");
    if (!detail || !body || !model) return;

    const colKey = cell.getAttribute("data-depth-col");
    const rowKey = cell.getAttribute("data-depth-row");
    const zone = model.byKey?.[`${colKey}|${rowKey}`];

    widget.querySelectorAll(".qb-depth-cell.is-active").forEach((el) => {
      el.classList.remove("is-active");
    });
    cell.classList.add("is-active");
    body.innerHTML = buildDetailHtml(zone);
    detail.hidden = false;
  }

  function initWidget(widget) {
    if (!widget || widget.dataset.depthWired === "true") return;
    widget.dataset.depthWired = "true";

    widget.querySelectorAll(".qb-depth-cell").forEach((cell) => {
      cell.addEventListener("click", () => openDetail(widget, cell));
    });

    widget.querySelector(".qb-depth-detail-close")?.addEventListener("click", () => {
      closeDetail(widget);
    });
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-depth").forEach(initWidget);
  }

  global.QbAnnualTargetDepth = { init };
})(window);
