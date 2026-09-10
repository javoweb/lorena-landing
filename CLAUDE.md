# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

Static marketing site for **Tejidos Lorena** (Ecuadorian knitwear workshop). `404.html` is a matching not-found page. No build step, no package manager, no test suite. `assets/` holds product images.

### Image optimization — manual WebP via `<picture>`

Content images ship as `<picture>` with a WebP source + PNG/JPG fallback. Conversions are generated locally with `cwebp` (from `brew install webp`) and committed to the repo.

**Why not Vercel Image Optimization?** Because it's a framework-driven feature — the `<Image>` components in Next.js/Astro/Nuxt construct `/_vercel/image?...` URLs that are accepted by the platform. For **plain static HTML without a framework, this path is not supported**: the `images` config in `vercel.json` is not read, `localPatterns` is a Next.js-only construct, and manually crafting `/_vercel/image?url=...` URLs returns `INVALID_IMAGE_OPTIMIZE_REQUEST`. The Vercel docs direct non-framework users to the Build Output API, which requires a build step. Given the site is intentionally build-step-free, manual WebP with `<picture>` is the sustainable path.

**Workflow to add a new content image:**

1. Drop the source in `assets/images/foo.png` (or `.jpg`).
2. Generate the WebP: `cwebp -q 82 assets/images/foo.png -o assets/images/foo.webp`
3. Reference with `<picture>`:

    ```html
    <picture>
      <source srcset="/assets/images/foo.webp" type="image/webp">
      <img src="/assets/images/foo.png" alt="...">
    </picture>
    ```

**When the product gallery fills up** (e.g. 30+ images), add a tiny batch script `scripts/optimize-images.sh` that runs `cwebp` over every PNG/JPG under `assets/images/` that doesn't yet have a sibling `.webp`. Call it before commit or from a git `pre-commit` hook. Never regenerate existing WebPs in place — the conversion is deterministic so the output wouldn't change, but it saves build time.

`picture { display: contents; }` in `styles.css` keeps the wrapper transparent to layout so existing `img` selectors still match.

`og-image.jpg` stays as JPG — social crawlers want a static URL with a known format, not a picture-element fallback.

**LCP**: the hero preloads the WebP directly via `<link rel="preload" as="image" type="image/webp">`. Browsers without WebP support (~<2% globally) fall back to the PNG via `<picture>`.

The homepage is split across four repo-root files:

- **`index.html`** — structure only (head metadata, body markup). The `<style>` block is gone; CSS is linked externally. The external scripts `/i18n.js` and `/app.js` are loaded in `<head>` with the `defer` attribute — they download in parallel with HTML parse and execute in document order after parse completes (but before `DOMContentLoaded`).
- **`styles.css`** — all CSS (color tokens, layout, responsive breakpoints at 900px and 600px).
- **`i18n.js`** — declares `const i18n = { es: {…}, en: {…} }` in the global script scope. No side effects.
- **`app.js`** — consumes `i18n` from the shared global scope. Owns all DOM wiring: `applyContent`/`applyDensity`, language and density event handlers, `applyAll()` call at end.

Other repo-root static files: `favicon.svg`, `og-image.jpg` (1200×630 social card — generated from `og-card.html`), `robots.txt`, `sitemap.xml`.

`og-card.html` is the source template for the social card. It lives in the repo for editability but is excluded from Vercel deployment via `.vercelignore` — so `www.tejidoslorena.com/og-card` returns 404. Also carries a `noindex` meta tag as a belt-and-suspenders fallback.

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

Production domain is **www.tejidoslorena.com** — the `www` subdomain is canonical; the apex `tejidoslorena.com` should redirect to it (configure in Vercel dashboard → Domains). All metadata URLs (`og:url`, `canonical`, `sitemap.xml`, JSON-LD `url`/`image`/`logo`) use `https://www.tejidoslorena.com`.

Hosting is static on Vercel (`.vercel/project.json` — project `lorena-landing`, linked but gitignored). Deploy config is in `vercel.json`: clean URLs (no `.html`, no trailing slash), 1-year immutable cache for `/assets/*`, 1-week cache for `favicon.svg` / `og-image.jpg`, 1-hour must-revalidate for `*.css` / `*.js` (no hash-busting yet), no-cache for HTML, and no `X-Frame-Options` / frame-ancestors CSP set (a leftover from when the site ran inside a parent-frame editor — that integration is gone, so these could be tightened if desired).

## Commands

No npm/yarn — there is nothing to install or compile. To work on the site:

- **Local development**: `vercel dev` (serves the site locally using the linked Vercel project config).
- **Local preview (no Vercel)**: open `index.html` directly in a browser, or `python3 -m http.server` from the repo root.
- **Deploy preview**: `vercel` (uses the linked project).
- **Deploy production**: `vercel --prod`.

## Architecture you need to know before editing

### Color system ("Andean Earth")
One fixed palette, defined as CSS custom properties under `:root` in `styles.css` — no theme switching. **All colors must go through `var(--bg)`, `var(--fg)`, `var(--accent)`, etc.** Adding a hex color directly bypasses the token system. The base tokens (`--stone`, `--ink`, `--bone`, `--mute`, `--line`) are sampled from the actual product-catalog photography and color swatches. Four accent tokens (`--accent-mustard`, `--accent-teal`, `--accent-maroon`, `--accent-olive`) exist alongside the generic `--accent`, and individual sections re-scope `--accent` to one of them (e.g. `.historia { --accent: var(--accent-teal); }`) so each part of the page carries a distinct accent rather than one page-wide color.

The `404.html` uses its own CSS-only `@media (prefers-color-scheme: dark)` block since it has no JS and isn't wired to the site's token system.

### i18n (`data-i18n` attributes + `i18n` dictionary)
Text is keyed. An element like `<h1 data-i18n="hero_h1_1">Tradición</h1>` gets its `innerHTML` replaced from `i18n[lang][key]` on language switch. The `i18n` object lives in **`/i18n.js`** and has exactly two locales: `es` and `en`. **When adding translatable copy, you must add the key to both `es` and `en` — forgetting one leaves stale text on switch.** HTML (e.g. `<em>`) is allowed in values; `innerHTML` is used, not `textContent`.

### Gallery density
`#galeria-grid` carries one of `dense-low` / `dense-med` / `dense-high`, controlled by the `#density-public` buttons in the gallery header (wired through the `[data-density]` handler in `app.js`).

## Conventions

- Spanish is the source-of-truth for copy; English is the translation. Business terminology (Stoll machines, Otavalo, ugly sweaters, MOQ) should stay consistent across locales.
- **Factual accuracy about production**: the site is an artisan workshop but the **knitting itself is machine-made** (Stoll flat knitting machines). Only the finishing step — linking, stitching, edges, inspection — is literally done by hand. Avoid marketing copy that says "hecho a mano" / "tejido a mano" / "handmade" for the whole product. Use "confeccionado", "taller", "artesanal", "tejido de punto". The one place "todo hecho a mano" is kept is `proceso_4_desc` because it specifically describes the finishing step.
- Classic `<script>` load order in `index.html`: deferred `/i18n.js` and `/app.js` are both in `<head>`, executing in that order after HTML parse completes. Both are classic scripts sharing the global lexical scope — do not convert to ES modules without setting up explicit imports, since `app.js` reads the `i18n` global declared by `i18n.js`.
