/**
 * Collapsible profile sections — smooth expand/collapse (preview only).
 */
(function (global) {
  const DURATION_MS = 420;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function panelInner(details) {
    return details.querySelector(".qb-collapsible-panel-inner");
  }

  function panelEl(details) {
    return details.querySelector(".qb-collapsible-panel");
  }

  function onSectionOpened(details, host) {
    details.classList.add("is-opening");
    window.setTimeout(() => details.classList.remove("is-opening"), DURATION_MS + 40);

    const inner = panelInner(details);
    if (inner) {
      global.QbAnnualAnimations?.revealSection?.(inner);
    }

    const profile = host || details.closest(".qb-profile");
    if (profile) {
      if (details.querySelector(".qb-scatter-carousel")) {
        global.QbAnnualGradingProfile?.init(profile);
      }
      if (details.querySelector(".qb-compare-carousel")) {
        global.QbAnnualPassingSplits?.init(profile);
      }
      if (details.querySelector(".qb-int-luck")) {
        global.QbAnnualInterceptionLuck?.init(profile);
      }
      if (details.querySelector(".qb-depth")) {
        global.QbAnnualTargetDepth?.init(profile);
      }
      if (details.querySelector(".qb-accuracy-depth")) {
        global.QbAnnualAccuracyDepth?.init(profile);
      }
      if (details.querySelector(".qb-target-map")) {
        global.QbAnnualTargetMap?.init(profile);
      }
      if (details.querySelector(".qb-route-tree")) {
        global.QbAnnualRouteTree?.init(profile);
      }
    }
  }

  function openDetails(details, host) {
    if (details.open || details.dataset.animating === "true") return;

    const panel = panelEl(details);
    const inner = panelInner(details);
    if (!panel || !inner) {
      details.open = true;
      onSectionOpened(details, host);
      return;
    }

    if (prefersReducedMotion()) {
      details.open = true;
      onSectionOpened(details, host);
      return;
    }

    details.dataset.animating = "true";
    details.open = true;
    panel.style.overflow = "hidden";
    panel.style.height = "0px";

    requestAnimationFrame(() => {
      panel.style.transition = `height ${DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      panel.style.height = `${inner.offsetHeight}px`;
    });

    const finish = (event) => {
      if (event.propertyName !== "height") return;
      panel.removeEventListener("transitionend", finish);
      if (!details.open) return;
      panel.style.height = "";
      panel.style.overflow = "";
      panel.style.transition = "";
      details.dataset.animating = "false";
      onSectionOpened(details, host);
    };

    panel.addEventListener("transitionend", finish);
  }

  function closeDetails(details) {
    if (!details.open || details.dataset.animating === "true") return;

    const panel = panelEl(details);
    const inner = panelInner(details);
    if (!panel || !inner) {
      details.open = false;
      return;
    }

    if (prefersReducedMotion()) {
      details.open = false;
      return;
    }

    details.dataset.animating = "true";
    panel.style.overflow = "hidden";
    panel.style.height = `${inner.offsetHeight}px`;

    requestAnimationFrame(() => {
      panel.style.transition = `height ${DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      panel.style.height = "0px";
    });

    const finish = (event) => {
      if (event.propertyName !== "height") return;
      panel.removeEventListener("transitionend", finish);
      details.open = false;
      panel.style.height = "";
      panel.style.overflow = "";
      panel.style.transition = "";
      details.dataset.animating = "false";
    };

    panel.addEventListener("transitionend", finish);
  }

  function wireDetails(details, host) {
    const summary = details.querySelector(".qb-collapsible-trigger");
    if (!summary) return;

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (details.open) closeDetails(details);
      else openDetails(details, host);
    });

    if (!details.open) {
      const panel = panelEl(details);
      if (panel && !prefersReducedMotion()) {
        panel.style.height = "0px";
        panel.style.overflow = "hidden";
      }
    }
  }

  function init(host) {
    if (!host) return;
    host.querySelectorAll(".qb-collapsible-details").forEach((details) => {
      wireDetails(details, host);
    });
  }

  function destroy() {
    /* listeners are replaced on each render via innerHTML reset */
  }

  global.QbAnnualSections = { init, destroy };
})(window);
