/**
 * Scroll-triggered profile animations (preview only).
 */
(function (global) {
  let observer = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateDonut(circle) {
    const dash = parseFloat(circle.dataset.dash);
    const gap = parseFloat(circle.dataset.gap);
    const circ = dash + gap;
    if (!Number.isFinite(dash) || !Number.isFinite(gap)) return;

    if (prefersReducedMotion()) {
      circle.setAttribute("stroke-dasharray", `${dash} ${gap}`);
      return;
    }

    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const t = easeOutCubic(Math.min(1, (now - start) / duration));
      const currentDash = dash * t;
      circle.setAttribute("stroke-dasharray", `${currentDash} ${circ - currentDash}`);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function animateMetricFill(fill) {
    const target = parseFloat(fill.dataset.targetWidth);
    if (!Number.isFinite(target)) return;

    if (prefersReducedMotion()) {
      fill.style.setProperty("--metric-width", `${target}%`);
      return;
    }

    const duration = 720;
    const start = performance.now();
    const tick = (now) => {
      const t = easeOutCubic(Math.min(1, (now - start) / duration));
      fill.style.setProperty("--metric-width", `${target * t}%`);
      if (t < 1) requestAnimationFrame(tick);
      else fill.style.setProperty("--metric-width", `${target}%`);
    };
    requestAnimationFrame(tick);
  }

  function animateBarGroup(group) {
    const rect = group.querySelector(".qb-game-bar-fill") || group.querySelector("rect");
    if (!rect) return;

    const targetY = parseFloat(group.dataset.y);
    const targetH = parseFloat(group.dataset.h);
    const bottom = parseFloat(group.dataset.base);
    const valueLabel = group.querySelector(".qb-bar-value");
    const delay = parseInt(group.dataset.delay || "0", 10);

    if (!Number.isFinite(targetY) || !Number.isFinite(targetH)) return;

    if (prefersReducedMotion()) {
      rect.setAttribute("y", String(targetY));
      rect.setAttribute("height", String(targetH));
      if (valueLabel) valueLabel.setAttribute("opacity", "1");
      return;
    }

    window.setTimeout(() => {
      const duration = 680;
      const start = performance.now();
      const tick = (now) => {
        const t = easeOutCubic(Math.min(1, (now - start) / duration));
        const h = targetH * t;
        const y = bottom - h;
        rect.setAttribute("y", String(y));
        rect.setAttribute("height", String(h));
        if (valueLabel) {
          valueLabel.setAttribute("opacity", String(Math.max(0, (t - 0.55) / 0.45)));
        }
        if (t < 1) requestAnimationFrame(tick);
        else {
          rect.setAttribute("y", String(targetY));
          rect.setAttribute("height", String(targetH));
          if (valueLabel) valueLabel.setAttribute("opacity", "1");
        }
      };
      requestAnimationFrame(tick);
    }, delay);
  }

  function formatCountValue(value, decimals, suffix, format) {
    if (format === "comma") return Math.round(value).toLocaleString("en-US");
    return `${value.toFixed(decimals)}${suffix || ""}`;
  }

  function countUpStat(el) {
    const target = parseFloat(el.dataset.countTarget);
    if (!Number.isFinite(target)) return;

    const decimals = parseInt(el.dataset.countDecimals || "0", 10);
    const suffix = el.dataset.countSuffix || "";
    const format = el.dataset.countFormat || "";
    const duration = 900;
    const start = performance.now();

    if (prefersReducedMotion()) {
      el.textContent = formatCountValue(target, decimals, suffix, format);
      return;
    }

    const tick = (now) => {
      const t = easeOutCubic(Math.min(1, (now - start) / duration));
      const value = target * t;
      el.textContent = formatCountValue(value, decimals, suffix, format);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatCountValue(target, decimals, suffix, format);
    };
    requestAnimationFrame(tick);
  }

  function reveal(el) {
    if (el.classList.contains("is-visible")) return;
    el.classList.add("is-visible");

    if (el.classList.contains("qb-donut-progress")) animateDonut(el);
    if (el.classList.contains("qb-chart-bar")) animateBarGroup(el);
    if (el.classList.contains("qb-metric-row")) {
      const fill = el.querySelector(".qb-metric-fill");
      if (fill) animateMetricFill(fill);
    }
    if (el.classList.contains("qb-stat-value") && el.dataset.countTarget) countUpStat(el);

    if (el.classList.contains("qb-donut")) {
      el.querySelectorAll(".qb-donut-progress, .qb-donut-inner").forEach((child) => {
        if (!child.classList.contains("is-visible")) reveal(child);
      });
    }
    if (el.classList.contains("qb-chart-wrap")) {
      el.querySelectorAll(".qb-chart-bar").forEach((bar) => {
        if (!bar.classList.contains("is-visible")) reveal(bar);
      });
    }
  }

  function isInScrollRoot(el, root) {
    const rect = el.getBoundingClientRect();
    if (!root) {
      return rect.top < window.innerHeight - 8 && rect.bottom > 8;
    }
    const rootRect = root.getBoundingClientRect();
    return rect.top < rootRect.bottom - 8 && rect.bottom > rootRect.top + 8;
  }

  function revealSection(root, staggerMs = 45) {
    if (!root) return;
    const targets = root.querySelectorAll(
      ".qb-animate-item:not(.is-visible), .qb-donut:not(.is-visible), .qb-chart-wrap:not(.is-visible), .qb-stat-value[data-count-target]:not(.is-visible)"
    );
    targets.forEach((el, index) => {
      window.setTimeout(() => reveal(el), index * staggerMs);
    });
  }

  function init(scrollRoot, profileRoot) {
    destroy();
    if (!profileRoot) return;

    const targets = profileRoot.querySelectorAll(
      ".qb-animate-item, .qb-donut, .qb-chart-wrap, .qb-stat-value[data-count-target]"
    );

    if (prefersReducedMotion()) {
      targets.forEach((el) => reveal(el));
      profileRoot.classList.add("is-animating");
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        root: scrollRoot || null,
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    profileRoot.classList.add("is-animating");
    targets.forEach((el) => {
      if (isInScrollRoot(el, scrollRoot)) {
        reveal(el);
      } else {
        observer.observe(el);
      }
    });
  }

  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  global.QbAnnualAnimations = { init, destroy, reveal, revealSection };
})(window);
