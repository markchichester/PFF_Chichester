/* Baby Tracker service worker — lock-screen session controls */
const PENDING_END_KEY = "pendingEnd";
const DB_NAME = "baby-tracker-sw";
const DB_VERSION = 1;
const STORE = "kv";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Don't cache app shell — always use fresh JS/CSS
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  const kind = data.kind;
  const isSession = data.type === "active-session";
  const action = event.action;

  event.notification.close();

  if (!isSession || !kind) {
    event.waitUntil(openApp("./index.html"));
    return;
  }

  // Action button "end" or tapping the notification both complete the session
  const shouldEnd = action === "end" || action === "" || action === undefined;

  event.waitUntil(
    (async () => {
      if (shouldEnd) {
        await idbSet(PENDING_END_KEY, { kind, at: Date.now() });
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({ type: "END_SESSION", kind });
          if ("focus" in client) {
            await client.focus();
            return;
          }
        }
        await openApp(`./index.html?end=${encodeURIComponent(kind)}`);
      } else {
        await openApp("./index.html");
      }
    })()
  );
});

async function openApp(path) {
  const url = new URL(path, self.registration.scope).href;
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    if ("focus" in client) {
      await client.focus();
      if ("navigate" in client) {
        try {
          await client.navigate(url);
        } catch {
          /* ignore */
        }
      }
      return client;
    }
  }
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
  return null;
}
