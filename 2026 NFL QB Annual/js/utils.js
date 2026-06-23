const QbAnnualUtils = {
  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  escapeAttr(value) {
    return QbAnnualUtils.escapeHtml(value).replace(/"/g, "&quot;");
  },

  normalizeHex(value, fallback) {
    const raw = String(value || fallback || "#000000").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      const h = raw.slice(1);
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }
    return fallback || "#000000";
  },

  loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  copyText(text) {
    return navigator.clipboard.writeText(text);
  },

  /** Split display name into first / last, keeping suffixes (Jr., III, etc.) on the last line. */
  splitDisplayName(name) {
    const suffixes = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"]);
    const isSuffix = (token) => {
      const t = String(token || "").toLowerCase();
      return suffixes.has(t) || suffixes.has(t.replace(/\.$/, ""));
    };
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { first: "", last: "" };
    const firstParts = parts.slice(0, -1);
    const lastParts = [parts[parts.length - 1]];
    while (firstParts.length && isSuffix(lastParts[0])) {
      lastParts.unshift(firstParts.pop());
    }
    return {
      first: firstParts.join(" "),
      last: lastParts.join(" "),
    };
  },
};

window.QbAnnualUtils = QbAnnualUtils;
