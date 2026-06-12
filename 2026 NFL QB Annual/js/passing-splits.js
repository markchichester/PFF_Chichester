/**
 * Passing splits carousel — horizontal swipe (preview only).
 */
(function (global) {
  function scrollToSplit(track, splitId) {
    const slide = track.querySelector(`.qb-compare-slide[data-split-id="${splitId}"]`);
    if (!slide) return;
    slide.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function syncTabsFromScroll(carousel) {
    const track = carousel.querySelector(".qb-compare-track");
    const tabs = [...carousel.querySelectorAll(".qb-compare-tab")];
    const slides = [...carousel.querySelectorAll(".qb-compare-slide")];
    if (!track || !slides.length) return;

    const index = Math.round(track.scrollLeft / track.clientWidth);
    const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
    if (!slide) return;

    const splitId = slide.dataset.splitId;
    tabs.forEach((tab) => {
      tab.setAttribute("aria-pressed", tab.dataset.splitTarget === splitId ? "true" : "false");
    });
  }

  function wireCarousel(carousel) {
    const track = carousel.querySelector(".qb-compare-track");
    if (!track) return;

    carousel.querySelectorAll(".qb-compare-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        scrollToSplit(track, tab.dataset.splitTarget);
        carousel.querySelectorAll(".qb-compare-tab").forEach((btn) => {
          btn.setAttribute(
            "aria-pressed",
            btn.dataset.splitTarget === tab.dataset.splitTarget ? "true" : "false"
          );
        });
      });
    });

    let scrollTimer = null;
    track.addEventListener("scroll", () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => syncTabsFromScroll(carousel), 80);
    });

    const defaultSplit = carousel.dataset.defaultSplit || "pressure";
    scrollToSplit(track, defaultSplit);
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-compare-carousel").forEach(wireCarousel);
  }

  function destroy() {
    /* listeners are replaced on each render via innerHTML reset */
  }

  global.QbAnnualPassingSplits = { init, destroy };
})(window);
