(() => {
  const STORAGE_KEY = "baby-tracker-v1";
  const NOTIFY_KEY = "baby-tracker-notify";
  const IDB_NAME = "baby-tracker-sw";
  const IDB_STORE = "kv";
  const PENDING_END_KEY = "pendingEnd";
  const HERO_PHOTO_KEY = "heroPhoto";

  const DEFAULT_MEDS = [
    {
      id: "ibuprofen",
      name: "Ibuprofen",
      dose: "600 mg",
      kind: "interval",
      everyHours: 6,
    },
    {
      id: "acetaminophen",
      name: "Acetaminophen",
      dose: "650 mg",
      kind: "interval",
      everyHours: 4,
    },
    {
      id: "colace",
      name: "Colace",
      dose: "Once daily",
      kind: "daily",
      hour: 20,
      minute: 0,
    },
    {
      id: "prenatal",
      name: "Prenatal",
      dose: "Once daily",
      kind: "daily",
      hour: 9,
      minute: 0,
    },
  ];

  const defaultState = () => ({
    feeds: [],
    naps: [],
    diapers: [],
    medications: DEFAULT_MEDS.map((m) => ({ ...m })),
    medDoses: [],
    activeFeed: null,
    activeNap: null,
    growth: {
      birthDate: null,
      sex: "male",
      birthWeightKg: null,
      birthLengthCm: null,
    },
    measurements: [],
  });

  function getMeds() {
    return state.medications || [];
  }

  function findMed(id) {
    return getMeds().find((m) => m.id === id);
  }

  let state = load();
  let toastTimer = null;
  let tickTimer = null;
  let sessionNotifyTimer = null;
  let heroPhotoDataUrl = null;
  const notified = new Set();
  const sessionNotifyShown = { feed: false, nap: false };

  // ——— Storage ———
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const merged = { ...base, ...parsed, growth: { ...base.growth, ...(parsed.growth || {}) } };
      if (!Array.isArray(merged.medications) || !merged.medications.length) {
        merged.medications = DEFAULT_MEDS.map((m) => ({ ...m }));
      }
      if (!Array.isArray(merged.measurements)) merged.measurements = [];
      return merged;
    } catch {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function openIdb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbGet(key) {
    try {
      const db = await openIdb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return undefined;
    }
  }

  async function idbDel(key) {
    try {
      const db = await openIdb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* ignore */
    }
  }

  async function idbSet(key, value) {
    try {
      const db = await openIdb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn("idbSet failed", err);
      throw err;
    }
  }

  // ——— Hero photo ———
  function compressImage(file, maxWidth = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image"));
      };
      img.src = url;
    });
  }

  async function loadHeroPhoto() {
    const data = await idbGet(HERO_PHOTO_KEY);
    heroPhotoDataUrl = typeof data === "string" ? data : null;
    applyHeroPhoto();
  }

  function applyHeroPhoto() {
    const has = !!heroPhotoDataUrl;
    const intro = document.getElementById("intro");
    const introPhoto = document.getElementById("intro-photo");
    const hero = document.getElementById("baby-hero");
    const img = document.getElementById("baby-hero-img");
    const placeholder = document.getElementById("baby-hero-placeholder");
    const btn = document.getElementById("hero-photo-btn");
    const removeBtn = document.getElementById("hero-photo-remove");

    if (intro && introPhoto) {
      intro.classList.toggle("has-photo", has);
      if (has) {
        introPhoto.hidden = false;
        introPhoto.style.backgroundImage = `url("${heroPhotoDataUrl}")`;
      } else {
        introPhoto.hidden = true;
        introPhoto.style.backgroundImage = "";
      }
    }

    if (hero && img && placeholder && btn && removeBtn) {
      hero.classList.toggle("has-photo", has);
      if (has) {
        img.hidden = false;
        img.src = heroPhotoDataUrl;
        img.alt = "Baby hero photo";
        placeholder.hidden = true;
        btn.textContent = "Change photo";
        removeBtn.hidden = false;
      } else {
        img.hidden = true;
        img.removeAttribute("src");
        img.alt = "";
        placeholder.hidden = false;
        btn.textContent = "Add photo";
        removeBtn.hidden = true;
      }
    }
  }

  async function saveHeroPhoto(dataUrl) {
    await idbSet(HERO_PHOTO_KEY, dataUrl);
    heroPhotoDataUrl = dataUrl;
    applyHeroPhoto();
    toast("Hero photo saved");
  }

  async function removeHeroPhoto() {
    await idbDel(HERO_PHOTO_KEY);
    heroPhotoDataUrl = null;
    applyHeroPhoto();
    toast("Photo removed");
  }

  function sortByTime() {
    state.feeds.sort((a, b) => b.endedAt - a.endedAt);
    state.naps.sort((a, b) => b.endedAt - a.endedAt);
    state.diapers.sort((a, b) => b.at - a.at);
    state.medDoses.sort((a, b) => b.at - a.at);
    state.measurements.sort((a, b) => b.at - a.at);
  }

  // ——— Helpers ———
  function now() {
    return Date.now();
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatDuration(ms) {
    if (ms == null || ms < 0) return "—";
    const totalMin = Math.floor(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h <= 0) return `${m} min`;
    return `${h}h ${m}m`;
  }

  function formatClock(ts) {
    return new Date(ts).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDateTime(ts) {
    return new Date(ts).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function toLocalInputValue(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("is-show");
      setTimeout(() => {
        el.hidden = true;
      }, 300);
    }, 2200);
  }

  // ——— Sessions (feed / nap) ———
  function getActive(kind) {
    return kind === "feed" ? state.activeFeed : state.activeNap;
  }

  function setActive(kind, value) {
    if (kind === "feed") state.activeFeed = value;
    else state.activeNap = value;
  }

  function getList(kind) {
    return kind === "feed" ? state.feeds : state.naps;
  }

  function startSession(kind) {
    if (getActive(kind)) return;
    setActive(kind, { id: uid(), startedAt: now() });
    sessionNotifyShown[kind] = false;
    save();
    render();
    ensureSessionNotifications(true);
    toast(kind === "feed" ? "Feed started" : "Nap started");
  }

  function endSession(kind) {
    const active = getActive(kind);
    if (!active) return;
    const endedAt = now();
    const entry = {
      id: active.id,
      startedAt: active.startedAt,
      endedAt,
      durationMs: endedAt - active.startedAt,
    };
    getList(kind).unshift(entry);
    setActive(kind, null);
    sessionNotifyShown[kind] = false;
    sortByTime();
    save();
    render();
    clearSessionNotification(kind);
    toast(
      kind === "feed"
        ? `Feed ended · ${formatDuration(entry.durationMs)}`
        : `Nap ended · ${formatDuration(entry.durationMs)}`
    );
  }

  function toggleSession(kind) {
    if (getActive(kind)) endSession(kind);
    else startSession(kind);
  }

  function addManualSession(kind, endedAt, durationMin) {
    const durationMs = durationMin * 60000;
    const startedAt = endedAt - durationMs;
    getList(kind).unshift({
      id: uid(),
      startedAt,
      endedAt,
      durationMs,
      manual: true,
    });
    sortByTime();
    save();
    render();
    toast(kind === "feed" ? "Feed added" : "Nap added");
  }

  function lastEnded(kind) {
    const list = getList(kind);
    return list.length ? list[0].endedAt : null;
  }

  // ——— Diapers ———
  function logDiaper(type, at = now(), manual = false) {
    if (type === "both") {
      state.diapers.unshift({ id: uid(), type: "poop", at, manual });
      state.diapers.unshift({ id: uid(), type: "pee", at, manual });
    } else {
      state.diapers.unshift({ id: uid(), type, at, manual });
    }
    sortByTime();
    save();
    render();
    const label =
      type === "both" ? "Poop & pee logged" : type === "poop" ? "Poop logged" : "Pee logged";
    toast(label);
  }

  function lastDiaper(type) {
    const hit = state.diapers.find((d) => d.type === type);
    return hit ? hit.at : null;
  }

  // ——— Meds ———
  function normalizeMedications() {
    const byId = Object.fromEntries(DEFAULT_MEDS.map((m) => [m.id, m]));
    state.medications = (state.medications || []).map((med) => {
      const fallback = byId[med.id];
      let kind = med.kind;
      let everyHours = med.everyHours != null ? Number(med.everyHours) : undefined;
      let hour = med.hour != null ? Number(med.hour) : undefined;
      let minute = med.minute != null ? Number(med.minute) : undefined;

      // Starter meds: always restore the correct schedule (repairs bad "daily" saves)
      if (fallback) {
        kind = fallback.kind;
        everyHours = fallback.everyHours;
        hour = fallback.hour;
        minute = fallback.minute;
      } else {
        // Custom meds: infer safely
        if (everyHours > 0) kind = "interval";
        else if (kind === "daily" || hour != null) kind = "daily";
        else if (kind === "as-needed") kind = "as-needed";
        else if (!kind) kind = "as-needed";
      }

      if (kind === "interval") {
        if (!(everyHours > 0)) everyHours = 4;
        return { ...med, kind: "interval", everyHours, hour: undefined, minute: undefined };
      }
      if (kind === "daily") {
        return {
          ...med,
          kind: "daily",
          everyHours: undefined,
          hour: Number.isFinite(hour) ? hour : 9,
          minute: Number.isFinite(minute) ? minute : 0,
        };
      }
      return {
        ...med,
        kind: "as-needed",
        everyHours: undefined,
        hour: undefined,
        minute: undefined,
      };
    });
  }

  function lastDose(medId) {
    const hit = state.medDoses.find((d) => d.medId === medId && typeof d.at === "number");
    return hit ? hit.at : null;
  }

  /** Parse datetime-local as local wall time (avoid UTC misreads). */
  function parseLocalDateTime(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    const str = String(value || "");
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      return new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6] || 0)
      ).getTime();
    }
    const t = new Date(str).getTime();
    return Number.isFinite(t) ? t : Date.now();
  }

  function nextDue(med) {
    let last = lastDose(med.id);
    // Ignore future-dated last doses (bad manual entry / timezone glitch)
    if (last != null && last > now()) last = now();

    const kind = med.kind;

    if (kind === "interval") {
      const hours = Number(med.everyHours) > 0 ? Number(med.everyHours) : 4;
      if (!last) return now();
      return last + hours * 3600000;
    }

    if (kind === "as-needed") return null;

    if (kind === "daily") {
      const hour = Number(med.hour);
      const minute = Number(med.minute) || 0;
      const scheduleToday = new Date();
      scheduleToday.setHours(Number.isFinite(hour) ? hour : 9, minute, 0, 0);
      const takenToday = last && dateKey(new Date(last)) === dateKey(new Date());
      if (takenToday || now() < scheduleToday.getTime()) {
        // If already taken today → tomorrow; if before today's time and not taken → today
        if (takenToday) {
          const tomorrow = new Date(scheduleToday);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.getTime();
        }
        return scheduleToday.getTime();
      }
      // Past today's time and not taken → due now (return today's slot)
      return scheduleToday.getTime();
    }

    return null;
  }

  function dateKey(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function isDue(med) {
    if (med.kind === "as-needed") return false;
    const due = nextDue(med);
    return due != null && now() >= due;
  }

  function takeMed(medId, at = now(), manual = false) {
    const when = typeof at === "number" ? at : parseLocalDateTime(at);
    state.medDoses.unshift({ id: uid(), medId, at: when, manual });
    notified.delete(medId);
    sortByTime();
    save();
    render();
    const med = findMed(medId);
    toast(`${med ? med.name : "Medication"} taken`);
  }

  function medScheduleLabel(med) {
    if (med.kind === "interval") return `every ${med.everyHours}h`;
    if (med.kind === "daily") {
      return `daily · ${formatClock(new Date().setHours(med.hour || 0, med.minute || 0, 0, 0))}`;
    }
    return "as needed";
  }

  function medStatusText(med) {
    const last = lastDose(med.id);
    if (med.kind === "as-needed") {
      return last ? `Last ${formatClock(last)}` : "As needed · not taken yet";
    }
    const due = nextDue(med);
    if (due == null) return last ? `Last ${formatClock(last)}` : "Not scheduled";
    if (isDue(med)) {
      if (!last) return "Due now · never taken";
      return `Due now · last ${formatClock(last)}`;
    }
    const until = Math.max(0, due - now());
    if (med.kind === "interval") {
      return `Next in ${formatDuration(until)} (every ${med.everyHours}h)`;
    }
    return `Next in ${formatDuration(until)} · ${formatClock(due)}`;
  }

  function addMedication(data) {
    const med = {
      id: uid(),
      name: data.name.trim(),
      dose: (data.dose || "").trim() || "—",
      kind: data.kind,
      everyHours: data.kind === "interval" ? Number(data.everyHours) || 4 : undefined,
      hour: data.kind === "daily" ? Number(data.hour) : undefined,
      minute: data.kind === "daily" ? Number(data.minute) || 0 : undefined,
    };
    state.medications.push(med);
    save();
    render();
    toast(`${med.name} added`);
  }

  function removeMedication(id) {
    state.medications = state.medications.filter((m) => m.id !== id);
    save();
    render();
    toast("Medication removed");
  }

  // ——— Growth / measurements ———
  function lbOzToKg(lb, oz) {
    return (Number(lb) || 0) * 0.45359237 + (Number(oz) || 0) * 0.0283495231;
  }

  function kgToLbOz(kg) {
    const totalOz = kg / 0.0283495231;
    let lb = Math.floor(totalOz / 16);
    let oz = Math.round(totalOz - lb * 16);
    if (oz === 16) {
      lb += 1;
      oz = 0;
    }
    return { lb, oz };
  }

  function inToCm(inches) {
    return (Number(inches) || 0) * 2.54;
  }

  function cmToIn(cm) {
    return cm / 2.54;
  }

  function formatWeight(kg) {
    if (kg == null) return "—";
    const { lb, oz } = kgToLbOz(kg);
    return `${lb} lb ${oz} oz`;
  }

  function formatLength(cm) {
    if (cm == null) return "—";
    const inches = cmToIn(cm);
    return `${inches.toFixed(1)} in`;
  }

  function ageMonthsAt(ts) {
    const birth = state.growth?.birthDate;
    if (!birth) return null;
    const b = new Date(birth + "T12:00:00");
    const d = new Date(ts);
    const days = (d - b) / 86400000;
    if (days < 0) return null;
    return days / 30.4375; // WHO mean month length
  }

  function ageLabel(ts) {
    const months = ageMonthsAt(ts);
    if (months == null) return "";
    if (months < 1) {
      const birth = new Date(state.growth.birthDate + "T12:00:00");
      const days = Math.round((ts - birth.getTime()) / 86400000);
      return `${days}d old`;
    }
    const m = Math.floor(months);
    const remDays = Math.round((months - m) * 30.4375);
    return remDays ? `${m} mo ${remDays}d` : `${m} mo`;
  }

  function percentilesFor(m) {
    const who = window.WHOGrowth;
    if (!who || !state.growth?.birthDate) return { weightPct: null, lengthPct: null };
    return who.calc({
      sex: state.growth.sex || "male",
      ageMonths: ageMonthsAt(m.at),
      weightKg: m.weightKg,
      lengthCm: m.lengthCm,
    });
  }

  function allGrowthPoints() {
    const points = [];
    const g = state.growth || {};
    if (g.birthDate && (g.birthWeightKg != null || g.birthLengthCm != null)) {
      points.push({
        id: "birth",
        at: new Date(g.birthDate + "T12:00:00").getTime(),
        weightKg: g.birthWeightKg,
        lengthCm: g.birthLengthCm,
        isBirth: true,
      });
    }
    state.measurements.forEach((m) => points.push(m));
    points.sort((a, b) => a.at - b.at);
    return points;
  }

  function latestMeasurement() {
    const pts = allGrowthPoints();
    return pts.length ? pts[pts.length - 1] : null;
  }

  function saveGrowthProfile(data) {
    state.growth = {
      birthDate: data.birthDate,
      sex: data.sex,
      birthWeightKg: data.birthWeightKg,
      birthLengthCm: data.birthLengthCm,
    };
    save();
    render();
    toast("Birth info saved");
  }

  function addMeasurement(data) {
    state.measurements.unshift({
      id: uid(),
      at: data.at,
      weightKg: data.weightKg,
      lengthCm: data.lengthCm,
      note: data.note || "",
    });
    sortByTime();
    save();
    render();
    toast("Measurement logged");
  }

  // ——— Notifications ———
  function notificationsEnabled() {
    return (
      localStorage.getItem(NOTIFY_KEY) === "1" &&
      "Notification" in window &&
      Notification.permission === "granted"
    );
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      toast("Notifications not supported here");
      return;
    }
    await registerServiceWorker();
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem(NOTIFY_KEY, "1");
      toast("Lock-screen reminders on");
      checkMedNotifications(true);
      ensureSessionNotifications(true);
    } else {
      localStorage.setItem(NOTIFY_KEY, "0");
      toast("Reminders blocked");
    }
    updateNotifyBtn();
  }

  function updateNotifyBtn() {
    const btn = document.getElementById("notify-btn");
    if (notificationsEnabled()) {
      btn.classList.add("is-on");
      btn.textContent = "Reminders on";
    } else {
      btn.classList.remove("is-on");
      btn.textContent = "Reminders";
    }
  }

  function checkMedNotifications(force = false) {
    if (!notificationsEnabled() && !force) return;
    if (!notificationsEnabled()) return;
    getMeds().forEach((med) => {
      if (isDue(med) && !notified.has(med.id)) {
        notified.add(med.id);
        try {
          new Notification("Medication due", {
            body: `${med.name} ${med.dose}`,
            tag: `med-${med.id}`,
            silent: false,
          });
        } catch {
          /* ignore */
        }
      }
    });
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      return await navigator.serviceWorker.register("./sw.js");
    } catch {
      return null;
    }
  }

  async function getSwRegistration() {
    if (!("serviceWorker" in navigator)) return null;
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }

  async function clearSessionNotification(kind) {
    try {
      const reg = await getSwRegistration();
      if (!reg?.getNotifications) return;
      const list = await reg.getNotifications({ tag: `active-${kind}` });
      list.forEach((n) => n.close());
    } catch {
      /* ignore */
    }
  }

  async function ensureSessionNotifications(fromStart = false) {
    if (!notificationsEnabled()) {
      if (fromStart && (state.activeFeed || state.activeNap)) {
        // Soft prompt once per start if reminders are off
        const btn = document.getElementById("notify-btn");
        if (btn && !btn.classList.contains("is-on")) {
          btn.classList.add("pulse-hint");
          setTimeout(() => btn.classList.remove("pulse-hint"), 2400);
        }
      }
      return;
    }

    const reg = await getSwRegistration();
    if (!reg?.showNotification) return;

    for (const kind of ["feed", "nap"]) {
      const active = getActive(kind);
      const tag = `active-${kind}`;
      if (!active) {
        await clearSessionNotification(kind);
        continue;
      }

      const elapsed = formatDuration(now() - active.startedAt);
      const isFeed = kind === "feed";
      const title = isFeed ? "Feeding in progress" : "Nap in progress";
      const body = `${elapsed} · Tap End when finished`;
      const firstShow = !sessionNotifyShown[kind];
      sessionNotifyShown[kind] = true;

      try {
        await reg.showNotification(title, {
          body,
          tag,
          renotify: firstShow,
          requireInteraction: true,
          silent: !firstShow && !fromStart,
          badge: "./icon.svg",
          icon: "./icon.svg",
          actions: [
            {
              action: "end",
              title: isFeed ? "End feed" : "End nap",
            },
          ],
          data: { type: "active-session", kind },
        });
      } catch {
        /* Some browsers reject actions / icons — retry minimal */
        try {
          await reg.showNotification(title, {
            body,
            tag,
            requireInteraction: true,
            silent: !firstShow,
            data: { type: "active-session", kind },
          });
        } catch {
          /* ignore */
        }
      }
    }
  }

  function startSessionNotifyLoop() {
    clearInterval(sessionNotifyTimer);
    sessionNotifyTimer = setInterval(() => {
      if (state.activeFeed || state.activeNap) ensureSessionNotifications(false);
    }, 15000);
  }

  async function consumePendingEnd() {
    const pending = await idbGet(PENDING_END_KEY);
    if (pending?.kind) {
      await idbDel(PENDING_END_KEY);
      if (getActive(pending.kind)) endSession(pending.kind);
    }

    const params = new URLSearchParams(location.search);
    const endKind = params.get("end");
    if (endKind === "feed" || endKind === "nap") {
      if (getActive(endKind)) endSession(endKind);
      const url = new URL(location.href);
      url.searchParams.delete("end");
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }

  function bindServiceWorkerMessages() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "END_SESSION") {
        const kind = event.data.kind;
        if (kind === "feed" || kind === "nap") {
          idbDel(PENDING_END_KEY);
          if (getActive(kind)) endSession(kind);
        }
      }
    });
  }

  // ——— Render ———
  function renderSince() {
    const pairs = [
      ["feed", lastEnded("feed")],
      ["nap", lastEnded("nap")],
      ["poop", lastDiaper("poop")],
      ["pee", lastDiaper("pee")],
    ];
    pairs.forEach(([key, ts]) => {
      document.querySelectorAll(`[data-since="${key}"]`).forEach((el) => {
        el.textContent = ts ? formatDuration(now() - ts) : "—";
      });
      document.querySelectorAll(`[data-meta="${key}"]`).forEach((el) => {
        if (!ts) {
          el.textContent =
            key === "feed"
              ? "No feeds yet"
              : key === "nap"
                ? "No naps yet"
                : key === "poop"
                  ? "No poops yet"
                  : "No pees yet";
        } else {
          el.textContent = `Last at ${formatClock(ts)}`;
        }
      });
    });
  }

  function renderSessionControls(kind) {
    const active = getActive(kind);
    const label = active
      ? kind === "feed"
        ? "End feed"
        : "End nap"
      : kind === "feed"
        ? "Start feed"
        : "Start nap";
    const hint = active
      ? formatDuration(now() - active.startedAt)
      : "Tap to begin";

    document.querySelectorAll(`[data-${kind}-label]`).forEach((el) => {
      el.textContent = label;
    });
    document.querySelectorAll(`[data-${kind}-hint]`).forEach((el) => {
      el.textContent = hint;
    });
    document.querySelectorAll(`[data-action="${kind}-toggle"]`).forEach((el) => {
      el.classList.toggle("is-live", !!active);
    });
    document.querySelectorAll(`[data-${kind}-timer]`).forEach((el) => {
      if (active) {
        el.hidden = false;
        const ms = now() - active.startedAt;
        const s = Math.floor(ms / 1000);
        el.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
      } else {
        el.hidden = true;
      }
    });
  }

  function renderHistory() {
    const feedEl = document.getElementById("feed-history");
    const napEl = document.getElementById("nap-history");
    const diaperEl = document.getElementById("diaper-history");
    const medEl = document.getElementById("med-history");

    feedEl.innerHTML = listOrEmpty(
      state.feeds.slice(0, 12).map(
        (f) => `
        <li>
          <div>
            <div>${formatDateTime(f.endedAt)}</div>
            <div class="muted">${formatDuration(f.durationMs)}${f.manual ? " · manual" : ""}</div>
          </div>
          <button type="button" class="delete-btn" data-delete="feed" data-id="${f.id}">Delete</button>
        </li>`
      )
    );

    napEl.innerHTML = listOrEmpty(
      state.naps.slice(0, 12).map(
        (n) => `
        <li>
          <div>
            <div>${formatDateTime(n.endedAt)}</div>
            <div class="muted">${formatDuration(n.durationMs)}${n.manual ? " · manual" : ""}</div>
          </div>
          <button type="button" class="delete-btn" data-delete="nap" data-id="${n.id}">Delete</button>
        </li>`
      )
    );

    diaperEl.innerHTML = listOrEmpty(
      state.diapers.slice(0, 16).map(
        (d) => `
        <li>
          <div>
            <div>${d.type === "poop" ? "Poop" : "Pee"}</div>
            <div class="muted">${formatDateTime(d.at)}</div>
          </div>
          <button type="button" class="delete-btn" data-delete="diaper" data-id="${d.id}">Delete</button>
        </li>`
      )
    );

    medEl.innerHTML = listOrEmpty(
      state.medDoses.slice(0, 16).map((d) => {
        const med = findMed(d.medId);
        return `
        <li>
          <div>
            <div>${med ? med.name : d.medId}${d.manual ? " · manual" : ""}</div>
            <div class="muted">${formatDateTime(d.at)}</div>
          </div>
          <button type="button" class="delete-btn" data-delete="med" data-id="${d.id}">Delete</button>
        </li>`;
      })
    );
  }

  function listOrEmpty(items) {
    if (!items.length) return `<li class="empty">Nothing logged yet</li>`;
    return items.join("");
  }

  function populateMedSelect(selectedId) {
    const select = document.getElementById("manual-med-select");
    if (!select) return;
    const meds = getMeds();
    if (!meds.length) {
      select.innerHTML = `<option value="">Add a medication first</option>`;
      return;
    }
    select.innerHTML = meds
      .map(
        (m) =>
          `<option value="${m.id}" ${m.id === selectedId ? "selected" : ""}>${m.name}${
            m.dose && m.dose !== "—" ? " · " + m.dose : ""
          }</option>`
      )
      .join("");
  }

  function renderMeds() {
    const meds = getMeds();
    const html = meds.length
      ? meds
          .map((med) => {
            const due = isDue(med);
            return `
        <article class="med-card ${due ? "is-due" : ""}">
          <div>
            <p class="med-card__name">${med.name}</p>
            <p class="med-card__dose">${med.dose} · ${medScheduleLabel(med)}</p>
          </div>
          <div class="med-card__actions">
            <button type="button" class="med-card__btn" data-take-med="${med.id}">
              Take now
            </button>
            <button type="button" class="med-card__btn med-card__btn--ghost" data-open="manual-med" data-med-id="${med.id}">
              Log past dose
            </button>
            <button type="button" class="link-btn" data-remove-med="${med.id}">Remove</button>
          </div>
          <p class="med-card__status">${medStatusText(med)}</p>
        </article>`;
          })
          .join("")
      : `<p class="empty-hint">No medications yet. Add one when prescribed.</p>`;

    document.getElementById("meds-home").innerHTML = html;
    document.getElementById("meds-full").innerHTML = html;
  }

  function renderGrowth() {
    const setup = document.getElementById("growth-setup");
    const body = document.getElementById("growth-body");
    const g = state.growth || {};
    const hasBirth = !!g.birthDate;

    if (setup) setup.hidden = hasBirth;
    if (body) body.hidden = !hasBirth;
    if (!hasBirth) return;

    const latest = latestMeasurement();
    const who = window.WHOGrowth;
    let weightPct = "—";
    let lengthPct = "—";
    let latestMeta = "Add a checkup measurement";
    if (latest && who) {
      const p = percentilesFor(latest);
      weightPct = who.formatPercentile(p.weightPct);
      lengthPct = who.formatPercentile(p.lengthPct);
      latestMeta = `${formatDateTime(latest.at)} · ${ageLabel(latest.at)}`;
    }

    const wEl = document.getElementById("growth-weight-pct");
    const lEl = document.getElementById("growth-length-pct");
    const metaEl = document.getElementById("growth-latest-meta");
    const birthEl = document.getElementById("growth-birth-summary");
    if (wEl) wEl.textContent = weightPct;
    if (lEl) lEl.textContent = lengthPct;
    if (metaEl) metaEl.textContent = latestMeta;
    if (birthEl) {
      birthEl.textContent = `Born ${g.birthDate} · ${g.sex === "female" ? "Girl" : "Boy"} · ${formatWeight(
        g.birthWeightKg
      )} · ${formatLength(g.birthLengthCm)}`;
    }

    const list = document.getElementById("growth-history");
    if (list) {
      const pts = allGrowthPoints().slice().reverse();
      list.innerHTML = listOrEmpty(
        pts.map((m) => {
          const p = percentilesFor(m);
          const whoFmt = window.WHOGrowth;
          const wp = whoFmt ? whoFmt.formatPercentile(p.weightPct) : "—";
          const lp = whoFmt ? whoFmt.formatPercentile(p.lengthPct) : "—";
          return `
          <li>
            <div>
              <div>${m.isBirth ? "Birth" : formatDateTime(m.at)} · ${ageLabel(m.at)}</div>
              <div class="muted">${formatWeight(m.weightKg)} (${wp}) · ${formatLength(m.lengthCm)} (${lp})</div>
            </div>
            ${
              m.isBirth
                ? ""
                : `<button type="button" class="delete-btn" data-delete="measurement" data-id="${m.id}">Delete</button>`
            }
          </li>`;
        })
      );
    }

    renderGrowthChart();
  }

  function renderGrowthChart() {
    const svg = document.getElementById("growth-chart");
    if (!svg || !window.WHOGrowth) return;
    const pts = allGrowthPoints().filter((p) => p.weightKg != null);
    const sex = state.growth?.sex === "female" ? "female" : "male";
    const W = 320;
    const H = 180;
    const pad = { t: 16, r: 12, b: 28, l: 36 };
    const maxAge = Math.max(6, ...pts.map((p) => ageMonthsAt(p.at) || 0), 1);
    const xMax = Math.min(24, Math.ceil(maxAge + 1));

    const refAges = [];
    for (let m = 0; m <= xMax; m += xMax > 12 ? 2 : 1) refAges.push(m);

    function weightAtPct(months, z) {
      const { L, M, S } = window.WHOGrowth.lmsAt(window.WHOGrowth.weight[sex], months);
      if (Math.abs(L) < 1e-7) return M * Math.exp(S * z);
      return M * Math.pow(1 + L * S * z, 1 / L);
    }

    const bands = [
      { z: -1.881, cls: "p3" },
      { z: -1.036, cls: "p15" },
      { z: 0, cls: "p50" },
      { z: 1.036, cls: "p85" },
      { z: 1.881, cls: "p97" },
    ];

    let yMin = Infinity;
    let yMax = -Infinity;
    bands.forEach((b) => {
      refAges.forEach((a) => {
        const w = weightAtPct(a, b.z);
        yMin = Math.min(yMin, w);
        yMax = Math.max(yMax, w);
      });
    });
    pts.forEach((p) => {
      yMin = Math.min(yMin, p.weightKg);
      yMax = Math.max(yMax, p.weightKg);
    });
    const yPad = (yMax - yMin) * 0.08 || 0.5;
    yMin -= yPad;
    yMax += yPad;

    const xScale = (m) => pad.l + ((m - 0) / xMax) * (W - pad.l - pad.r);
    const yScale = (kg) => pad.t + (1 - (kg - yMin) / (yMax - yMin)) * (H - pad.t - pad.b);

    function pathFor(z) {
      return refAges
        .map((a, i) => {
          const x = xScale(a);
          const y = yScale(weightAtPct(a, z));
          return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    }

    const curves = bands
      .map((b) => `<path class="chart-band chart-band--${b.cls}" d="${pathFor(b.z)}" fill="none" />`)
      .join("");

    const dots = pts
      .map((p) => {
        const m = ageMonthsAt(p.at);
        if (m == null) return "";
        return `<circle class="chart-point" cx="${xScale(m).toFixed(1)}" cy="${yScale(p.weightKg).toFixed(
          1
        )}" r="5" />`;
      })
      .join("");

    const labels = `
      <text class="chart-axis" x="${pad.l}" y="${H - 8}">0 mo</text>
      <text class="chart-axis" x="${W - pad.r}" y="${H - 8}" text-anchor="end">${xMax} mo</text>
      <text class="chart-axis" x="4" y="${yScale(yMax) + 4}">${yMax.toFixed(1)}</text>
      <text class="chart-axis" x="4" y="${yScale(yMin) + 4}">${yMin.toFixed(1)}</text>
      <text class="chart-legend" x="${W / 2}" y="12" text-anchor="middle">Weight · WHO 3rd–97th</text>
    `;

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = curves + dots + labels;
  }

  function render() {
    renderSince();
    renderSessionControls("feed");
    renderSessionControls("nap");
    renderHistory();
    renderMeds();
    renderGrowth();
    applyHeroPhoto();
    updateNotifyBtn();
  }

  // ——— Tabs ———
  function switchTab(name) {
    document.querySelectorAll(".tab").forEach((tab) => {
      const on = tab.dataset.tab === name;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach((panel) => {
      const on = panel.id === `panel-${name}`;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
  }

  // ——— Events ———
  function bind() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    const heroBtn = document.getElementById("hero-photo-btn");
    const heroInput = document.getElementById("hero-photo-input");
    const heroRemove = document.getElementById("hero-photo-remove");
    const heroPlaceholder = document.getElementById("baby-hero-placeholder");

    if (heroBtn && heroInput) {
      heroBtn.addEventListener("click", () => heroInput.click());
      if (heroPlaceholder) {
        heroPlaceholder.addEventListener("click", () => heroInput.click());
      }
      heroInput.addEventListener("change", async () => {
        const file = heroInput.files && heroInput.files[0];
        heroInput.value = "";
        if (!file) return;
        try {
          toast("Saving photo…");
          const dataUrl = await compressImage(file);
          await saveHeroPhoto(dataUrl);
        } catch {
          toast("Couldn’t save that photo");
        }
      });
    }
    if (heroRemove) {
      heroRemove.addEventListener("click", () => {
        if (confirm("Remove the hero photo?")) removeHeroPhoto();
      });
    }

    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]");
      if (t) {
        const action = t.dataset.action;
        if (action === "feed-toggle") toggleSession("feed");
        if (action === "nap-toggle") toggleSession("nap");
        if (action === "log-poop") logDiaper("poop");
        if (action === "log-pee") logDiaper("pee");
      }

      const open = e.target.closest("[data-open]");
      if (open) {
        const dlg = document.getElementById(open.dataset.open);
        prepModal(open.dataset.open, open.dataset.medId);
        dlg.showModal();
      }

      const close = e.target.closest("[data-close]");
      if (close) close.closest("dialog").close();

      const take = e.target.closest("[data-take-med]");
      if (take) takeMed(take.dataset.takeMed);

      const removeMed = e.target.closest("[data-remove-med]");
      if (removeMed) {
        if (confirm("Remove this medication from the list?")) {
          removeMedication(removeMed.dataset.removeMed);
        }
      }

      const del = e.target.closest("[data-delete]");
      if (del) {
        const { delete: kind, id } = del.dataset;
        if (kind === "feed") state.feeds = state.feeds.filter((x) => x.id !== id);
        if (kind === "nap") state.naps = state.naps.filter((x) => x.id !== id);
        if (kind === "diaper") state.diapers = state.diapers.filter((x) => x.id !== id);
        if (kind === "med") state.medDoses = state.medDoses.filter((x) => x.id !== id);
        if (kind === "measurement") state.measurements = state.measurements.filter((x) => x.id !== id);
        save();
        render();
        toast("Deleted");
      }
    });

    document.getElementById("notify-btn").addEventListener("click", enableNotifications);

    const kindSelect = document.getElementById("med-kind-select");
    if (kindSelect) {
      kindSelect.addEventListener("change", () => {
        const kind = kindSelect.value;
        document.getElementById("med-fields-interval").hidden = kind !== "interval";
        document.getElementById("med-fields-daily").hidden = kind !== "daily";
      });
    }

    document.getElementById("manual-feed-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const endedAt = new Date(fd.get("endedAt")).getTime();
      const durationMin = Number(fd.get("durationMin"));
      addManualSession("feed", endedAt, durationMin);
      document.getElementById("manual-feed").close();
    });

    document.getElementById("manual-nap-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const endedAt = new Date(fd.get("endedAt")).getTime();
      const durationMin = Number(fd.get("durationMin"));
      addManualSession("nap", endedAt, durationMin);
      document.getElementById("manual-nap").close();
    });

    document.getElementById("manual-diaper-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      logDiaper(fd.get("type"), new Date(fd.get("at")).getTime(), true);
      document.getElementById("manual-diaper").close();
    });

    document.getElementById("manual-med-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      takeMed(fd.get("medId"), parseLocalDateTime(fd.get("at")), true);
      document.getElementById("manual-med").close();
    });

    document.getElementById("add-med-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const kind = fd.get("kind");
      addMedication({
        name: fd.get("name"),
        dose: fd.get("dose"),
        kind,
        everyHours: fd.get("everyHours"),
        hour: fd.get("hour"),
        minute: fd.get("minute"),
      });
      e.target.reset();
      document.getElementById("med-fields-interval").hidden = false;
      document.getElementById("med-fields-daily").hidden = true;
      document.getElementById("add-med").close();
    });

    document.getElementById("birth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      saveGrowthProfile({
        birthDate: fd.get("birthDate"),
        sex: fd.get("sex"),
        birthWeightKg: lbOzToKg(fd.get("lb"), fd.get("oz")),
        birthLengthCm: inToCm(fd.get("inches")),
      });
    });

    document.getElementById("edit-birth-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      saveGrowthProfile({
        birthDate: fd.get("birthDate"),
        sex: fd.get("sex"),
        birthWeightKg: lbOzToKg(fd.get("lb"), fd.get("oz")),
        birthLengthCm: inToCm(fd.get("inches")),
      });
      document.getElementById("edit-birth").close();
    });

    document.getElementById("add-measurement-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const dateStr = fd.get("date");
      const at = new Date(dateStr + "T12:00:00").getTime();
      addMeasurement({
        at,
        weightKg: lbOzToKg(fd.get("lb"), fd.get("oz")),
        lengthCm: inToCm(fd.get("inches")),
        note: fd.get("note") || "",
      });
      document.getElementById("add-measurement").close();
    });
  }

  function prepModal(id, medId) {
    const dlg = document.getElementById(id);
    if (!dlg) return;
    const ended = dlg.querySelector('[name="endedAt"]');
    const at = dlg.querySelector('[name="at"]');
    if (ended) ended.value = toLocalInputValue();
    if (at) at.value = toLocalInputValue();
    if (id === "manual-med") populateMedSelect(medId);
    if (id === "add-measurement") {
      const date = dlg.querySelector('[name="date"]');
      if (date) date.value = new Date().toISOString().slice(0, 10);
    }
    if (id === "edit-birth") {
      const g = state.growth || {};
      if (g.birthDate) dlg.querySelector('[name="birthDate"]').value = g.birthDate;
      if (g.sex) dlg.querySelector('[name="sex"]').value = g.sex;
      if (g.birthWeightKg != null) {
        const { lb, oz } = kgToLbOz(g.birthWeightKg);
        dlg.querySelector('[name="lb"]').value = lb;
        dlg.querySelector('[name="oz"]').value = oz;
      }
      if (g.birthLengthCm != null) {
        dlg.querySelector('[name="inches"]').value = cmToIn(g.birthLengthCm).toFixed(1);
      }
    }
  }

  // ——— Intro ———
  function runIntro() {
    const intro = document.getElementById("intro");
    const app = document.getElementById("app");
    setTimeout(() => {
      intro.classList.add("is-done");
      intro.setAttribute("aria-hidden", "true");
      app.hidden = false;
      setTimeout(() => intro.remove(), 800);
    }, 2400);
  }

  // ——— Boot ———
  async function boot() {
    normalizeMedications();
    save();
    sortByTime();
    bind();
    bindServiceWorkerMessages();
    await registerServiceWorker();
    await loadHeroPhoto();
    await consumePendingEnd();
    render();
    runIntro();
    startSessionNotifyLoop();
    ensureSessionNotifications(!!(state.activeFeed || state.activeNap));

    tickTimer = setInterval(() => {
      renderSince();
      renderSessionControls("feed");
      renderSessionControls("nap");
      renderMeds();
      checkMedNotifications();
    }, 1000);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Phone likely locking / app backgrounded — refresh lock-screen banner
        ensureSessionNotifications(true);
      } else {
        consumePendingEnd().then(() => {
          render();
          checkMedNotifications();
          ensureSessionNotifications(false);
        });
      }
    });

    window.addEventListener("pageshow", () => {
      consumePendingEnd().then(() => ensureSessionNotifications(false));
    });
  }

  boot();
})();
