# Standard for the website of a Nexmio app

Every app (Nexmio Work, Nexmio Family, later others) gets its own website at `<product>.nexmio.com`, built the same way. The reference is the real Nexmio Work site. This file says what the standard is, and `templates/app-site/` gives a ready first version.

## Start a new app site

From the product's own session (never from the control repo), in the product's root folder:

```bash
python3 brand/templates/app-site/init_site.py --colour green --name "Nexmio Family" --tag Family \
    --repo family.nexmio.com --domain family.nexmio.com --licence "<licence line for the footer>"
```

This writes `site/` (pages, css, js, images), `site/CNAME` and `.github/workflows/pages.yml`, and refuses to run if `site/` exists.
Then replace every `TODO` in `site/index.html` and `site/privacy.html`, add screenshots and `img/og.png` (1200x630), and enable GitHub Pages (Settings, Pages, Source: GitHub Actions).

## What the standard fixes

| Part | Rule |
|------|------|
| Colour | `data-brand` on `<html>` is the product's colour (purple Work, green Family). Never another colour. |
| Files | `site/` holds the whole site: `index.html`, `privacy.html`, `site.css`, `site.js`, `brand.css`, `config.js`, `downloads.js`, `lightbox.css/js`, `thread.css`, `img/`, `CNAME`. Plain static files, no build step. |
| Shared files | `brand.css`, `site.css`, `site.js`, `thread.css`, `lightbox.*` come from the template and are kept identical across apps. A change that every app should have is made in the control repo's template and exported again. The product only edits `index.html`, `privacy.html`, `config.js`, `img/`. |
| Logo | N mark image, the text "exmio" and a small coloured tag (`data-tag`). The product name is never baked into an image. |
| Menu | Same everywhere: How it works, Features, Download, Support, plus the back link `← nexmio.com`, the light/dark button. |
| Sections, in order | Hero, (optional thread), How it works (four steps), Features (cards with optional screenshots), Privacy, Download (Stable and Preview), Support, and the closing "Part of the Nexmio family" box. |
| Anchor ids | English: `how-it-works`, `features`, `privacy`, `download`, `support`, `contact` (and `files`, `developers` when used). |
| Download | The buttons follow the GitHub releases through `downloads.js`; the Store button appears when `config.js` has the Store address. Nothing is edited per release. |
| Screenshots | `<img class="shot">` gets the lightbox. Always give an `alt` text. |
| Privacy | `privacy.html` is required (the Microsoft Store asks for it). It must say only what is true for the app. |
| Hosting | GitHub Pages from `site/` through `.github/workflows/pages.yml`. `CNAME` holds the domain. |
| Language | Work's site is English only. The main site is English with a Danish toggle. For a new app, decide this first; the toggle code is in `nexmio.com/site.js`. |
| Motion | Background drift, mouse glow and reveal on scroll are built in and switch off for reduced motion. |

## Writing the content

- Write for a person who has never heard of the app. One idea per sentence.
- The headline says what the person gets, not what the app is made of.
- Four steps, four to six feature cards, every claim true today. Do not describe features that do not exist.
- English in git, sentence case in buttons and labels.
- Nothing about the control repo, no secrets, no local paths.

## Checklist before the first commit

1. No `TODO` is left (`grep -rn TODO site`).
2. Every image has an `alt`, `og.png` exists, the favicon shows.
3. Light and dark both look right, and a phone width works (no sideways scroll).
4. The download buttons point at the right repo.
5. `privacy.html` matches what the app does.
6. `./nx check` in the control repo reports the right colour.
