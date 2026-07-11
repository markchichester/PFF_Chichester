(() => {
  const STORAGE_KEY = "baby-tracker-v1";
  const NOTIFY_KEY = "baby-tracker-notify";
  const IDB_NAME = "baby-tracker-sw";
  const IDB_STORE = "kv";
  const PENDING_END_KEY = "pendingEnd";

  const MEDS = [
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
    medDoses: [],
    activeFeed: null,
    activeNap: null,
  });

  let state = load();
  let toastTimer = null;
  let tickTimer = null;
  let sessionNotifyTimer = null;
  const notified = new Set();
  const sessionNotifyShown = { feed: false, nap: false };

  // ——— Storage ———
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return { ...defaultState(), ...JSON.parse(raw) };
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

  function sortByTime() {
    state.feeds.sort((a, b) => b.endedAt - a.endedAt);
    state.naps.sort((a, b) => b.endedAt - a.endedAt);
    state.diapers.sort((a, b) => b.at - a.at);
    state.medDoses.sort((a, b) => b.at - a.at);
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
  function lastDose(medId) {
    const hit = state.medDoses.find((d) => d.medId === medId);
    return hit ? hit.at : null;
  }

  function nextDue(med) {
    const last = lastDose(med.id);
    if (med.kind === "interval") {
      if (!last) return now();
      return last + med.everyHours * 3600000;
    }
    const scheduleToday = new Date();
    scheduleToday.setHours(med.hour, med.minute, 0, 0);
    const takenToday = last && dateKey(new Date(last)) === dateKey(new Date());
    if (takenToday) {
      const tomorrow = new Date(scheduleToday);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.getTime();
    }
    return scheduleToday.getTime();
  }

  function dateKey(d) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function isDue(med) {
    return now() >= nextDue(med);
  }

  function takeMed(medId, at = now(), manual = false) {
    state.medDoses.unshift({ id: uid(), medId, at, manual });
    notified.delete(medId);
    sortByTime();
    save();
    render();
    const med = MEDS.find((m) => m.id === medId);
    toast(`${med.name} taken`);
  }

  function medStatusText(med) {
    const due = nextDue(med);
    const last = lastDose(med.id);
    if (isDue(med)) {
      if (!last) return "Due now · never taken";
      return `Due now · last ${formatClock(last)}`;
    }
    const until = due - now();
    return `Next in ${formatDuration(until)} · ${formatClock(due)}`;
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
    MEDS.forEach((med) => {
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
        const med = MEDS.find((m) => m.id === d.medId);
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

  function renderMeds() {
    const html = MEDS.map((med) => {
      const due = isDue(med);
      const schedule =
        med.kind === "interval"
          ? `every ${med.everyHours}h`
          : formatClock(new Date().setHours(med.hour, med.minute, 0, 0));
      return `
        <article class="med-card ${due ? "is-due" : ""}">
          <div>
            <p class="med-card__name">${med.name}</p>
            <p class="med-card__dose">${med.dose} · ${schedule}</p>
          </div>
          <div class="med-card__actions">
            <button type="button" class="med-card__btn" data-take-med="${med.id}">
              Take now
            </button>
            <button type="button" class="med-card__btn med-card__btn--ghost" data-open="manual-med" data-med-id="${med.id}">
              Log past dose
            </button>
          </div>
          <p class="med-card__status">${medStatusText(med)}</p>
        </article>`;
    }).join("");

    document.getElementById("meds-home").innerHTML = html;
    document.getElementById("meds-full").innerHTML = html;
  }

  function render() {
    renderSince();
    renderSessionControls("feed");
    renderSessionControls("nap");
    renderHistory();
    renderMeds();
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

      const del = e.target.closest("[data-delete]");
      if (del) {
        const { delete: kind, id } = del.dataset;
        if (kind === "feed") state.feeds = state.feeds.filter((x) => x.id !== id);
        if (kind === "nap") state.naps = state.naps.filter((x) => x.id !== id);
        if (kind === "diaper") state.diapers = state.diapers.filter((x) => x.id !== id);
        if (kind === "med") state.medDoses = state.medDoses.filter((x) => x.id !== id);
        save();
        render();
        toast("Deleted");
      }
    });

    document.getElementById("notify-btn").addEventListener("click", enableNotifications);

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
      takeMed(fd.get("medId"), new Date(fd.get("at")).getTime(), true);
      document.getElementById("manual-med").close();
    });
  }

  function prepModal(id, medId) {
    const dlg = document.getElementById(id);
    const ended = dlg.querySelector('[name="endedAt"]');
    const at = dlg.querySelector('[name="at"]');
    const medSelect = dlg.querySelector('[name="medId"]');
    if (ended) ended.value = toLocalInputValue();
    if (at) at.value = toLocalInputValue();
    if (medSelect && medId) medSelect.value = medId;
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
    sortByTime();
    bind();
    bindServiceWorkerMessages();
    await registerServiceWorker();
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
