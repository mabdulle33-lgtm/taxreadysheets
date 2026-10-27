# TaxReadySheets

**Free UK tax calculators for the self-employed** — a fast static website whose job is to win Google traffic and send visitors to the [TaxReadySheets Etsy shop](https://www.etsy.com/shop/TaxReadySheets).

Live address: <https://mabdulle33-lgtm.github.io/taxreadysheets/>

- Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no dependencies, no external scripts, fonts or CDNs.
- No cookies, trackers, analytics or ads. Calculators run in the visitor's browser; nothing they type is sent anywhere.
- All rates live in **one file**; all Etsy links live in **one file**; the base URL and email settings live in **one file**.

## What's in the repo

```
index.html                      Home page
calculators/                    One folder per calculator (14) + an index page
guides/                         Guides index + 3 articles
about/, privacy/, 404.html      Other pages
assets/css/style.css            The only stylesheet
assets/js/rates-2026-27.js      ★ Every tax rate and threshold
assets/js/products.js           ★ Every Etsy product link
assets/js/site-config.js        ★ Base URL, Etsy shop URL, MAILERLITE_FORM_ACTION
assets/js/calc.js               All calculation logic as pure functions
assets/js/ui.js                 Small DOM helpers (read form, write results)
assets/js/site.js               Runs on every page: product boxes + sign-up box
assets/js/pages/*.js            One small script per calculator page
assets/og-image.png             Social sharing image
favicon.svg, sitemap.xml, robots.txt, .nojekyll
tests/calc.test.js              Hand-checked worked examples and edge cases
tests/site.test.js              Meta tags, internal links, JSON-LD, sitemap checks
tools/set-base-url.mjs          Rewrites the base URL in every page if you move the site
```

### The 14 calculators

| Page | Etsy product |
|---|---|
| `calculators/self-employed-tax-calculator/` | Sole trader bookkeeping |
| `calculators/cis-tax-refund-calculator/` | CIS tax refund tracker |
| `calculators/hair-beauty-price-calculator/` | Beauty business |
| `calculators/cleaning-price-calculator/` | Cleaning business |
| `calculators/dog-walking-price-calculator/` | Dog walker |
| `calculators/vinted-ebay-hmrc-checker/` | Vinted/reseller |
| `calculators/childminder-tax-calculator/` | Childminder |
| `calculators/landlord-tax-calculator/` | Landlord (also covers its MTD check) |
| `calculators/airbnb-rent-a-room-calculator/` | Airbnb host |
| `calculators/taxi-delivery-driver-tax-calculator/` | Taxi/Uber/delivery driver |
| `calculators/mileage-claim-calculator/` | Mileage log |
| `calculators/tutor-hourly-rate-calculator/` | Tutor |
| `calculators/universal-credit-reporting-dates/` | Universal Credit self-employed |
| `calculators/making-tax-digital-checker/` | Sole trader bookkeeping |

## Run the tests

You need Node.js 20 or newer (nothing to install):

```sh
node --test          # or: npm test
```

`tests/calc.test.js` checks every calculator against worked examples calculated by hand, plus edge cases (blank, zero and negative input, the personal allowance taper, Scotland, profits above £50,270, CIS refund vs amount owed, Universal Credit start days 29–31, MTD thresholds). `tests/site.test.js` checks that every page has a unique title, description and canonical URL, Open Graph tags and one `<h1>`; that every internal link and asset resolves; that JSON-LD parses; that each calculator page has its FAQs (matching FAQPage JSON-LD), worked example, explanation, "checked for 2026/27" note, disclaimer, product box and sign-up box; that the sitemap matches the pages; and that no script uses cookies or storage or hard-codes a tax rate.

## Preview locally

The pages use JavaScript modules, which browsers won't run from a double-clicked file. From the repo folder run:

```sh
python3 -m http.server 8000
```

then open <http://localhost:8000/>.

## How to update the rates (e.g. after the Budget on 28 October 2026)

1. Open `assets/js/rates-2026-27.js`. Every figure is there with a comment and a GOV.UK source.
2. Change the figures that moved. Income tax band limits are **taxable income** (after the personal allowance) — the comment on each band shows the gross figure. Example: if the basic rate band became £38,000, change `upTo: 37700` to `upTo: 38000`.
3. Change `LAST_CHECKED` at the top. (This date is also printed in each page's "Checked for 2026/27" note and footer; to update those too, search and replace `27 October 2026` across the `.html` files.)
4. Run `node --test`. Tests in `tests/calc.test.js` that use the old figures will fail and show you the new numbers — update the expected values after checking them by hand, and update the matching worked example text on that calculator's page.
5. Commit and push.

For a **new tax year**, copy the file to e.g. `rates-2027-28.js`, update it, and change the one `import` line at the top of `assets/js/calc.js` to point at the new file. Then update the "2026/27" wording in page titles and text (search and replace).

## How to change product links

Edit `assets/js/products.js`. Each product has an Etsy listing `id` (the number in `https://www.etsy.com/listing/ID`), a `title` and a `blurb`. Product boxes are filled from this file when the page loads, so a change here updates every page.

(Each page's HTML also contains a copy of its product's text and link as a fallback for visitors with JavaScript turned off; the script replaces it. If you change a listing for good, it's tidy — but not essential — to search and replace the old ID in the `.html` files too.)

To point a calculator at a **different** product, change `data-product="…"` on its `<aside class="product">` to another key from `products.js`.

The shop URL is `etsyShopUrl` in `assets/js/site-config.js`.

## Email sign-up (MailerLite)

The "Free UK tax deadline reminders" box on the home page and every calculator page is **connected**: `MAILERLITE_FORM_ACTION` in `assets/js/site-config.js` holds the MailerLite form URL.

How it works:

- A plain HTML form posts `fields[email]`, `ml-submit=1` and `anticsrf=true` to that URL. MailerLite's `universal.js` is **not** loaded, and no MailerLite code runs until someone presses the button.
- `assets/js/site.js` sends the form with `fetch` (`POST`, `mode: 'no-cors'`, `FormData`) so the visitor stays on the page, then shows "Thanks! Check your inbox to confirm."
- If that fails, it falls back to a normal form POST to the same URL in a new tab (`target="_blank"`).
- A hidden honeypot field (no `name`, so it is never sent) catches bots: if it has been filled in, nothing is sent.
- A consent line sits under the field and links to the Privacy page.

To change or switch it off:

- **Use a different form:** paste its action URL (`https://assets.mailerlite.com/jsonp/…/subscribe`) into `MAILERLITE_FORM_ACTION`. If its email field isn't called `fields[email]`, change `MAILERLITE_EMAIL_FIELD` too.
- **Turn it off:** set `MAILERLITE_FORM_ACTION = ''`. Every box then shows a button to the Etsy shop instead.

The page HTML also holds a copy of the form action for visitors without JavaScript. If you change the URL, search and replace it in the `.html` files as well (the script keeps JavaScript users right either way).

Keep double opt-in switched on in MailerLite so the confirmation email does the verification.

## How to add a calculator

1. **Logic** — add a pure function to `assets/js/calc.js` that takes plain values and returns an object. Read any rates from `RATES`; never type a rate into the function.
2. **Tests** — add a `test(...)` to `tests/calc.test.js` with a worked example you've checked by hand and a few edge cases (blank, zero, negative).
3. **Page** — copy a similar folder in `calculators/` (e.g. `calculators/mileage-claim-calculator/`) to `calculators/your-new-slug/` and edit `index.html`:
   - `<title>`, meta description, canonical URL and `og:` tags (keep them unique),
   - the `<h1>`, intro, form fields (each input needs a `<label for>`), results (`data-out="key"` elements),
   - the worked example, explanation and FAQs — **and the FAQPage JSON-LD in the `<head>` must match the visible FAQs**,
   - `data-product="…"` on the product box,
   - the `<script type="module" src="../../assets/js/pages/…">` line.
4. **Page script** — copy `assets/js/pages/mileage.js` to a new file. It calls `bindForm('calc', values => …)` and writes results with `setOuts({ key: text })`.
5. **Links** — add a card to `index.html` and `calculators/index.html`, a `<url>` to `sitemap.xml`, and links from one or two related calculators.
6. Run `node --test` — it will flag missing tags, broken links or a sitemap mismatch.

## How to switch on GitHub Pages

1. On GitHub open the repo → **Settings** → **Pages**.
2. Under **Build and deployment** choose **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and **Save**.
3. After a minute or two the site is live at <https://mabdulle33-lgtm.github.io/taxreadysheets/>.
4. Add the site to [Google Search Console](https://search.google.com/search-console) as a URL-prefix property and submit `https://mabdulle33-lgtm.github.io/taxreadysheets/sitemap.xml`.

### Moving to your own domain later

Change `baseUrl` in `assets/js/site-config.js`, then run `node tools/set-base-url.mjs`. It rewrites the canonical and Open Graph URLs, JSON-LD, the 404 page's `<base>`, `sitemap.xml` and `robots.txt`. Add the domain under Settings → Pages.

## Decisions made (and why)

- **Base URL in one file, but also in the HTML.** Search engines need canonical/Open Graph URLs, the sitemap and robots.txt as plain text, so they can't be filled by JavaScript. `site-config.js` holds the master copy, `tools/set-base-url.mjs` rewrites the rest in one command, and a test fails if any page disagrees with the config.
- **Pretty URLs** (`calculators/landlord-tax-calculator/`) with `index.html` in each folder. All links are relative, so the site works under `/taxreadysheets/` and on a future custom domain.
- **404 page** uses a `<base href>` set to the site URL, because GitHub Pages serves it at whatever broken address was requested, where relative links would otherwise break.
- **robots.txt** is included as requested, but note that search engines only read robots.txt at a domain's root, so on a `github.io/taxreadysheets/` project site it is ignored — submit the sitemap in Search Console instead. It becomes effective if you move to your own domain.
- **ES modules**, not one big script: each page loads only `site.js` plus its own small script. Total JS per page is roughly 20–30 KB uncompressed, with no third-party code.
- **Income tax bands are stored as taxable income** (as HMRC defines them), so the £100k personal allowance taper works correctly with the higher and additional rate bands.
- **Self-employed tax with a job**: salary is taxed first and uses the personal allowance; the calculator shows only the *extra* tax from self-employment, assuming PAYE has dealt with the salary. Payments on account use the HMRC test (bill over £1,000 and under 80% collected at source).
- **Losses** are floored at £0 profit (no loss relief modelling) and the page says so.
- **Trading allowance auto-pick**: the allowance and expenses are compared and the lower profit used, with an option to force either.
- **CIS**: if "CIS deducted" is left blank it is estimated from labour (gross minus materials) at 20%/30%; a typed 0 means gross payment status.
- **Landlords 2027/28**: the new 22%/42%/47% property rates and 22% finance cost credit are applied for England and Northern Ireland. Wales and Scotland keep today's rates in the comparison (their governments set their own) and the page says so. Bands and allowances are assumed frozen for 2027/28. Property income is taxed after other income (the personal allowance is used by salary/trading income first).
- **Rent a Room vs property allowance vs expenses**: the option with the lowest taxable profit is highlighted. Mortgage interest on a separate let is left to the landlord calculator.
- **Drivers**: the method with the lower tax bill wins. "Cash left" deducts your real vehicle spending whichever method you claim.
- **Universal Credit**: the assessment period starting on day 29–31 starts on the last day of shorter months; report window is 7 days before the period ends to 14 days after; dates are calculated in UTC to avoid clock-change bugs. Payment is shown as "around 7 days after the period ends".
- **Making Tax Digital**: "over" a threshold means strictly more than it (exactly £50,000 is not in for April 2026). Blank later years are assumed equal to the year before.
- **Platform reporting**: shown as reported at 30+ sales *or* £1,700+ (the sterling estimate of €2,000) in a calendar year, with a clear note that reporting is not a tax.
- **Pricing calculators** round prices up to the next whole pound (50p per dog/pet for pet care) and show break-even separately.
- **Faceless brand**: no personal names; worked examples use fictional first names only.
- **The email form** posts directly to MailerLite with `fetch` (no third-party script). Visitors without JavaScript get a normal form post in a new tab.
