/**
 * Shared accessibility helpers for the QB Annual reader.
 */
(function (global) {
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function normalizeHex(value, fallback) {
    const raw = String(value || fallback || "#000000").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      const h = raw.slice(1);
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }
    return fallback || "#000000";
  }

  function hexToRgb(hex) {
    const h = normalizeHex(hex).replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function mix(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  }

  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(hexA, hexB) {
    const a = luminance(hexA) + 0.05;
    const b = luminance(hexB) + 0.05;
    return a > b ? a / b : b / a;
  }

  /**
   * Build team theme tokens with WCAG-friendly hero foreground + scrim strength.
   */
  function buildTheme(primary) {
    const team = normalizeHex(primary, "#006bff");
    let accent = team;
    let guard = 0;
    while (luminance(accent) > 0.32 && guard < 24) {
      accent = mix(accent, "#000000", 0.12);
      guard++;
    }

    const teamDeep = mix(team, "#000000", luminance(team) > 0.5 ? 0.55 : 0.45);
    const heroBgSample = mix(teamDeep, team, 0.35);
    const whiteContrast = contrastRatio("#ffffff", heroBgSample);
    const blackContrast = contrastRatio("#101114", heroBgSample);
    const heroFg = whiteContrast >= blackContrast ? "#ffffff" : "#101114";
    const heroTone = heroFg === "#ffffff" ? "dark" : "light";

    let heroScrim = 0.34;
    if (heroTone === "dark") {
      if (luminance(team) > 0.38) heroScrim = 0.62;
      else if (luminance(team) > 0.24) heroScrim = 0.48;
      else if (whiteContrast < 4.5) heroScrim = 0.54;
    } else {
      heroScrim = blackContrast < 4.5 ? 0.82 : 0.72;
    }

    return {
      team,
      teamDeep,
      accent,
      accentInk: luminance(accent) > 0.45 ? "#101114" : "#ffffff",
      heroFg,
      heroScrim,
      heroTone,
    };
  }

  function applyTheme(primary, { root = document.documentElement, heroEl = null } = {}) {
    const theme = buildTheme(primary);
    root.style.setProperty("--team", theme.team);
    root.style.setProperty("--team-deep", theme.teamDeep);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-ink", theme.accentInk);
    root.style.setProperty("--hero-fg", theme.heroFg);
    root.style.setProperty("--hero-scrim", String(theme.heroScrim));
    if (heroEl) {
      heroEl.classList.toggle("is-light-hero", theme.heroTone === "light");
      heroEl.classList.toggle("is-dark-hero", theme.heroTone === "dark");
    }
    return theme;
  }

  function getFocusable(container) {
    return [...container.querySelectorAll(FOCUSABLE)].filter(
      (el) => !el.closest("[hidden]") && el.getAttribute("aria-hidden") !== "true"
    );
  }

  function trapFocus(container, event) {
    if (event.key !== "Tab") return;
    const nodes = getFocusable(container);
    if (!nodes.length) {
      event.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function createFocusTrap(container, { onEscape } = {}) {
    let previous = null;
    const onKeydown = (event) => {
      if (event.key === "Escape" && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }
      trapFocus(container, event);
    };
    return {
      activate() {
        previous = document.activeElement;
        document.addEventListener("keydown", onKeydown);
      },
      deactivate() {
        document.removeEventListener("keydown", onKeydown);
        if (previous?.focus) {
          try {
            previous.focus();
          } catch (_) {
            /* ignore stale focus targets */
          }
        }
        previous = null;
      },
      focusFirst(selector) {
        const target = selector ? container.querySelector(selector) : null;
        const node = target || getFocusable(container)[0];
        node?.focus();
      },
    };
  }

  let inertNodes = [];

  function setInert(exceptEl) {
    clearInert();
    ["magFront", "topbar", "hero", "railWrap", "main", "accessibility", "siteFooter"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el === exceptEl || exceptEl?.contains?.(el)) return;
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
      inertNodes.push(el);
    });
  }

  function clearInert() {
    inertNodes.forEach((el) => {
      el.removeAttribute("inert");
      el.removeAttribute("aria-hidden");
    });
    inertNodes = [];
  }

  function lbRankHtml(rank) {
    if (rank === 1) {
      return `<span class="mag-lb-rank" aria-label="Rank 1"><span aria-hidden="true">🥇</span></span>`;
    }
    return `<span class="mag-lb-rank">${rank}</span>`;
  }

  global.QbAnnualA11y = {
    prefersReducedMotion,
    normalizeHex,
    mix,
    luminance,
    contrastRatio,
    buildTheme,
    applyTheme,
    createFocusTrap,
    setInert,
    clearInert,
    getFocusable,
    lbRankHtml,
  };
})(window);
