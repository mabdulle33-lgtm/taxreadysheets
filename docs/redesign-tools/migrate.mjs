// One-off redesign migration. Reads each page from the pre-redesign commit and
// writes the new markup. Safe to re-run.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd(); // run from the repo root
const BASE = '061313e';
const { icon } = await import(join(ROOT, 'assets/js/icons.js') + `?t=${Date.now()}`);
const { PRODUCTS } = await import(join(ROOT, 'assets/js/products.js'));

const orig = (rel) => execSync(`git show ${BASE}:${rel}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24 });
const write = (rel, s) => writeFileSync(join(ROOT, rel), s);
const ico = (n, cls = 'icon') => icon(n, cls);

/* ------------------------------------------------------------------ data */

const CALCS = [
  { slug: 'self-employed-tax-calculator', icon: 'briefcase', title: 'Self-employed tax & take-home calculator', desc: 'Income tax, Class 4 NI, take-home pay and how much to put aside each month.', group: 'For every sole trader', trades: 'all', kw: 'sole trader freelancer income tax national insurance class 4 take home set aside self assessment' },
  { slug: 'making-tax-digital-checker', icon: 'laptop', title: 'Making Tax Digital checker', desc: 'Find out if and when MTD for Income Tax applies to you: 2026, 2027 or 2028.', group: 'For every sole trader', trades: 'all', kw: 'mtd quarterly updates software hmrc digital records' },
  { slug: 'universal-credit-reporting-dates', icon: 'calendar-check', title: 'Universal Credit self-employed reporting dates', desc: 'Your next assessment periods and the window to report earnings for each.', group: 'For every sole trader', trades: 'construction beauty cleaning pets childcare tutoring driving selling', kw: 'uc dwp assessment period earnings report benefits' },
  { slug: 'cis-tax-refund-calculator', icon: 'hardhat', title: 'CIS tax refund estimator', desc: 'Estimate the refund (or bill) after CIS deductions, materials and expenses.', group: 'Construction & trades', trades: 'construction', kw: 'builder subcontractor plumber electrician carpenter labourer roofer refund rebate' },
  { slug: 'hair-beauty-price-calculator', icon: 'scissors', title: 'Hair & beauty price-per-service calculator', desc: 'Price each treatment to cover products, overheads and a fair hourly wage.', group: 'Beauty, cleaning & pet care', trades: 'beauty', kw: 'hairdresser barber nails lashes brows salon massage treatment price' },
  { slug: 'cleaning-price-calculator', icon: 'spray', title: 'Cleaning job price calculator', desc: 'Quote a clean that covers wages, supplies, travel and profit.', group: 'Beauty, cleaning & pet care', trades: 'cleaning', kw: 'cleaner domestic commercial end of tenancy quote price' },
  { slug: 'dog-walking-price-calculator', icon: 'paw', title: 'Dog walking & pet sitting price calculator', desc: 'Set a per-dog walk price or pet-sitting visit rate that actually pays.', group: 'Beauty, cleaning & pet care', trades: 'pets', kw: 'dog walker pet sitter cat sitting boarding price' },
  { slug: 'childminder-tax-calculator', icon: 'blocks', title: 'Childminder take-home calculator', desc: 'Fees, funded hours and use-of-home costs turned into real take-home pay.', group: 'Childcare & tutoring', trades: 'childcare', kw: 'childcare nursery funded hours ofsted use of home' },
  { slug: 'tutor-hourly-rate-calculator', icon: 'cap', title: 'Private tutor hourly rate calculator', desc: 'Work back from the income you want to the hourly rate you need to charge.', group: 'Childcare & tutoring', trades: 'tutoring', kw: 'teacher lessons tuition music maths english hourly rate' },
  { slug: 'taxi-delivery-driver-tax-calculator', icon: 'car', title: 'Taxi, private hire & delivery driver tax calculator', desc: 'Mileage rates vs actual vehicle costs: see which saves more tax.', group: 'Driving & delivery', trades: 'driving', kw: 'uber bolt deliveroo just eat amazon flex courier private hire cab' },
  { slug: 'mileage-claim-calculator', icon: 'route', title: 'HMRC mileage claim calculator', desc: '45p/25p for cars and vans, 24p motorbikes, 20p bikes — your claim in seconds.', group: 'Driving & delivery', trades: 'driving cleaning pets tutoring construction beauty', kw: 'miles car van motorbike bicycle p87 business travel mileage allowance relief' },
  { slug: 'vinted-ebay-hmrc-checker', icon: 'tag', title: 'Vinted, eBay & Depop HMRC checker', desc: 'Decluttering or trading? Platform reporting, the £1,000 allowance and what to do next.', group: 'Selling online', trades: 'selling', kw: 'etsy reseller declutter platform reporting side hustle' },
  { slug: 'landlord-tax-calculator', icon: 'house', title: 'Landlord rental profit tax calculator', desc: 'Tax on rent for 2026/27 vs the new 2027/28 property rates, plus an MTD check.', group: 'Property & hosting', trades: 'property', kw: 'rental buy to let mortgage interest property tax rent' },
  { slug: 'airbnb-rent-a-room-calculator', icon: 'bed', title: 'Airbnb, holiday let & Rent a Room calculator', desc: 'Rent a Room vs the £1,000 property allowance vs actual expenses — best option highlighted.', group: 'Property & hosting', trades: 'property', kw: 'holiday let lodger short let host booking' }
];
const CALC = Object.fromEntries(CALCS.map((c) => [c.slug, c]));

const GUIDES = [
  { slug: 'self-assessment-deadlines-2026-27', icon: 'calendar', title: 'Self Assessment deadlines for 2026/27', desc: 'Every date that matters for the 2026/27 tax year, from registering to payments on account.' },
  { slug: 'trading-allowance-vs-expenses', icon: 'wallet', title: 'Trading allowance vs expenses: which should you use?', desc: 'When the £1,000 trading allowance beats claiming costs, and when it does not.' },
  { slug: 'making-tax-digital-income-tax-explained', icon: 'laptop', title: 'Making Tax Digital for Income Tax explained', desc: 'Who is in, when it starts, what quarterly updates involve and how to get ready.' }
];

const TRADES = [
  ['all', 'All', 'grid'], ['construction', 'Construction', 'hardhat'], ['beauty', 'Hair & beauty', 'scissors'], ['cleaning', 'Cleaning', 'spray'],
  ['pets', 'Pet care', 'paw'], ['childcare', 'Childminding', 'blocks'], ['tutoring', 'Tutoring', 'cap'], ['driving', 'Driving & delivery', 'car'],
  ['selling', 'Selling online', 'tag'], ['property', 'Landlord & hosting', 'house']
];

const PRODUCT_ICON = { bookkeeping: 'briefcase', mileage: 'route', cleaning: 'spray', tutor: 'cap', universalCredit: 'calendar-check', cis: 'hardhat', beauty: 'scissors', reseller: 'tag', dogWalker: 'paw', landlord: 'house', childminder: 'blocks', airbnb: 'bed', driver: 'car' };

// Number box → "min max step" for its paired slider.
const RANGES = {
  'self-employed-tax-calculator': { turnover: '0 150000 500', expenses: '0 50000 100', employment: '0 150000 500' },
  'cis-tax-refund-calculator': { gross: '0 150000 500', materials: '0 50000 100', expenses: '0 30000 100', employment: '0 100000 500' },
  'hair-beauty-price-calculator': { minutes: '5 240 5', hourlyRate: '0 60 0.5', productCost: '0 50 0.5', overheads: '0 3000 25', servicesPerMonth: '0 400 5', margin: '0 100 1' },
  'cleaning-price-calculator': { hours: '0.5 12 0.5', cleaners: '1 6 1', pay: '0 40 0.5', supplies: '0 50 1', miles: '0 60 1', overheads: '0 3000 25', jobsPerMonth: '0 200 1', margin: '0 100 1' },
  'dog-walking-price-calculator': { minutes: '5 240 5', travelMinutes: '0 90 5', hourlyRate: '0 40 0.5', pets: '1 8 1', miles: '0 50 1', overheads: '0 1000 10', visits: '0 300 5', margin: '0 100 1' },
  'vinted-ebay-hmrc-checker': { sales: '0 20000 50', salesCount: '0 1000 1', costs: '0 15000 50', employment: '0 100000 500' },
  'childminder-tax-calculator': { fees: '0 80000 500', funded: '0 40000 250', grants: '0 10000 50', expenses: '0 20000 100', homeCosts: '0 15000 100', homeUse: '0 100 1', employment: '0 100000 500' },
  'landlord-tax-calculator': { rent: '0 100000 500', expenses: '0 30000 100', finance: '0 30000 100', other: '0 150000 500', seTurnover: '0 100000 500' },
  'airbnb-rent-a-room-calculator': { income: '0 50000 250', expenses: '0 20000 100', other: '0 150000 500' },
  'taxi-delivery-driver-tax-calculator': { fares: '0 100000 500', platformFees: '0 30000 100', otherExpenses: '0 10000 50', miles: '0 60000 500', vehicleCosts: '0 25000 100', businessPct: '0 100 1', employment: '0 100000 500' },
  'mileage-claim-calculator': { carMiles: '0 40000 100', motorcycleMiles: '0 20000 100', bicycleMiles: '0 5000 50', employerPaid: '0 10000 50' },
  'tutor-hourly-rate-calculator': { target: '0 80000 500', weeks: '1 52 1', hours: '1 50 1', unpaid: '0 30 1', costs: '0 10000 50', platformFee: '0 50 1' },
  'making-tax-digital-checker': { y2425: '0 120000 1000', y2526: '0 120000 1000', y2627: '0 120000 1000' },
  'universal-credit-reporting-dates': { startDay: '1 31 1' }
};

// Extra help next to a field label.
const FIELD_TIPS = {
  'self-employed-tax-calculator': { expenses: 'Allowable expenses are costs that are wholly for the business — stock, tools, insurance, software, a business phone, business travel. Personal spending, everyday clothing and fines don\'t count.' },
  'cis-tax-refund-calculator': { materials: 'CIS is only taken from the labour part of a payment, so materials you bought and passed on in the price are left out of the deduction.', cisDeducted: 'Add up the deductions on the monthly payment and deduction statements (PDS) your contractors send you.' },
  'hair-beauty-price-calculator': { overheads: 'Chair or room rent, insurance, booking software, laundry, phone, training and any other monthly cost that isn\'t tied to one client.' },
  'cleaning-price-calculator': { overheads: 'Insurance, phone, advertising, equipment repairs, software and other monthly costs that aren\'t tied to one clean.' },
  'dog-walking-price-calculator': { overheads: 'Insurance, DBS checks, advertising, phone, leads and treats bought in bulk, and other monthly costs not tied to one visit.' },
  'childminder-tax-calculator': { homeUse: 'The share of your home\'s running costs used for childminding, usually worked out from the rooms and hours used. Use a reasonable method and keep to it.' },
  'taxi-delivery-driver-tax-calculator': { businessPct: 'The share of your vehicle\'s use that is for work. Personal trips, including the school run and shopping, don\'t count.' },
  'landlord-tax-calculator': { finance: 'Mortgage interest doesn\'t reduce your rental profit directly. Instead you get a tax credit on it at the basic rate, worked out for you here.' },
  'airbnb-rent-a-room-calculator': { other: 'Salary, pension, trading profit or other rent for the year. It decides which tax band your letting income falls into.' },
  'tutor-hourly-rate-calculator': { unpaid: 'Preparation, marking, admin and travel. You can\'t bill for them, but they lower your real hourly pay.' },
  'making-tax-digital-checker': { y2425: 'Qualifying income is your self-employment turnover plus gross property income, before any expenses — not your profit.' },
  'mileage-claim-calculator': { carMiles: 'Business journeys only, such as trips between clients or jobs. Your normal commute to a permanent workplace doesn\'t count.' },
  'vinted-ebay-hmrc-checker': { salesCount: 'How many items you sold through the platform in the calendar year (January to December).' },
  'universal-credit-reporting-dates': { startDay: 'Your assessment period starts on the same day each month. You can see it in your Universal Credit online account.' }
};

// Extra help on result labels, matched by the label text.
const RESULT_TIPS = {
  'Taxable profit': 'Income minus allowable expenses (or minus the £1,000 trading allowance if that is bigger). Income tax and Class 4 NI are worked out on this figure.',
  'Class 4 National Insurance': 'Paid through Self Assessment on self-employed profits: 6% on profits between £12,570 and £50,270, then 2% above that.',
  'Income tax on your profit': 'Only the extra income tax caused by your self-employed profit. Tax on any job is assumed to be taken through PAYE.',
  'Effective rate on profit': 'Your total income tax and National Insurance as a share of your taxable profit.',
  'Use-of-home claim': 'The business share of household running costs such as heating, electricity and council tax, using the percentage you entered.',
  'CIS deducted': 'Tax your contractors took from your labour payments and paid to HMRC for you. It counts towards your bill when you file.',
  'Your real tax bill': 'Income tax and Class 4 NI on your actual profit after materials and expenses — what you really owe for the year.',
  'Share of business costs': 'Your monthly overheads divided by the number of jobs you do in a month.',
  'Share of running costs': 'Your monthly overheads divided by the number of services you do in a month.',
  'Profit margin': 'An extra percentage on top of your costs and wage, so the business can save, grow and ride out quiet weeks.',
  'HMRC approved amount': 'The tax-free mileage HMRC allows: 45p a mile for the first 10,000 business miles in a car or van, then 25p; 24p for motorcycles; 20p for bicycles.',
  'Lowest price before you lose money': 'Products and running costs only, with nothing for your time. Below this, each appointment costs you money.',
  'Take-home per hour actually worked': 'Your target take-home spread over every hour you work, including unpaid preparation and marking.'
};

const CHART_TITLE = {
  'self-employed-tax-calculator': 'Where your income goes',
  'cis-tax-refund-calculator': 'Where your CIS income goes',
  'hair-beauty-price-calculator': 'What the price is made of',
  'cleaning-price-calculator': 'What the quote is made of',
  'dog-walking-price-calculator': 'What the price is made of',
  'vinted-ebay-hmrc-checker': 'Where your sales money goes',
  'childminder-tax-calculator': 'Where your childminding income goes',
  'landlord-tax-calculator': 'Where your rent goes in 2026/27',
  'airbnb-rent-a-room-calculator': 'Where your letting income goes',
  'taxi-delivery-driver-tax-calculator': 'Where your fares go (better method)',
  'mileage-claim-calculator': 'How your mileage adds up',
  'tutor-hourly-rate-calculator': 'Where your lesson income goes'
};

/* ------------------------------------------------------------- templates */

const LOGO = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect width="64" height="64" rx="16" fill="#F2A541"/><rect x="14" y="12" width="36" height="40" rx="5" fill="#fffaf2"/><path d="M20 22h24M20 30h24M20 38h12" stroke="#0F5257" stroke-width="3.5" stroke-linecap="round"/><circle cx="43" cy="42" r="8" fill="#0F5257"/><path d="M39.5 42.2l2.4 2.4 4.3-4.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>';

function header(p, current) {
  const cur = (name) => (current === name ? ' aria-current="page"' : '');
  return `<header class="site-header">
<div class="wrap header-inner">
<a class="brand" href="${p || './'}">${LOGO}<span>TaxReady<span class="brand-accent">Sheets</span></span></a>
<nav class="site-nav" id="site-nav" aria-label="Main">
<ul>
<li><a href="${p}calculators/"${cur('Calculators')}>Calculators</a></li>
<li><a href="${p}guides/"${cur('Guides')}>Guides</a></li>
<li><a href="${p}about/"${cur('About')}>About</a></li>
<li class="nav-cta"><a class="btn btn-amber btn-sm" href="https://www.etsy.com/shop/TaxReadySheets" data-shop-link target="_blank" rel="noopener">Etsy shop${NEW_TAB}</a></li>
</ul>
</nav>
<div class="header-tools">
<button type="button" class="icon-btn theme-toggle" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false">${ico('moon', 'icon i-moon')}${ico('sun', 'icon i-sun')}</button>
<button type="button" class="icon-btn nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">${ico('menu', 'icon i-menu')}${ico('close', 'icon i-close')}</button>
</div>
</div>
</header>`;
}

function footer(p, legal) {
  const li = (href, text) => `<li><a href="${p}${href}">${text}</a></li>`;
  return `<footer class="site-footer">
<div class="wrap">
<div class="footer-top">
<div class="footer-brand">
<a class="brand" href="${p || './'}">${LOGO}<span>TaxReady<span class="brand-accent">Sheets</span></span></a>
<p>Free UK tax calculators for the self-employed. Simple, private tools that run in your browser — nothing you type is stored or sent anywhere.</p>
<p>Estimates only, not tax advice. Check <a href="https://www.gov.uk/browse/tax" rel="noopener">GOV.UK</a> or an accountant before you act.</p>
<ul class="footer-badges"><li>${ico('check-circle')}Checked for 2026/27</li><li>${ico('shield')}No cookies, no tracking</li></ul>
</div>
<div>
<h2>Popular calculators</h2>
<ul>
${li('calculators/self-employed-tax-calculator/', 'Self-employed tax &amp; take-home calculator')}
${li('calculators/cis-tax-refund-calculator/', 'CIS tax refund estimator')}
${li('calculators/landlord-tax-calculator/', 'Landlord rental profit tax calculator')}
${li('calculators/making-tax-digital-checker/', 'Making Tax Digital checker')}
${li('calculators/mileage-claim-calculator/', 'HMRC mileage claim calculator')}
${li('calculators/', 'All calculators')}
</ul>
</div>
<div>
<h2>Guides</h2>
<ul>
${GUIDES.map((g) => li(`guides/${g.slug}/`, g.title.replace(/&/g, '&amp;'))).join('\n')}
${li('guides/', 'All guides')}
</ul>
</div>
<div>
<h2>More</h2>
<ul>
${li('about/', 'About')}
${li('privacy/', 'Privacy')}
<li><a href="https://www.etsy.com/shop/TaxReadySheets" data-shop-link target="_blank" rel="noopener">Spreadsheets on Etsy${NEW_TAB}</a></li>
</ul>
</div>
</div>
${legal}
</div>
</footer>`;
}

function fixHead(html, p) {
  return html.replace(/<link rel="stylesheet" href="([^"]*)assets\/css\/style\.css">/, (m, pre) =>
    `<script src="${pre}assets/js/theme-init.js"></script>\n<link rel="preload" href="${pre}assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>\n${m}`);
}

