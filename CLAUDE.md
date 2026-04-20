# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

Static marketing site for **Tejidos Lorena** (Ecuadorian knitwear workshop). `404.html` is a matching not-found page. No build step, no package manager, no test suite. `assets/` holds the hero image; `uploads/` holds pasted screenshots.

The homepage is split across four repo-root files:

- **`index.html`** — structure only (head metadata, body markup, tweaks panel). The `<style>` block is gone; CSS is linked externally. The inline `<script>` contains **only** the `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/` block defining `TWEAK_DEFAULTS`, followed by `<script src="/i18n.js">` and `<script src="/app.js">` (loaded in that order — both are classic scripts that share the global lexical scope).
- **`styles.css`** — all CSS (theming vars, layout, responsive breakpoints at 900px and 600px).
- **`i18n.js`** — declares `const i18n = { es: {…}, en: {…} }` and `const copyTones = { warm: {…}, direct: {…} }` in the global script scope. No side effects.
- **`app.js`** — consumes `TWEAK_DEFAULTS`, `i18n`, `copyTones` from the shared global scope. Owns all DOM wiring: `applyContent/Theme/Density`, IG grid generation, event handlers, `postMessage` contract with the parent edit-mode harness, `applyAll()` call at end.

Other repo-root static files: `favicon.svg`, `og-image.jpg` (1200×630 social card — generated from `og-card.html`), `robots.txt`, `sitemap.xml`.

`og-card.html` is the source template for the social card. It lives in the repo for editability but is excluded from Vercel deployment via `.vercelignore` — so `tejidoslorena.com/og-card` returns 404. Also carries a `noindex` meta tag as a belt-and-suspenders fallback.

### Regenerating `og-image.jpg`

Edit `og-card.html` (copy, colors, layout), then run — from repo root — this one-liner. It uses macOS-native tools only:

```bash
python3 -m http.server 8080 &
SERVER_PID=$!
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --virtual-time-budget=8000 --window-size=1200,630 \
  --screenshot=/tmp/og-card.png \
  http://localhost:8080/og-card.html
sips -s format jpeg -s formatOptions 88 /tmp/og-card.png --out og-image.jpg
kill $SERVER_PID
```

Fonts are pulled from Google Fonts on render; `--virtual-time-budget=8000` gives 8s of virtual time for font/image loading before the shot.

Production domain is **tejidoslorena.com** (used in `og:url`, `canonical`, `sitemap.xml`, and the JSON-LD `LocalBusiness` schema in `index.html`'s `<head>`).

Hosting is static on Vercel (`.vercel/project.json` — project `lorena-landing`, linked but gitignored). Deploy config is in `vercel.json`: clean URLs (no `.html`, no trailing slash), 1-year immutable cache for `/assets/*` and `/uploads/*`, 1-week cache for `favicon.svg` / `og-image.jpg`, 1-hour must-revalidate for `*.css` / `*.js` (no hash-busting yet), no-cache for HTML, and iframe-safe security headers (no `X-Frame-Options` / frame-ancestors CSP — the edit-mode harness embeds the site in a parent frame).

## Commands

No npm/yarn — there is nothing to install or compile. To work on the site:

- **Local development**: `vercel dev` (serves the site locally using the linked Vercel project config).
- **Local preview (no Vercel)**: open `index.html` directly in a browser, or `python3 -m http.server` from the repo root.
- **Deploy preview**: `vercel` (uses the linked project).
- **Deploy production**: `vercel --prod`.

## Architecture you need to know before editing

### Theming (`data-theme` on `<html>`)
Three themes — `cream` (default via `:root`), `dark`, `teal` — are defined in `styles.css` as CSS custom-property overrides under `[data-theme="..."]` selectors. **All colors must go through `var(--bg)`, `var(--fg)`, `var(--accent)`, etc.** Adding a hex color directly breaks theme switching. When adding a new themed surface, add the variable under `:root` and override it in each `[data-theme=...]` block.

**OS dark-mode follow**: a tiny inline `<script>` in `<head>` (before the stylesheet) checks `matchMedia('(prefers-color-scheme: dark)')` and sets `document.documentElement.dataset.theme = 'dark'` when the OS prefers dark — no FOUC. `app.js` also listens for `matchMedia` change events and flips the theme live, but only if the user hasn't manually picked a theme via the tweaks panel (tracked by `themeUserPicked` — not part of `state`, so not posted back to the harness). The harness can still force a specific theme via `TWEAK_DEFAULTS.theme` (anything other than `'cream'` wins over OS preference).

The `404.html` uses a simpler CSS-only `@media (prefers-color-scheme: dark)` block since it has no JS.

### i18n (`data-i18n` attributes + `i18n` dictionary)
Text is keyed. An element like `<h1 data-i18n="hero_h1_1">Tradición</h1>` gets its `innerHTML` replaced from `i18n[lang][key]` on language switch. The `i18n` object lives in **`/i18n.js`** and has exactly two locales: `es` and `en`. **When adding translatable copy, you must add the key to both `es` and `en` — forgetting one leaves stale text on switch.** HTML (e.g. `<em>`) is allowed in values; `innerHTML` is used, not `textContent`.

### Copy tones (Spanish only)
`copyTones.warm` and `copyTones.direct` (also in `/i18n.js`) are partial override dictionaries that merge on top of `i18n.es` when `state.copyTone !== 'editorial'`. They intentionally cover only a few hero/contact keys. English has no tone variants — tone state is ignored when `lang === 'en'`.

### Edit-mode / tweaks panel integration
The site is designed to run inside a parent-frame editor. `/app.js`:
1. Posts `{ type: '__edit_mode_available' }` to `window.parent` on load.
2. Listens for `__activate_edit_mode` / `__deactivate_edit_mode` to show/hide the `#tweaks` panel.
3. On every tweak change (theme, density, language, copyTone) posts `{ type: '__edit_mode_set_keys', edits: {...state} }`.

The block between `/*EDITMODE-BEGIN*/` and `/*EDITMODE-END*/` — still **inline in `index.html`** — defines `TWEAK_DEFAULTS`, the authoritative shape of editable state. The parent harness may rewrite this block in place. **Preserve the sentinel comments and the object shape exactly**; do not move defaults into `app.js` or rename keys without understanding the harness contract.

### Gallery density
`#galeria-grid` carries one of `dense-low` / `dense-med` / `dense-high`. Density buttons exist in two places (`#density-public` and `#density-tweaks`) — both are wired through the same `[data-density]` handler, so new density controls just need the attribute.

## Conventions

- Spanish is the source-of-truth for copy; English is the translation. Business terminology (Stoll machines, Otavalo, ugly sweaters, MOQ) should stay consistent across locales.
- **Factual accuracy about production**: the site is an artisan workshop but the **knitting itself is machine-made** (Stoll flat knitting machines). Only the finishing step — linking, stitching, edges, inspection — is literally done by hand. Avoid marketing copy that says "hecho a mano" / "tejido a mano" / "handmade" for the whole product. Use "confeccionado", "taller", "artesanal", "tejido de punto". The one place "todo hecho a mano" is kept is `proceso_4_desc` because it specifically describes the finishing step.
- Classic `<script>` loading order matters: inline `TWEAK_DEFAULTS` → `/i18n.js` → `/app.js`. Each later script reads globals declared by earlier ones. Do not convert any of these to ES modules without also setting up explicit imports.
