# Nexmio layout (PoC)

The reference lives in `brand/preview/site/`. Open `site/index.html` through a local server.
Every Nexmio site and app follows the same structure. Only the colour and the content change.

## Colours and roles

| Colour | Role | Motif |
|--------|------|-------|
| Yellow | nexmio.com (main site) | silk waves |
| Purple | Nexmio Work | hexagons |
| Green | Nexmio Family | slanted glass blocks |
| Blue | placeholder product (parked) | low-poly mountains |
| Red | placeholder product (parked) | glass circles |

Set the colour with `data-brand="yellow|purple|green|blue|red"` and the mode with `data-mode="dark|light"` on `<html>`.
All colours are variables in `brand/preview/brand.css` (`--g1`, `--g2`, `--bg`, `--surface`, `--text` and so on).

## Page structure (top to bottom)

1. **Background layer** (fixed, behind everything): `site-bg-native-<mode>` plus a glow that follows the mouse.
2. **Navigation** (sticky), identical on every page:
   - logo with the product tag on the left
   - the page's own anchor links (see below)
   - on product pages only: one `← nexmio.com` link back to the main site
   - language button (EN / DA) and light/dark button on the right
3. **Hero** (glass panel): status badge, large logo, headline, one line of text, two buttons.
4. **Sections**, each with an `eyebrow`, a `sec-title`, an optional `lead` and content:
   - `steps` (four steps), `cards` with `feature` or `product`, `split` with two `panel`s, download cards
5. **CTA box** with a glow at the bottom.
6. **Footer**: logo and tagline, Products, Nexmio, Project.

### Menu items

- Main site: `Products`, `About me` (more can be added later).
- Every product page: `How it works`, `Features`, `Download`.

Anchor ids are English: `products`, `about`, `thinking`, `principles`, `contact`, `how-it-works`, `features`, `files`, `privacy`, `download`.

## Logo

- The N mark is `img/<colour>/mark.png`. "exmio" is **text** in Poppins 600, never an image.
- The product name (Work, Family and so on) is a small **tag** in the product's own colour (`.tag`), never part of an image.
- The mark is `.74em` high and sits on the text baseline.

## Languages

- English is the default; Danish is available through the language button. The choice is remembered.
- Write text with `<span data-l="en">…</span><span data-l="da">…</span>`. CSS shows only the active language.
- `brand/tools/build_site.py` writes both languages with `T(english, danish)`.

## Website of an app

The standard for an app's own site (sections, files, rules) is `brand/APP-SITE.md`, with a ready template in `brand/templates/app-site/`.

## Motion

Slow drift of the background, a glow that follows the mouse, reveal on scroll and hover glow on cards. Everything switches off when the system asks for reduced motion.

## Files

- `site.css` and `site.js` are shared by all pages. Each page only holds its own content.
- Images are in `brand/preview/img/<colour>/` (generate with `python3 brand/tools/process_assets.py <colour>`, add `--all` for icon sizes and app/desktop backgrounds). Sources are in `brand/assets/<colour>/`.
- Regenerate the pages with `python3 brand/tools/build_site.py`.

## Web app and desktop app

Use the same tokens and the same logo. The background is `app-bg-<mode>` or `desktop-bg-<mode>` and has no motion (or only very faint motion).

## Using the brand kit in a product

Run `python3 brand/tools/export_brand.py <product-folder> [colours...]` from the control repo.
It writes a self-contained copy into `<product-folder>/brand/` (marked with `.nexmio-brand`) and touches nothing else.
Do not edit that folder in the product; change the source here and export again.
The product builds its real pages from `brand/preview/site/` and references `brand/preview/brand.css` and `brand/preview/img/<colour>/`.