function shell(html, p) {
  html = html.replace(/<th scope="col"><\/th>/g, '<th scope="col"><span class="visually-hidden">Item</span></th>').replace(/<th><\/th>/g, '<th><span class="visually-hidden">Item</span></th>').replace(/<div class="table-scroll">/g, '<div class="table-scroll" tabindex="0">');
  const current = (html.match(/<a href="[^"]+" aria-current="page">(\w+)<\/a><\/li>/) || [])[1];
  const legal = html.match(/<p class="legal">[\s\S]*?<\/p>/)[0];
  html = fixHead(html, p);
  html = html.replace(/<header class="site-header">[\s\S]*?<\/header>/, header(p, current));
  html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer(p, legal));
  return html;
}

function signup(html) {
  return html.replace(/<section class="signup" data-signup aria-labelledby="signup-h">\n([\s\S]*?)<\/section>/, (m, inner) => {
    inner = inner.replace('<button class="btn btn-teal" type="submit">Send me reminders</button>', `<button class="btn btn-amber" type="submit">Send me reminders${ico('arrow')}</button>`);
    return `<section class="signup reveal" data-signup aria-labelledby="signup-h">
<div class="signup-art" aria-hidden="true">${envelopeArt()}</div>
<div class="signup-body">
${inner}</div>
</section>`;
  });
}

