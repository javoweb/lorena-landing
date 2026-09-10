# Tejidos Lorena — Visual + Content Redesign

Date: 2026-09-10
Status: Approved by user, pending implementation

## Source material

Dropped in `tmp/` (gitignored, not shipped):
- `CATÁLOGO LORENA 2026.pdf` — 22-page product catalog, 11+ products with model photography, flat product shots, prices ($18–24, wholesale — **not** shown on site), and a shared 20-color swatch system.
- `MARCA LORENA svg.svg` — vector logo (icon/flourish + "LORENA" wordmark + "DESDE 1978" line), heavily padded viewBox (`0 0 1366.3 629.29`, mark occupies roughly the left two-thirds).
- `WhatsApp Image ....jpeg` — rendered preview of the same logo, reference only.

Rendered catalog pages live at `tmp/pdf_pages/page_NN.png` (generated via a native Quartz/PyObjC script — no external deps needed). Re-render at higher scale (3–4×) before cropping product photos for actual site assets, since the current 1.5× render is only good enough for review.

## Founding year correction

Current site says "1975" everywhere (hero meta, footer, JSON-LD `foundingDate`). The new logo says "1978". **1978 is correct** — update every occurrence:
- `index.html`: `hero_meta` copy, footer copyright line, JSON-LD `foundingDate`
- `i18n.js`: any `es`/`en` string mentioning "1975" or the founding year
- `historia_years` ("50+") stays as an approximate rounded figure (2026 − 1978 = 48) — no change needed, it already reads as "50+" not "51+".

## Logo

- Recompute the SVG's `viewBox` to the actual path bounding box — a pure crop, no redraw or path edits.
- The source file bundles two visually distinct groups: the ornamental vine/leaf flourish (top-left) and the "LORENA" + "DESDE 1978" wordmark. Split these into two derived assets:
  - `assets/images/logo-mark.svg` — flourish icon only, tightly cropped. Used as the small nav icon (replaces the current hand-coded generic leaf `<svg>` in `index.html`) and as `favicon.svg`.
  - `assets/images/logo-full.svg` — full lockup (icon + wordmark), tightly cropped. Used in `og-card.html` and anywhere the full brand lockup is wanted (e.g. footer, if desired).
- Nav keeps its current icon + text lockup structure — `logo-mark.svg` replaces the inline placeholder icon, and the text stays `Lorena` / sub-label, with the sub-label text changed from **"Original Design" → "Desde 1978"**.

## Color system — "Andean Earth"

Replace the `cream` / `dark` / `teal` theme-switcher with a single fixed palette:
- `--bg`: warm oatmeal/stone (`#ede7dc`-ish)
- `--fg`: soft near-black (`#2a2620`)
- Four rotating accent tones as CSS custom properties, pulled from the catalog's swatch system, each scoped to a section rather than one page-wide accent:
  - `--accent-mustard` (`#c9932e`-ish) → hero, primary CTAs
  - `--accent-teal` (`#1f6b5c`-ish) → historia
  - `--accent-maroon` (`#7a1f2b`-ish) → proceso
  - `--accent-olive` (`#4a4a35`-ish) → galería, contacto
- Exact hex values to be sampled from the actual swatch crops in the catalog pages during implementation, not guessed.

## Harness contract change (deliberate, breaking)

Per user decision: **remove theme switching entirely.**
- Drop `theme` from `TWEAK_DEFAULTS` in `index.html`'s `/*EDITMODE-BEGIN*/…/*EDITMODE-END*/` block.
- Remove the theme-swatch buttons from `#tweaks`.
- Remove `[data-theme="..."]` CSS blocks from `styles.css`.
- Remove the OS dark-mode `matchMedia` follow script in `<head>` and the corresponding listener/`themeUserPicked` logic in `app.js` — moot with one fixed palette.
- `density`, `copyTone`, `language` keys and behavior are unaffected.
- This is a known, intentional break of the parent edit-mode harness's theme contract — not an oversight.

## Hero

- Replace the displayed hero image with a stronger catalog shot (Poncho Victoria or Poncho Lorena — clear garment detail, good outdoor light), following the existing `<picture>` + `rel=preload` WebP pattern.
- **Keep the current `poncho-hero.png` / `poncho-hero.webp` files in `assets/images/` untouched** (rollback safety net) — the new hero image ships under new filenames (e.g. `hero-victoria.png/.webp`).

## Proceso section

Replace the 4 `IMG · ...` text placeholders (`proceso_1..4`) with cropped workshop-background details — looms, gears, machinery visible behind models and on the PONCHOS/SACOS divider pages — cropped tight on texture/machinery, not on the models. One crop per step, in step order (fibras → diseño → tejido → acabados).

## Gallery — 11 real products

Replace all 12 placeholder `.gal-item` entries with 11 real products, chosen for variety across ponchos and sacos/chompas:

Ponchos: Diana, Bordado, Flor, Lorena, Victoria, Lluvia
Sacos/Chompas: Cristal, Alexandra, Sacón María, Saco Bordado, Chompa Belén

Each card: cropped model (or best flat-lay) photo as primary image, product name as `data-i18n` label (proper noun — identical `es`/`en` string, added to both dictionaries), and a small strip of 4–6 representative color swatches (not the full 20). **No prices.**

## Asset pipeline

1. Re-render catalog pages at higher scale (3–4×) via the existing Quartz/PyObjC script.
2. Crop per-product photo regions with `sips`/Python (coordinates determined per page during implementation).
3. Convert each to WebP via `cwebp -q 82` per the existing documented convention in `CLAUDE.md`, committed alongside PNG fallbacks.
4. Regenerate `og-image.jpg` from `og-card.html` using the documented headless-Chrome one-liner, updated to the new logo/palette.
5. `tmp/` stays gitignored — none of the source PDF/SVG/JPEG ship; only derived, cropped/converted assets land in `assets/images/`.

## i18n

- Add product name keys (identical in `es`/`en`) to `i18n.js`.
- Update the founding-year string(s) in both locales.
- `copyTones` (`warm`/`direct`) untouched — they don't reference product data.

## Out of scope

- No per-product detail pages or expandable cards — gallery stays a grid of image + name + swatches linking out to WhatsApp, same interaction model as today.
- No changes to `404.html` beyond anything required for consistency with the new logo/palette (evaluate at implementation time; not a primary target).
