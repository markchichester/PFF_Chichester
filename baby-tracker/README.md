# Baby Tracker

Mobile-first web app for tracking feeds, naps, diapers, and medication. All data stays on the device (localStorage). No accounts, no cloud.

## Open on a phone

From this folder:

```bash
python3 -m http.server 8080
```

Then on your phone (same Wi‑Fi), open `http://YOUR-COMPUTER-IP:8080`.

Or open `index.html` directly in a mobile browser / add to Home Screen.

## Features

- **Cinematic opening** — soft pink/blue intro
- **Feeds** — Start / End, live timer, time since last feed, manual add
- **Naps** — same UX as feeds
- **Diapers** — one-tap poop / pee, time since last
- **Meds** — Ibuprofen 600mg / 6h, Acetaminophen 650mg / 4h, Colace 8pm, Prenatal 9am; check off doses; optional browser reminders

## Privacy

Generic branding. Nothing is uploaded. Clearing browser data will erase logs.