function envelopeArt() {
  return `<svg viewBox="0 0 160 120" focusable="false"><rect x="18" y="28" width="124" height="80" rx="12" class="ea-back"/><path d="M18 40l62 40 62-40" class="ea-flap"/><rect x="42" y="10" width="76" height="58" rx="8" class="ea-card"/><path d="M54 26h36M54 36h52M54 46h28" class="ea-line"/><circle cx="122" cy="24" r="14" class="ea-badge"/><path d="M116 24.5l4 4 7.5-8" class="ea-tick"/></svg>`;
}

function sheetPreview(key, i = 0) {
  const heights = [[22, 34, 28, 44], [30, 20, 38, 46], [18, 30, 42, 36], [26, 40, 32, 48]][i % 4];
  const bars = heights.map((h, j) => `<rect x="${170 + j * 14}" y="${118 - h}" width="9" height="${h}" rx="2" class="sp-bar${j === 3 ? ' sp-bar-hi' : ''}"/>`).join('');
  return `<svg class="sheet-preview" viewBox="0 0 240 150" focusable="false" aria-hidden="true">
<rect x="1" y="1" width="238" height="148" rx="12" class="sp-bg"/>
<path d="M1 13a12 12 0 0 1 12-12h214a12 12 0 0 1 12 12v13H1z" class="sp-top"/>
<circle cx="14" cy="13.5" r="3" class="sp-dot"/><circle cx="24" cy="13.5" r="3" class="sp-dot"/><circle cx="34" cy="13.5" r="3" class="sp-dot"/>
<rect x="12" y="34" width="144" height="12" rx="3" class="sp-head"/>
${[52, 66, 80, 94].map((y, r) => `<rect x="12" y="${y}" width="44" height="8" rx="2" class="sp-cell"/><rect x="62" y="${y}" width="${40 - ((r + i) % 3) * 8}" height="8" rx="2" class="sp-cell"/><rect x="112" y="${y}" width="44" height="8" rx="2" class="sp-cell sp-num"/>`).join('')}
<rect x="12" y="110" width="144" height="12" rx="3" class="sp-total"/>
<path d="M164 118h66" class="sp-axis"/>${bars}
<rect x="164" y="34" width="66" height="30" rx="6" class="sp-chip"/><rect x="171" y="41" width="30" height="6" rx="2" class="sp-chip-line"/><rect x="171" y="51" width="44" height="7" rx="2" class="sp-chip-num"/>
<rect x="12" y="130" width="60" height="8" rx="2" class="sp-cell"/>
</svg>`;
}

