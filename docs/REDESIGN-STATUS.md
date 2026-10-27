# Redesign: where things stand

Branch `redesign`. Do not merge into `main` until the owner has looked at the screenshots.

## Done
- New design system in `assets/css/style.css`: light and dark tokens, self-hosted Inter font (`assets/fonts/`), print stylesheet, rules that respect reduced motion.
- Sticky header with a mobile menu and a light/dark toggle. The theme choice is saved in localStorage under `trs-theme` (`assets/js/theme-init.js` and `site.js`).
- Home page: quick tax estimate, trust strip, trade picker with search (`finder.js`), next-deadline countdown (`deadlines.js`), "How it works", product cards, guides preview.
- Calculator pages: sticky results card, sliders, inline help, donut charts (`chart.js`), Copy / Share link / Print / Reset buttons (`calc-tools.js`, `share.js`), related calculators as cards with icons.
- Guides: reading time and a table of contents.
- Icons live in `assets/js/icons.js`. The pages hold inline copies, and a test checks that the copies match.
- Tests: `node --test` → 89 pass (the original 70 plus the new `tests/redesign.test.js`). One original test now allows storage, but only for the theme key.
- Browser checks passed: every page at 390px and 1280px in light and dark, share links on all 14 calculators, and an axe-core accessibility run with 0 violations.
- Before and after screenshots are in `docs/redesign-screenshots/`.

## Still to do
1. Add a short "Design system" section to the README.
2. Give the full-page after screenshots a final visual review.
3. Delete `docs/redesign-tools/` and this file before merging. They are only working notes.

## Working tools (docs/redesign-tools/)
- `migrate.mjs` rebuilds every HTML page from the pre-redesign commit `061313e`. Edit the templates in it and run it again; don't hand-edit the generated pages.
- `check.cjs`, `interact.cjs`, `shareall.cjs`, `axe.cjs` and `shots.cjs` are the Playwright checks. Start a local server with `python3 -m http.server 8765` first. `axe.cjs` expects axe-core unpacked next to it in `axe/package/` (from `npm pack axe-core@4.10.2`).
