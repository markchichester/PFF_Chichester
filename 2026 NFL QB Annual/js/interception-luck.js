/**
 * Interception luck reveal animation (preview only).
 */
(function (global) {
  function reveal(host) {
    if (!host) return;
    host.querySelectorAll(".qb-int-luck:not(.is-visible)").forEach((el) => {
      el.classList.add("is-visible");
    });
  }

  function init(host) {
    reveal(host);
  }

  global.QbAnnualInterceptionLuck = { init, reveal };
})(window);
