# Callbook — team leads PWA

Files: `index.html` (the whole app) · `manifest.json` · `sw.js` (offline + push handler) · `offline.html` · `icons/` · `supabase/setup.sql`

## Deploy (GitHub Pages, free HTTPS)
1. Create a repo, upload everything in this folder to the repo root, commit.
2. Settings → Pages → Deploy from branch → `main` / root. Your app opens at `https://<user>.github.io/<repo>/`.
3. Supabase → Authentication → URL Configuration: add that URL to **Site URL** and **Redirect URLs**.
4. Open the URL on your phone → menu → *Install app / Add to Home screen*.

## PWABuilder (pwabuilder.com)
Paste the hosted URL. It should detect: manifest, service worker, offline support, installable icons (any + maskable), shortcuts.
Optional extras PWABuilder suggests: add real screenshots to `manifest.json` (`"screenshots"`, a 1080×1920 phone shot with `"form_factor":"narrow"`), then package for Android (Play Store) or Windows.

## Releasing an update
Change the files, then bump `VERSION` in `sw.js` (e.g. `callbook-v2`) so phones fetch the new copy.

## Team
Open the app → More → *Add teammate* (admin only). They tap *Create account* with that email. Supabase may email a confirmation link first.

## Push notifications
`sw.js` already handles `push` and `notificationclick`. Sending background pushes needs a push server (VAPID keys + a Supabase Edge Function + a subscriptions table) — not included yet. Until then the app alerts when opened.
