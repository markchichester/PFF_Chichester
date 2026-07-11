# Baby Tracker

Mobile-first web app for tracking feeds, naps, diapers, and medication. All data stays on the device (localStorage). No accounts, no cloud.

## Open on a phone

Serve over HTTP (needed for lock-screen notifications):

```bash
cd ~/Desktop/baby-tracker
python3 -m http.server 8080
```

On your phone (same Wi‑Fi), open `http://YOUR-COMPUTER-IP:8080`.

**Add to Home Screen** for the best experience (especially on iPhone).

## Lock-screen feed / nap reminder

1. Tap **Reminders** once and allow notifications.
2. Start a feed or nap.
3. When the phone locks, a persistent notification stays on the lock screen with the live duration.
4. Tap **End feed** / **End nap** (Android) or tap the notification (iPhone) to complete it.

Notes:
- Works best on **Android Chrome**.
- On **iPhone**, install to Home Screen and allow notifications; action buttons are limited, but tapping the banner opens the app and ends the session.
- Must be opened via `http://` or `https://` (not a raw `file://` link) for the service worker.

## Features

- **Cinematic opening** — soft pink/blue intro
- **Feeds / Naps** — Start / End, live timer, time since last, manual add, lock-screen end action
- **Diapers** — one-tap poop / pee, time since last
- **Meds** — Ibuprofen 600mg / 6h, Acetaminophen 650mg / 4h, Colace 8pm, Prenatal 9am; check off or log past doses; optional reminders

## Privacy

Generic branding. Nothing is uploaded. Clearing browser data will erase logs.
