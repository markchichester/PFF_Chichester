/**
 * Grading profile scatter plots — carousel + hover panels (preview only).
 */
(function (global) {
  const { escapeHtml, escapeAttr } = global.QbAnnualUtils;

  function buildPanelHtml(point) {
    return `<div class="qb-scatter-panel qb-scatter-panel--hover">
  <img class="qb-scatter-panel-photo" src="${escapeAttr(point.headshot)}" alt="" width="56" height="56" loading="lazy" />
  <div class="qb-scatter-panel-body">
    <p class="qb-scatter-panel-name">${escapeHtml(point.name)}</p>
    <p class="qb-scatter-panel-team">${escapeHtml(point.team || "—")}</p>
    <dl class="qb-scatter-panel-stats">
      <div><dt>Pass grade</dt><dd>${escapeHtml(point.passGrade)}</dd></div>
      <div><dt>${escapeHtml(point.xLabel)}</dt><dd>${escapeHtml(point.xValue)}</dd></div>
      <div><dt>${escapeHtml(point.yLabel)}</dt><dd>${escapeHtml(point.yValue)}</dd></div>
    </dl>
  </div>
</div>`;
  }

  function pointFromElement(el) {
    return {
      headshot: el.dataset.headshot || "",
      name: el.dataset.playerName || "",
      team: el.dataset.teamName || "",
      passGrade: el.dataset.passGrade || "—",
      xLabel: el.dataset.xLabel || "",
      yLabel: el.dataset.yLabel || "",
      xValue: el.dataset.xValue || "—",
      yValue: el.dataset.yValue || "—",
    };
  }

  function panelPosition(cx, cy, stageRect, panelW = 232, panelH = 132) {
    let left = cx + 18;
    let top = cy - panelH - 12;
    if (left + panelW > stageRect.width - 8) left = cx - panelW - 18;
    if (left < 8) left = 8;
    if (top < 8) top = cy + 18;
    if (top + panelH > stageRect.height - 8) top = stageRect.height - panelH - 8;
    return { left, top };
  }

  function showHoverPanel(stage, pointEl) {
    const wrap = stage.querySelector(".qb-scatter-panel-wrap--hover");
    if (!wrap || !pointEl) return;

    const svg = stage.querySelector(".qb-scatter-chart");
    if (!svg) return;

    const stageRect = stage.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const cx = parseFloat(pointEl.getAttribute("cx"));
    const cy = parseFloat(pointEl.getAttribute("cy"));
    const viewBox = svg.viewBox.baseVal;
    const scaleX = svgRect.width / viewBox.width;
    const scaleY = svgRect.height / viewBox.height;
    const px = (cx - viewBox.x) * scaleX;
    const py = (cy - viewBox.y) * scaleY;
    const pos = panelPosition(px, py, {
      width: stageRect.width,
      height: stageRect.height,
    });

    wrap.innerHTML = buildPanelHtml(pointFromElement(pointEl));
    wrap.style.left = `${pos.left}px`;
    wrap.style.top = `${pos.top}px`;
    wrap.hidden = false;
  }

  function hideHoverPanel(stage) {
    const wrap = stage.querySelector(".qb-scatter-panel-wrap--hover");
    if (!wrap) return;
    wrap.hidden = true;
    wrap.innerHTML = "";
  }

  function wireScatterStage(stage) {
    stage.querySelectorAll(".qb-scatter-point").forEach((pointEl) => {
      const activate = () => showHoverPanel(stage, pointEl);
      const deactivate = () => hideHoverPanel(stage);

      pointEl.addEventListener("mouseenter", activate);
      pointEl.addEventListener("focus", activate);
      pointEl.addEventListener("mouseleave", deactivate);
      pointEl.addEventListener("blur", deactivate);
    });

    stage.addEventListener("mouseleave", () => hideHoverPanel(stage));
  }

  function scrollToChart(track, chartId) {
    const slide = track.querySelector(`.qb-scatter-slide[data-chart-id="${chartId}"]`);
    if (!slide) return;
    slide.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function syncTabsFromScroll(carousel) {
    const track = carousel.querySelector(".qb-scatter-track");
    const tabs = [...carousel.querySelectorAll(".qb-scatter-tab")];
    const slides = [...carousel.querySelectorAll(".qb-scatter-slide")];
    if (!track || !slides.length) return;

    const index = Math.round(track.scrollLeft / track.clientWidth);
    const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
    if (!slide) return;

    const chartId = slide.dataset.chartId;
    tabs.forEach((tab) => {
      tab.setAttribute("aria-pressed", tab.dataset.chartTarget === chartId ? "true" : "false");
    });
  }

  function wireCarousel(carousel) {
    const track = carousel.querySelector(".qb-scatter-track");
    if (!track) return;

    carousel.querySelectorAll(".qb-scatter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        scrollToChart(track, tab.dataset.chartTarget);
        carousel.querySelectorAll(".qb-scatter-tab").forEach((btn) => {
          btn.setAttribute(
            "aria-pressed",
            btn.dataset.chartTarget === tab.dataset.chartTarget ? "true" : "false"
          );
        });
      });
    });

    let scrollTimer = null;
    track.addEventListener("scroll", () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => syncTabsFromScroll(carousel), 80);
    });

    carousel.querySelectorAll(".qb-scatter-stage").forEach(wireScatterStage);

    const defaultChart = carousel.dataset.defaultChart || "btt-twp";
    scrollToChart(track, defaultChart);
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-scatter-carousel").forEach(wireCarousel);
  }

  function destroy() {
    /* listeners are replaced on each render via innerHTML reset */
  }

  global.QbAnnualGradingProfile = { init, destroy };
})(window);