function productBox(html) {
  return html.replace(/<aside class="product" data-product="([^"]+)" aria-labelledby="product-h">\n<div>\n([\s\S]*?)<\/div>\n(<a class="btn btn-amber" data-product-link[^>]*>)View on Etsy(<span class="visually-hidden"> \(opens in a new tab\)<\/span><\/a>)\n<\/aside>/, (m, key, body, a, end) => {
    return `<aside class="product reveal" data-product="${key}" aria-labelledby="product-h">
<div class="product-media">${sheetPreview(key)}<span class="product-badge" aria-hidden="true">${ico(PRODUCT_ICON[key] || 'sheet')}</span></div>
<div class="product-body">
${body.replace('<p class="eyebrow">Ready-made spreadsheet</p>', `<p class="eyebrow">${ico('sheet')}Ready-made spreadsheet</p>`)}<div class="product-actions">${a}View on Etsy${ico('external')}${end}<span class="product-note">Made by TaxReadySheets · opens our Etsy shop</span></div>
</div>
</aside>`;
  });
}

function relatedCards(html, p) {
  return html.replace(/<section class="related" aria-labelledby="related-h"><h2 id="related-h">([^<]+)<\/h2><ul>\n([\s\S]*?)<\/ul><\/section>/, (m, h, items) => {
    const lis = [...items.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g)].map(([, href, text]) => {
      const slug = (href.match(/(?:calculators|guides)\/([^/]+)\//) || [])[1];
      const isGuide = href.includes('guides/');
      const ic = isGuide ? 'book' : (CALC[slug]?.icon || 'calculator');
      return `<li><a class="related-card" href="${href}"><span class="related-icon">${ico(ic)}</span><span class="related-text"><span class="related-kind">${isGuide ? 'Guide' : 'Calculator'}</span>${text}</span>${ico('arrow', 'icon related-arrow')}</a></li>`;
    });
    return `<section class="related" aria-labelledby="related-h"><h2 id="related-h">${h}</h2><ul class="related-grid">\n${lis.join('\n')}\n</ul></section>`;
  });
}

function checkedNote(html) {
  return html.replace(/<p class="checked-note"><span aria-hidden="true">✓<\/span>/g, `<p class="checked-note"><span class="checked-icon" aria-hidden="true">${ico('check-circle')}</span>`);
}

let tipCount = 0;
function tipButton(id, about) {
  return `<button type="button" class="tip" aria-expanded="false" aria-controls="${id}" aria-label="What is ${about.replace(/"/g, '&quot;')}?">${ico('info')}</button>`;
}

function calcPage(rel) {
  const slug = rel.split('/')[1];
  const c = CALC[slug];
  const p = '../../';
  let h = shell(orig(rel), p);
  h = checkedNote(h);

  // hero band
  h = h.replace(/<main id="main">\n<div class="wrap">\n(<nav class="crumbs"[\s\S]*?<\/nav>)\n<h1>([\s\S]*?)<\/h1>\n(<p class="lead">[\s\S]*?<\/p>)\n(<p class="checked-note">[\s\S]*?<\/p>)\n<div class="calc-layout">/, (m, crumbs, h1, lead, checked) =>
    `<main id="main">
<div class="page-hero">
<div class="wrap">
${crumbs}
<div class="page-title"><span class="title-icon" aria-hidden="true">${ico(c.icon)}</span><h1>${h1}</h1></div>
${lead}
${checked}
</div>
</div>
<div class="wrap">
<div class="calc-layout">`);

  // sliders
  for (const [id, range] of Object.entries(RANGES[slug] || {})) {
    const re = new RegExp(`(<input id="${id}" name="${id}" type="number")`);
    if (!re.test(h)) throw new Error(`${slug}: no input ${id}`);
    h = h.replace(re, `$1 data-range="${range}"`);
  }
  // field help
  for (const [id, text] of Object.entries(FIELD_TIPS[slug] || {})) {
    const re = new RegExp(`<label for="${id}">([^<]+)</label>`);
    const m = h.match(re);
    if (!m) throw new Error(`${slug}: no label ${id}`);
    h = h.replace(re, `<div class="label-row"><label for="${id}">${m[1]}</label>${tipButton(`tip-${id}`, m[1])}</div><p class="tip-pop" id="tip-${id}">${text}</p>`);
  }
  // result help
  h = h.replace(/<div><dt>([^<]+)<\/dt>/g, (m, term) => {
    const t = RESULT_TIPS[term];
    if (!t) return m;
    const id = `tip-r${++tipCount}`;
    return `<div class="has-tip"><dt>${term}${tipButton(id, term)}<span class="tip-pop" id="${id}">${t}</span></dt>`;
  });

  // results: actions; chart card after results
  const actions = `<div class="calc-actions js-only" data-calc-actions>
<button type="button" class="action" data-action="copy">${ico('copy')}<span>Copy results</span></button>
<button type="button" class="action" data-action="share">${ico('link')}<span>Share link</span></button>
<button type="button" class="action" data-action="print">${ico('print')}<span>Print / PDF</span></button>
<button type="button" class="action" data-action="reset">${ico('reset')}<span>Reset</span></button>
</div>
<p class="action-status" data-action-status role="status" aria-live="polite"></p>`;
  h = h.replace(/(<section class="results" id="results"[\s\S]*?)\n<\/section>\n<\/div>\n<p class="privacy-note">([^<]*)<\/p>/, (m, results, note) => {
    const chart = CHART_TITLE[slug]
      ? `\n<section class="chart-card js-only" aria-labelledby="chart-h">\n<h2 id="chart-h">${CHART_TITLE[slug]}</h2>\n<div class="chart" data-chart></div>\n</section>`
      : '';
    return `${results}\n${actions}\n</section>${chart}\n</div>\n<p class="privacy-note">${ico('shield')}<span>${note}</span></p>`;
  });
  if (!h.includes('data-calc-actions')) throw new Error(`${slug}: actions not inserted`);

  h = productBox(h);
  h = relatedCards(h, p);
  h = signup(h);

  // content + "on this page"
  const toc = [['calc-h', 'Your figures'], ['example-h', 'Worked example'], ['explained-h', 'How it works'], ['faq-h', 'FAQs'], ['related-h', 'More calculators']].filter(([id]) => h.includes(`id="${id}"`));
  h = h.replace(/<div class="content">\n([\s\S]*?)<\/div>\n<\/div>\n<\/main>/, (m, inner) =>
    `<div class="with-aside">
${tocBlock(toc, '', ' toc-wide-only')}
<div class="content">
${inner}</div>
</div>
</div>
</main>`);
  if (!h.includes('class="with-aside"')) throw new Error(`${slug}: content not wrapped`);
  return h;
}

function tocBlock(items, extra = '', cls = '') {
  return `<div class="toc-aside${cls}">
<nav class="toc" aria-labelledby="toc-h">
<p class="toc-title" id="toc-h">${ico('list')}On this page</p>
<ol>
${items.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('\n')}
</ol>
</nav>${extra}
</div>`;
}

function slugify(s) {
  return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function readingMinutes(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function guidePage(rel) {
  const slug = rel.split('/')[1];
  const g = GUIDES.find((x) => x.slug === slug);
  const p = '../../';
  let h = shell(orig(rel), p);
  h = checkedNote(h);
  const m = h.match(/<main id="main">\n<div class="wrap">\n(<nav class="crumbs"[\s\S]*?<\/nav>)\n<article class="content">\n<h1>([\s\S]*?)<\/h1>\n(<p class="lead">[\s\S]*?<\/p>)\n(<p class="checked-note">[\s\S]*?<\/p>)\n([\s\S]*?)<\/article>\n<\/div>\n<\/main>/);
  if (!m) throw new Error(`${slug}: guide structure`);
  let [, crumbs, h1, lead, checked, body] = m;
  // body text before the product box counts towards reading time
  const articleText = body.split('<aside class="product"')[0];
  const mins = readingMinutes(articleText);
  const toc = [];
  const used = new Set();
  body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (mm, t) => {
    let id = slugify(t);
    while (used.has(id)) id += '-2';
    used.add(id);
    toc.push([id, t]);
    return `<h2 id="${id}">${t}</h2>`;
  });
  if (body.includes('id="faq-h"')) toc.push(['faq-h', 'Frequently asked questions']);
  body = productBox(body);
  body = relatedCards(body, p);
  body = signup(body);
  const extra = `\n<a class="toc-cta" href="${p}calculators/self-employed-tax-calculator/">${ico('calculator')}<span><strong>Run the numbers</strong>Self-employed tax calculator</span></a>`;
  const out = `<main id="main">
<article class="guide">
<div class="page-hero page-hero-guide">
<div class="wrap">
${crumbs}
<p class="article-meta"><span class="meta-pill">${ico(g.icon)}Guide</span><span class="meta-item">${ico('clock')}${mins} min read</span><span class="meta-item">${ico('calendar')}2026/27 tax year</span></p>
<h1>${h1}</h1>
${lead}
${checked}
</div>
</div>
<div class="wrap with-aside">
${tocBlock(toc, extra)}
<div class="content article-body">
${body}</div>
</div>
</article>
</main>`;
  return h.replace(m[0], out);
}

/* ------------------------------------------------- simple content pages */

function simplePage(rel, p) {
  let h = shell(orig(rel), p);
  h = signup(h);
  // crumbs + h1 + lead into a hero band
  h = h.replace(/<main id="main">\n<div class="wrap">(<nav class="crumbs"[\s\S]*?<\/nav>)<\/div>\n<div class="wrap"><div class="content">\n<h1>([\s\S]*?)<\/h1>\n(<p class="lead">[\s\S]*?<\/p>)\n/, (m, crumbs, h1, lead) =>
    `<main id="main">\n<div class="page-hero">\n<div class="wrap">\n${crumbs}\n<h1>${h1}</h1>\n${lead}\n</div>\n</div>\n<div class="wrap"><div class="content prose">\n`);
  return h;
}

function notFound() {
  let h = shell(orig('404.html'), '');
  h = h.replace(/<main id="main">\n<div class="wrap"><div class="content">\n<h1>([\s\S]*?)<\/h1>\n(<p class="lead">[\s\S]*?<\/p>)\n<ul>\n([\s\S]*?)<\/ul>\n<\/div><\/div>\n<\/main>/, (m, h1, lead, items) => {
    const lis = [...items.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g)].map(([, href, text]) => {
      const slug = (href.match(/calculators\/([^/]+)\//) || [])[1];
      const ic = slug ? CALC[slug].icon : href === 'calculators/' ? 'grid' : href === 'guides/' ? 'book' : 'house';
      return `<li><a class="related-card" href="${href}"><span class="related-icon">${ico(ic)}</span><span class="related-text">${text}</span>${ico('arrow', 'icon related-arrow')}</a></li>`;
    });
    return `<main id="main">
<div class="page-hero page-hero-center">
<div class="wrap">
<div class="nf-art" aria-hidden="true">${heroArt('nf')}</div>
<h1>${h1}</h1>
${lead}
</div>
</div>
<div class="wrap narrow">
<ul class="related-grid">
${lis.join('\n')}
</ul>
</div>
</main>`;
  });
  return h;
}

/* --------------------------------------------------------- calculator grid */

function calcCard(c, p, { showGroup = false } = {}) {
  return `<li class="calc-card reveal" data-trades="${c.trades}" data-keywords="${c.kw}">
<span class="calc-card-icon" aria-hidden="true">${ico(c.icon)}</span>
<h3><a href="${p}calculators/${c.slug}/">${c.title.replace(/&/g, '&amp;')}</a></h3>
<p>${c.desc.replace(/&/g, '&amp;')}</p>
${showGroup ? `<span class="calc-card-group">${c.group.replace(/&/g, '&amp;')}</span>` : ''}<span class="calc-card-go" aria-hidden="true">Open calculator${ico('arrow')}</span>
</li>`;
}

function finder(p, { headingId, heading, intro, showGroup, headingTag = 'h2' }) {
  return `<section class="finder" data-finder aria-labelledby="${headingId}">
<div class="section-head">
<${headingTag} id="${headingId}">${heading}</${headingTag}>
${intro}
</div>
<div class="finder-controls js-only" data-finder-controls>
<div class="finder-search">
<label class="visually-hidden" for="finder-q">Search calculators</label>
${ico('search', 'icon finder-search-icon')}
<input type="search" id="finder-q" data-finder-search placeholder="Search: CIS, Uber, lodger, mileage…" autocomplete="off">
</div>
<div class="chips" role="group" aria-label="What do you do?">
${TRADES.map(([key, label, ic]) => `<button type="button" class="chip" data-filter="${key}" aria-pressed="${key === 'all'}">${ico(ic)}<span>${label}</span></button>`).join('\n')}
</div>
<p class="finder-count" data-finder-count role="status" aria-live="polite"></p>
</div>
<ul class="calc-grid">
${CALCS.map((c) => calcCard(c, p, { showGroup })).join('\n')}
<li class="calc-card calc-card-alt card-extra reveal" data-trades="all" data-keywords="guide guides deadline deadlines help explained">
<span class="calc-card-icon" aria-hidden="true">${ico('book')}</span>
<h3><a href="${p}guides/">Plain-English tax guides</a></h3>
<p>Deadlines, the trading allowance and Making Tax Digital, explained without the jargon.</p>
<span class="calc-card-go" aria-hidden="true">Read the guides${ico('arrow')}</span>
</li>
</ul>
<div class="finder-empty" data-finder-empty hidden>
<p><strong>No calculator matches that yet.</strong> Try a different word, or start with the <a href="${p}calculators/self-employed-tax-calculator/">self-employed tax calculator</a> — it works for every trade.</p>
<button type="button" class="btn btn-soft btn-sm" data-finder-reset>Show all calculators</button>
</div>
</section>`;
}

/* ------------------------------------------------------- illustrations */

function heroArt(kind = 'hero') {
  if (kind === 'nf') {
    return `<svg viewBox="0 0 220 140" focusable="false"><rect x="30" y="18" width="160" height="108" rx="14" class="ha-sheet"/><rect x="30" y="18" width="160" height="22" rx="11" class="ha-top"/><path d="M50 62h60M50 80h90M50 98h40" class="ha-line"/><circle cx="160" cy="92" r="22" class="ha-amber"/><path d="M152 84l16 16M168 84l-16 16" class="ha-x"/></svg>`;
  }
  return `<svg class="hero-art" viewBox="0 0 560 470" focusable="false" aria-hidden="true">
<defs>
<linearGradient id="ha-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="ha-stop1"/><stop offset="1" class="ha-stop2"/></linearGradient>
<linearGradient id="ha-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7BE6A"/><stop offset="1" stop-color="#F2A541"/></linearGradient>
</defs>
<circle cx="300" cy="230" r="200" fill="url(#ha-g1)" class="ha-blob"/>
<g class="ha-float-a">
<rect x="70" y="70" width="350" height="250" rx="20" class="ha-sheet"/>
<path d="M70 90a20 20 0 0 1 20-20h310a20 20 0 0 1 20 20v14H70z" class="ha-top"/>
<circle cx="92" cy="87" r="5" class="ha-dot"/><circle cx="108" cy="87" r="5" class="ha-dot"/><circle cx="124" cy="87" r="5" class="ha-dot"/>
<rect x="92" y="122" width="200" height="18" rx="5" class="ha-head"/>
${[150, 172, 194, 216, 238].map((y, i) => `<rect x="92" y="${y}" width="70" height="12" rx="4" class="ha-cell"/><rect x="170" y="${y}" width="${[48, 60, 40, 56, 44][i]}" height="12" rx="4" class="ha-cell"/><rect x="236" y="${y}" width="56" height="12" rx="4" class="ha-cell ha-num"/>`).join('')}
<rect x="92" y="264" width="200" height="20" rx="6" class="ha-total"/>
<rect x="236" y="268" width="50" height="12" rx="4" class="ha-total-num"/>
<g transform="translate(355 190)">
<circle r="40" class="ha-ring"/>
<circle r="40" class="ha-ring-a" stroke-dasharray="70 182" transform="rotate(-90)"/>
<circle r="40" class="ha-ring-b" stroke-dasharray="40 212" stroke-dashoffset="-72" transform="rotate(-90)"/>
<circle r="40" class="ha-ring-c" stroke-dasharray="138 114" stroke-dashoffset="-114" transform="rotate(-90)"/>
</g>
<path d="M318 266h76" class="ha-line"/><path d="M318 284h52" class="ha-line"/>
</g>
<g class="ha-float-b">
<rect x="360" y="250" width="140" height="190" rx="22" class="ha-calc"/>
<rect x="378" y="268" width="104" height="40" rx="9" class="ha-screen"/>
<text x="470" y="296" text-anchor="end" class="ha-screen-text">£378</text>
${[0, 1, 2].map((r) => [0, 1, 2].map((col) => `<rect x="${378 + col * 36}" y="${322 + r * 34}" width="28" height="26" rx="7" class="${r === 2 && col === 2 ? 'ha-key-eq' : 'ha-key'}"/>`).join('')).join('')}
</g>
<g class="ha-float-c">
<rect x="20" y="300" width="150" height="104" rx="18" class="ha-card"/>
<rect x="20" y="300" width="150" height="30" rx="15" class="ha-cal-top"/>
<rect x="20" y="315" width="150" height="15" class="ha-cal-top"/>
<text x="95" y="321" text-anchor="middle" class="ha-cal-month">JAN</text>
<text x="95" y="378" text-anchor="middle" class="ha-cal-day">31</text>
</g>
<g class="ha-coins">
<ellipse cx="230" cy="420" rx="34" ry="10" class="ha-coin-s"/>
<rect x="196" y="392" width="68" height="28" class="ha-coin"/>
<ellipse cx="230" cy="392" rx="34" ry="10" class="ha-coin-t"/>
<path d="M196 402h68M196 411h68" class="ha-coin-l"/>
<text x="230" y="397" text-anchor="middle" class="ha-coin-sym">£</text>
</g>
<path d="M470 92l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" class="ha-spark"/>
<path d="M44 168l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" class="ha-spark ha-spark-2"/>
</svg>`;
}

/* ------------------------------------------------------------ home page */

function homePage() {
  const src = orig('index.html');
  let h = shell(src, '');
  h = h.replace('<script type="module" src="assets/js/site.js"></script>', '<script type="module" src="assets/js/site.js"></script>\n<script type="module" src="assets/js/pages/home.js"></script>');
  const sign = signup(src.match(/<section class="signup" data-signup[\s\S]*?<\/section>/)[0]);
  const featured = ['bookkeeping', 'cis', 'landlord', 'driver', 'beauty', 'mileage'];
  const products = featured.map((key, i) => {
    const pr = PRODUCTS[key];
    return `<li class="product-card reveal" data-product="${key}">
<div class="product-media">${sheetPreview(key, i)}<span class="product-badge" aria-hidden="true">${ico(PRODUCT_ICON[key])}</span></div>
<h3 data-product-title>${pr.title.replace(/&/g, '&amp;')}</h3>
<p data-product-blurb>${pr.blurb.replace(/&/g, '&amp;')}</p>
<a class="product-link" data-product-link href="https://www.etsy.com/listing/${pr.id}" target="_blank" rel="noopener">View on Etsy${ico('external')}<span class="visually-hidden"> — ${pr.title.replace(/&/g, '&amp;')} (opens in a new tab)</span></a>
</li>`;
  }).join('\n');

  const main = `<main id="main">
<section class="hero" aria-labelledby="hero-h">
<div class="wrap hero-grid">
<div class="hero-copy">
<span class="badge">${ico('check-circle')}Checked for the 2026/27 tax year</span>
<h1 id="hero-h">Free UK tax calculators for the <span class="hl">self-employed</span></h1>
<p class="hero-lead">Work out your tax bill, take-home pay, prices and deadlines in seconds. Built for sole traders, landlords, hosts, drivers and side hustlers — plain English, instant answers, and nothing you type ever leaves your device.</p>
<form class="quick card-surface" id="quick" novalidate aria-labelledby="quick-h">
<div class="quick-head"><h2 id="quick-h">${ico('bolt')}Quick tax estimate</h2><span class="quick-tag">2026/27 · England, Wales &amp; NI</span></div>
<div class="quick-fields">
<div class="field"><label for="q-turnover">Yearly self-employed income</label><div class="input-wrap"><span class="prefix" aria-hidden="true">£</span><input id="q-turnover" name="turnover" type="number" inputmode="decimal" min="0" step="any" value="32000" data-range="0 120000 500"></div></div>
<div class="field"><label for="q-expenses">Yearly business expenses</label><div class="input-wrap"><span class="prefix" aria-hidden="true">£</span><input id="q-expenses" name="expenses" type="number" inputmode="decimal" min="0" step="any" value="2000" data-range="0 40000 100"></div></div>
</div>
<div class="quick-results" aria-live="polite" aria-atomic="true">
<div class="stat stat-main"><span class="stat-label">Put aside each month</span><span class="stat-value" data-out="qSetAside">£378</span></div>
<div class="stat"><span class="stat-label">Estimated tax &amp; NI</span><span class="stat-value" data-out="qTotal">£4,532</span></div>
<div class="stat"><span class="stat-label">Take-home</span><span class="stat-value" data-out="qTakeHome">£25,468</span></div>
</div>
<div class="quick-bar" data-quick-bar style="--tax:15.1%" aria-hidden="true"><span class="quick-bar-tax"></span></div>
<p class="quick-legend" aria-hidden="true"><span><i class="dot dot-tax"></i>Tax &amp; NI</span><span><i class="dot dot-keep"></i>Yours to keep</span><span class="quick-rate">Effective rate <b data-out="qRate">15.1%</b></span></p>
<p class="quick-note" data-out="qNote">Income tax £3,486 + Class 4 NI £1,046 on a profit of £30,000.</p>
<div class="quick-actions">
<a class="btn btn-teal" data-quick-more href="calculators/self-employed-tax-calculator/">See the full breakdown${ico('arrow')}</a>
<a class="btn btn-ghost" href="#calculators">Browse all calculators</a>
</div>
</form>
</div>
<div class="hero-visual" aria-hidden="true">${heroArt()}</div>
</div>
</section>

<section class="trust" aria-label="Why you can rely on these calculators">
<div class="wrap">
<ul class="trust-list">
<li>${ico('check-circle')}<span><strong>Checked for 2026/27</strong>Last reviewed 27 October 2026</span></li>
<li>${ico('landmark')}<span><strong>Based on GOV.UK rates</strong>Every figure from one checked file</span></li>
<li>${ico('no-user')}<span><strong>No sign-up</strong>Free, no account, no ads</span></li>
<li>${ico('device')}<span><strong>Nothing leaves your device</strong>The maths runs in your browser</span></li>
</ul>
</div>
</section>

<div class="wrap">
<div id="calculators">
${finder('', { headingId: 'calcs-h', heading: 'What do you do?', intro: '<p class="section-lead">Pick your trade or search to find the right calculator. All fourteen use the same checked 2026/27 rates.</p>', showGroup: false })}
</div>

<section class="steps-section" aria-labelledby="how-h">
<div class="section-head center">
<h2 id="how-h">How it works</h2>
<p class="section-lead">Three steps, about a minute, and no forms to fill in.</p>
</div>
<ol class="steps">
<li class="step reveal"><span class="step-icon">${ico('search')}</span><span class="step-num">Step 1</span><h3>Pick your calculator</h3><p>Choose your trade above or search for what you need — tax, prices, mileage, CIS, property or deadlines.</p></li>
<li class="step reveal"><span class="step-icon">${ico('pencil')}</span><span class="step-num">Step 2</span><h3>Type in your figures</h3><p>Results update as you type. Use the sliders, try different numbers and see the effect straight away.</p></li>
<li class="step reveal"><span class="step-icon">${ico('wallet')}</span><span class="step-num">Step 3</span><h3>Plan with confidence</h3><p>Copy, share or print your results, and move your monthly set-aside into a separate tax pot.</p></li>
</ol>
</section>

<section class="deadline-band" aria-labelledby="deadline-h">
<div class="countdown reveal" data-countdown>
<p class="countdown-eyebrow">${ico('clock')}<span id="deadline-h">Next tax deadline</span></p>
<p class="countdown-days"><span class="countdown-num" data-cd="days">—</span><span class="countdown-unit" data-cd="unit">days to go</span></p>
<p class="countdown-date" data-cd="date">31 January 2027</p>
<p class="countdown-title" data-cd="title">Balancing payment for 2025/26 and first payment on account for 2026/27</p>
<ul class="countdown-later" data-cd-later>
<li><time datetime="2027-07-31">31 Jul 2027</time><span>Second payment on account for 2026/27</span></li>
<li><time datetime="2027-10-05">5 Oct 2027</time><span>Register for Self Assessment if 2026/27 is your first year</span></li>
<li><time datetime="2027-10-31">31 Oct 2027</time><span>Paper tax return deadline for 2026/27</span></li>
</ul>
<a class="countdown-link" href="guides/self-assessment-deadlines-2026-27/">All 2026/27 deadlines${ico('arrow')}</a>
</div>
${sign}
</section>

<section class="products-section" aria-labelledby="products-h">
<div class="section-head">
<h2 id="products-h">Spreadsheets that do it all year</h2>
<p class="section-lead">The calculators give you a quick answer. Our ready-made spreadsheets keep your records, totals and tax set-aside up to date every month — sold through our Etsy shop.</p>
</div>
<ul class="product-grid">
${products}
</ul>
<p class="section-more"><a class="btn btn-soft" href="https://www.etsy.com/shop/TaxReadySheets" data-shop-link target="_blank" rel="noopener">Browse the full shop on Etsy${ico('external')}${NEW_TAB}</a></p>
</section>

<section aria-labelledby="why-h">
<div class="section-head">
<h2 id="why-h">Why use these calculators?</h2>
</div>
<ul class="feature-grid">
<li class="feature reveal"><span class="feature-icon">${ico('check-circle')}</span><h3>Up to date for 2026/27</h3><p>Every rate and threshold sits in one checked file, so all fourteen tools use the same figures — including Scotland's six bands and the new property rates coming in 2027.</p></li>
<li class="feature reveal"><span class="feature-icon">${ico('shield')}</span><h3>Private by design</h3><p>No accounts, cookies, trackers or ads. The maths runs in your browser and the numbers you enter are never saved or sent anywhere.</p></li>
<li class="feature reveal"><span class="feature-icon">${ico('briefcase')}</span><h3>Written for real trades</h3><p>Not just a generic tax sum: price a clean, a dog walk or a set of lashes, check a CIS refund, plan Universal Credit reports or see if Making Tax Digital applies.</p></li>
</ul>
<div class="callout info"><p>Every result is an estimate to help you plan, not tax advice. For anything complicated, check GOV.UK or speak to an accountant.</p></div>
</section>

<section class="guides-section" aria-labelledby="guides-h">
<div class="section-head split">
<h2 id="guides-h">Plain-English tax guides</h2>
<a class="link-arrow" href="guides/">See all guides${ico('arrow')}</a>
</div>
<ul class="guide-grid">
${GUIDES.map((g) => guideCard(g, '')).join('\n')}
</ul>
</section>
</div>
</main>`;
  return h.replace(/<main id="main">[\s\S]*<\/main>/, main);
}

const GUIDE_MINS = {};
function guideCard(g, p, tag = 'h3') {
  return `<li class="guide-card reveal">
<span class="guide-card-icon" aria-hidden="true">${ico(g.icon)}</span>
<p class="guide-card-meta">Guide · ${GUIDE_MINS[g.slug]} min read</p>
<${tag}><a href="${p}guides/${g.slug}/">${g.title.replace(/&/g, '&amp;')}</a></${tag}>
<p>${g.desc.replace(/&/g, '&amp;')}</p>
<span class="calc-card-go" aria-hidden="true">Read the guide${ico('arrow')}</span>
</li>`;
}

function calculatorsIndex() {
  const src = orig('calculators/index.html');
  let h = shell(src, '../');
  const sign = signup(src.match(/<section class="signup" data-signup[\s\S]*?<\/section>/)[0]);
  const crumbs = src.match(/<nav class="crumbs"[\s\S]*?<\/nav>/)[0];
  const lead = src.match(/<p class="lead">[\s\S]*?<\/p>/)[0];
  const main = `<main id="main">
<div class="page-hero">
<div class="wrap">
${crumbs}
<h1>Free UK tax calculators for 2026/27</h1>
${lead}
</div>
</div>
<div class="wrap">
<div id="calculators">
${finder('../', { headingId: 'pick-h', heading: 'Pick a calculator for your work', intro: '<p class="section-lead">Choose your trade or search. Each card shows the group it belongs to.</p>', showGroup: true })}
</div>
${sign}
</div>
</main>`;
  return h.replace(/<main id="main">[\s\S]*<\/main>/, main);
}

function guidesIndex() {
  const src = orig('guides/index.html');
  let h = shell(src, '../');
  const sign = signup(src.match(/<section class="signup" data-signup[\s\S]*?<\/section>/)[0]);
  const crumbs = src.match(/<nav class="crumbs"[\s\S]*?<\/nav>/)[0];
  const lead = src.match(/<p class="lead">[\s\S]*?<\/p>/)[0];
  const main = `<main id="main">
<div class="page-hero">
<div class="wrap">
${crumbs}
<h1>Plain-English tax guides for the self-employed</h1>
${lead}
</div>
</div>
<div class="wrap">
<ul class="guide-grid">
${GUIDES.map((g) => guideCard(g, '../', 'h2')).join('\n')}
</ul>
<p class="section-more">Want numbers rather than reading? Head to the <a href="../calculators/">calculators</a>.</p>
${sign}
</div>
</main>`;
  return h.replace(/<main id="main">[\s\S]*<\/main>/, main);
}

function privacyEdits(h) {
  const a = 'close or refresh the page and it is gone.</p>';
  const b = 'so your browser only talks to this site while you use it.</p>';
  if (!h.includes(a) || !h.includes(b)) throw new Error('privacy text moved');
  h = h.replace(a, `${a}\n<p>If you press <strong>Share link</strong> on a calculator, the figures you typed are added to the page address, so whoever opens the link sees the same numbers. That only happens when you choose to share, and the link goes wherever you send it. Like any web address, it may appear in GitHub Pages' technical logs when someone opens it.</p>`);
  h = h.replace(b, `${b}\n<p>The one thing the site remembers is your choice of light or dark mode, if you pick one. It is saved in your own browser's local storage (as <code>trs-theme</code>), is never sent to us, and disappears if you clear this site's data in your browser.</p>`);
  return h;
}

/* --------------------------------------------------------------- run */

for (const g of GUIDES) {
  const src = orig(`guides/${g.slug}/index.html`);
  const body = src.match(/<p class="checked-note">[\s\S]*?<\/p>\n([\s\S]*?)<aside class="product"/)[1];
  GUIDE_MINS[g.slug] = readingMinutes(body);
}
for (const c of CALCS) write(`calculators/${c.slug}/index.html`, calcPage(`calculators/${c.slug}/index.html`));
for (const g of GUIDES) write(`guides/${g.slug}/index.html`, guidePage(`guides/${g.slug}/index.html`));
write('index.html', homePage());
write('calculators/index.html', calculatorsIndex());
write('guides/index.html', guidesIndex());
write('about/index.html', simplePage('about/index.html', '../'));
write('privacy/index.html', privacyEdits(simplePage('privacy/index.html', '../')));
write('404.html', notFound());
console.log('done', GUIDE_MINS);
