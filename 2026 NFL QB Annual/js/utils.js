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
};

window.QbAnnualUtils = QbAnnualUtils;
