# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

Static marketing site for **Tejidos Lorena** (Ecuadorian knitwear workshop). The homepage lives in `index.html` (~1,000 lines, HTML + inline `<style>` + inline `<script>`) and `404.html` is a matching not-found page. No build step, no package manager, no test suite. `assets/` holds the hero image; `uploads/` holds pasted screenshots.

Production domain is **tejidoslorena.com** (used in `og:url`, `canonical`, `sitemap.xml`, and the JSON-LD `LocalBusiness` schema in `index.html`'s `<head>`). Repo-root static files: `favicon.svg`, `og-image.jpg` (1200×630 social card), `robots.txt`, `sitemap.xml`.

Hosting is static on Vercel (`.vercel/project.json` — project `lorena-landing`, linked but gitignored). Deploy config is in `vercel.json`: clean URLs (no `.html`, no trailing slash), 1-year immutable cache for `/assets/*` and `/uploads/*`, 1-week cache for `favicon.svg` / `og-image.jpg`, no-cache for HTML, and iframe-safe security headers (no `X-Frame-Options` / frame-ancestors CSP — the edit-mode harness embeds the site in a parent frame).

## Commands

No npm/yarn — there is nothing to install or compile. To work on the site:

- **Local development**: `vercel dev` (serves the site locally using the linked Vercel project config).
- **Local preview (no Vercel)**: open `index.html` directly in a browser, or `python3 -m http.server` from the repo root.
- **Deploy preview**: `vercel` (uses the linked project).
- **Deploy production**: `vercel --prod`.

## Architecture you need to know before editing

### Theming (`data-theme` on `<body>`)
Three themes — `cream` (default), `dark`, `teal` — are all defined in the top `<style>` block as CSS custom-property overrides under `[data-theme="..."]` selectors. **All colors must go through `var(--bg)`, `var(--fg)`, `var(--accent)`, etc.** Adding a hex color directly breaks theme switching. When adding a new themed surface, add the variable under `:root` and override it in each `[data-theme=...]` block.

### i18n (`data-i18n` attributes + `i18n` dictionary)
Text is keyed. An element like `<h1 data-i18n="hero_h1_1">Tradición</h1>` gets its `innerHTML` replaced from `i18n[lang][key]` on language switch. The `i18n` object lives inside the inline `<script>` and has exactly two locales: `es` and `en`. **When adding translatable copy, you must add the key to both `es` and `en` — forgetting one leaves stale text on switch.** HTML (e.g. `<em>`) is allowed in values; `innerHTML` is used, not `textContent`.

### Copy tones (Spanish only)
`copyTones.warm` and `copyTones.direct` are partial override dictionaries that merge on top of `i18n.es` when `state.copyTone !== 'editorial'`. They intentionally cover only a few hero/contact keys. English has no tone variants — tone state is ignored when `lang === 'en'`.

### Edit-mode / tweaks panel integration
The site is designed to run inside a parent-frame editor. The inline script:
1. Posts `{ type: '__edit_mode_available' }` to `window.parent` on load.
2. Listens for `__activate_edit_mode` / `__deactivate_edit_mode` to show/hide the `#tweaks` panel.
3. On every tweak change (theme, density, language, copyTone) posts `{ type: '__edit_mode_set_keys', edits: {...state} }`.

The block between `/*EDITMODE-BEGIN*/` and `/*EDITMODE-END*/` defines `TWEAK_DEFAULTS` — the authoritative shape of editable state. The parent harness may rewrite this block. **Preserve the sentinel comments and the object shape exactly**; do not move defaults elsewhere or rename keys without understanding the harness contract.

### Gallery density
`#galeria-grid` carries one of `dense-low` / `dense-med` / `dense-high`. Density buttons exist in two places (`#density-public` and `#density-tweaks`) — both are wired through the same `[data-density]` handler, so new density controls just need the attribute.

## Conventions

- Spanish is the source-of-truth for copy; English is the translation. Business terminology (Stoll machines, Otavalo, ugly sweaters, MOQ) should stay consistent across locales.
- The site is single-file by design — resist extracting CSS/JS into separate files unless explicitly asked. The edit-mode harness expects inline.
