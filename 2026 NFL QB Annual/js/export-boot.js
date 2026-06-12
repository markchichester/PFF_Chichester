/**
 * Bootstrap interactive behavior for exported / embedded QB profiles.
 */
(function (global) {
  function initOpenSections(profileEl) {
    profileEl.querySelectorAll(".qb-collapsible-details[open]").forEach((details) => {
      const inner = details.querySelector(".qb-collapsible-panel-inner");
      if (inner) global.QbAnnualAnimations?.revealSection?.(inner);

      if (details.querySelector(".qb-scatter-carousel")) {
        global.QbAnnualGradingProfile?.init(profileEl);
      }
      if (details.querySelector(".qb-compare-carousel")) {
        global.QbAnnualPassingSplits?.init(profileEl);
      }
      if (details.querySelector(".qb-int-luck")) {
        global.QbAnnualInterceptionLuck?.init(profileEl);
      }
      if (details.querySelector(".qb-depth")) {
        global.QbAnnualTargetDepth?.init(profileEl);
      }
      if (details.querySelector(".qb-accuracy-depth")) {
        global.QbAnnualAccuracyDepth?.init(profileEl);
      }
      if (details.querySelector(".qb-target-map")) {
        global.QbAnnualTargetMap?.init(profileEl);
      }
      if (details.querySelector(".qb-route-tree")) {
        global.QbAnnualRouteTree?.init(profileEl);
      }
    });
  }

  function init(container, profile) {
    const profileEl = container?.querySelector?.(".qb-profile") || container;
    if (!profileEl || !profile) return;

    global.QbAnnualAnimations?.init(null, profileEl);
    global.QbAnnualModals?.init(profileEl, profile);
    global.QbAnnualSections?.init(profileEl);
    global.QbAnnualInterceptionLuck?.init(profileEl);
    initOpenSections(profileEl);
  }

  global.QbAnnualExport = { init };
})(window);
