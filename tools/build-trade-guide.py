#!/usr/bin/env python3
"""One-off generator: builds guides/2025-26-tax-return-by-trade/ from the
31 January checklist page, so header, footer, sign-up and related blocks match.
Run from the repo root: python3 tools/build-trade-guide.py"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "guides/self-assessment-january-2027-checklist/index.html"
SLUG = "2025-26-tax-return-by-trade"
OUT = ROOT / "guides" / SLUG / "index.html"
URL = f"https://taxreadysheets.co.uk/guides/{SLUG}/"

TITLE = "2025/26 Tax Return by Trade: What to Claim Before 31 January 2027"
H1 = "Your 2025/26 tax return, trade by trade"
DESC = ("What CIS subcontractors, drivers, beauty pros, resellers, Universal Credit claimants, dog walkers "
        "and childminders need for the 2025/26 return due on 31 January 2027.")
LEAD = ("The general rules are the same for every sole trader, but each trade has its own traps on the 2025/26 return: "
        "CIS deductions to claim back, the old 45p mileage rate, platform reports, childminder home costs. "
        "Find your trade below, check the points that apply, and file before 31 January 2027.")

KIT = '<p class="callout info"><strong>Spreadsheet:</strong> our <a href="https://www.etsy.com/listing/{id}" target="_blank" rel="noopener">{name}<span class="visually-hidden"> (opens in a new tab)</span></a> now comes with a 2025/26 edition as well as 2026/27, so you can finish this return and start next year\'s records in the same layout. <a href="https://payhip.com/b/{ph}" target="_blank" rel="noopener">Or buy it direct<span class="visually-hidden"> (opens in a new tab)</span></a>. Free tool: <a href="../../calculators/{calc}/">{calcname}</a>.</p>'

def kit(id, name, ph, calc, calcname):
    return KIT.format(id=id, name=name, ph=ph, calc=calc, calcname=calcname)

TOC = [("whats-due", "What is due on 31 January"), ("figures", "The 2025/26 figures"),
       ("cis", "CIS subcontractors"), ("drivers", "Taxi, private hire and delivery drivers"),
       ("beauty", "Hair and beauty"), ("resellers", "Vinted, eBay and Depop sellers"),
       ("universal-credit", "Self-employed on Universal Credit"), ("dog-walkers", "Dog walkers and pet sitters"),
       ("childminders", "Childminders"), ("faq-h", "Frequently asked questions")]

BODY = f"""<h2 id="whats-due">What is due on 31 January 2027</h2>
<p>Whatever your trade, by 11:59pm on <strong>31 January 2027</strong> you need to file your <strong>2025/26</strong> return online (it covers 6 April 2025 to 5 April 2026), pay any tax still owed for that year and, if HMRC asks for them, make your first payment on account for 2026/27. You can file any time from now: if you are due a refund, the sooner you file the sooner it arrives. Our <a href="../self-assessment-january-2027-checklist/">31 January checklist</a> covers what to gather, payments on account and what to do if you cannot pay.</p>

<h2 id="figures">The 2025/26 figures every trade needs</h2>
<p>The most common slip is using this year's numbers on last year's return. For 2025/26:</p>
<div class="table-scroll" tabindex="0"><table class="compare">
<thead><tr><th>Item</th><th>2025/26</th></tr></thead>
<tbody>
<tr><td>Personal allowance</td><td>£12,570</td></tr>
<tr><td>Class 4 National Insurance</td><td>6% on profits £12,570 to £50,270, 2% above</td></tr>
<tr><td>Mileage (cars and vans)</td><td>45p a mile for the first 10,000 business miles, then 25p (55p only starts in 2026/27)</td></tr>
<tr><td>Trading allowance</td><td>£1,000</td></tr>
<tr><td>Working from home (flat rate)</td><td>£10, £18 or £26 a month for 25 to 50, 51 to 100, or 101+ hours</td></tr>
</tbody>
</table></div>

<h2 id="cis">CIS subcontractors</h2>
<p>Your tax return is how you get back CIS tax taken off your pay. Most subcontractors are owed money, because the 20% is taken before any allowance or expenses.</p>
<ul>
<li><strong>Put your gross pay in as income,</strong> not the amount that reached your bank, then enter the total CIS deducted in its own box (box 38 on the short self-employment pages, box 81 on the full pages).</li>
<li><strong>Collect every monthly statement</strong> from each contractor for 6 April 2025 to 5 April 2026. If one is missing, ask the contractor for it: you can only claim back deductions you can show.</li>
<li><strong>Check materials:</strong> CIS should only be taken from the labour part of an invoice. If a contractor deducted 20% from materials too, query it.</li>
<li><strong>Claim your costs:</strong> tools, workwear, van or 45p mileage, phone, insurance and training all reduce your profit and increase your refund.</li>
</ul>
{kit('4601531848', 'CIS Tax Refund Tracker', '7rJpZ', 'cis-tax-refund-calculator', 'CIS tax refund calculator')}

<h2 id="drivers">Taxi, private hire and delivery drivers</h2>
<ul>
<li><strong>Use 45p a mile for 2025/26,</strong> not 55p. The new rate only applies to miles from 6 April 2026.</li>
<li><strong>Pick one method per vehicle:</strong> either the mileage rate, or actual costs (fuel, repairs, insurance, plus capital allowances on the car). Once you have claimed actual costs and capital allowances on a vehicle, you cannot switch that vehicle to the mileage rate.</li>
<li><strong>Use your full fares as income</strong> and claim the app's commission or service fee as an expense, so your figures line up with the annual statement the platform gives you and reports to HMRC.</li>
<li><strong>Don't forget the extras:</strong> licence and badge fees, private hire insurance, phone and data, car cleaning and parking.</li>
</ul>
{kit('4604271596', 'Taxi, Uber &amp; Delivery Driver Spreadsheet', 'xZHf0', 'taxi-delivery-driver-tax-calculator', 'driver tax calculator')}

<h2 id="beauty">Hair and beauty</h2>
<ul>
<li><strong>Chair or room rent is a business cost,</strong> as are products, towels, PPE, insurance and booking-app fees.</li>
<li><strong>Tips count as income,</strong> whether paid in cash, by card or through an app.</li>
<li><strong>Training:</strong> courses that keep your existing skills up to date are allowable. A course for a brand-new skill or service usually is not.</li>
<li><strong>Got a salon job as well?</strong> Add your P60 to the return, so your allowance and tax bands are used correctly across both.</li>
</ul>
{kit('4601518891', 'Beauty Business Spreadsheet', 'a0zkl', 'hair-beauty-price-calculator', 'hair and beauty price calculator')}

<h2 id="resellers">Vinted, eBay and Depop sellers</h2>
<ul>
<li><strong>Selling your own unwanted things is not taxed.</strong> Buying items to sell on for a profit, or making things to sell, is trading.</li>
<li><strong>Platform reports are not tax bills.</strong> Sites report sellers with 30 or more sales, or about £1,700 or more, in a calendar year. Being reported does not mean you owe tax, but if you were trading, HMRC can compare their figures with your return.</li>
<li><strong>Trading income of £1,000 or less</strong> in 2025/26 (before costs) is covered by the trading allowance, so you don't need to declare it.</li>
<li><strong>Profit is sales minus costs:</strong> what you paid for the items you sold, platform fees, postage and packaging.</li>
</ul>
{kit('4602486846', 'Vinted &amp; Reseller Profit Tracker', 'J9eZM', 'vinted-ebay-hmrc-checker', 'Vinted and eBay HMRC checker')}

<h2 id="universal-credit">Self-employed on Universal Credit</h2>
<ul>
<li><strong>Universal Credit itself does not go on your tax return.</strong> It is not taxable.</li>
<li><strong>Don't copy your monthly UC figures across.</strong> UC looks at each monthly assessment period, while your return covers the whole year to 5 April 2026. Use your own income and expense records for the year.</li>
<li><strong>The £1,000 trading allowance only applies to tax.</strong> Universal Credit does not recognise it, so small amounts of self-employed income still need reporting to the DWP each month.</li>
</ul>
{kit('4600811594', 'Universal Credit Self-Employed Reporting Tracker', 'JzQWc', 'universal-credit-reporting-dates', 'Universal Credit reporting dates')}

<h2 id="dog-walkers">Dog walkers and pet sitters</h2>
<ul>
<li><strong>Claim 45p a mile</strong> for driving between clients, parks and the vet, or actual costs if you use a dedicated van.</li>
<li><strong>Everyday costs add up:</strong> insurance, DBS checks, leads, poo bags, treats, first-aid courses and your booking or invoicing app.</li>
<li><strong>Home boarding or day care?</strong> Your council licence fee is a business cost, and if you work at home for 25 hours or more a month you can use the working-from-home flat rate.</li>
</ul>
{kit('4602464525', 'Dog Walker &amp; Pet Sitter Spreadsheet', '9THNr', 'dog-walking-price-calculator', 'dog walking price calculator')}

<h2 id="childminders">Childminders</h2>
<ul>
<li><strong>For 2025/26 you can still use HMRC's childminder method</strong> (set out in its manual at BIM52751): a share of household bills based on the hours you work, an estimate for the food you give the children, and a 10% deduction for wear and tear.</li>
<li><strong>All your fees count as income,</strong> including funded hours paid by the council and payments made through Tax-Free Childcare.</li>
<li><strong>Next year may be different:</strong> from April 2026, childminders who are in Making Tax Digital have to use the standard rules for home costs instead. That affects 2026/27 records, not this return.</li>
</ul>
{kit('4603556166', 'Childminder Accounts Spreadsheet', '0mhUJ', 'childminder-tax-calculator', 'childminder tax calculator')}
<p class="small">Sources: GOV.UK guidance on Self Assessment, CIS for subcontractors, simplified expenses and the trading allowance; HMRC's Business Income Manual (BIM52751, childminders); HMRC guidance on digital platform reporting; LITRG guidance on Universal Credit and self-employment. This page explains the rules in plain English and is not tax advice.</p>
"""

FAQ = [
    ("Do I use 45p or 55p a mile on my 2025/26 return?",
     "45p for the first 10,000 business miles and 25p after that. The 55p rate only applies to miles driven from 6 April 2026, so it belongs on your 2026/27 return."),
    ("Can I file my 2025/26 return now?",
     "Yes. You could file it from 6 April 2026, and the deadline is 31 January 2027. If you are due a refund, for example as a CIS subcontractor, filing early means you get it sooner."),
    ("I got a message from Vinted about HMRC. Do I have to pay tax?",
     "Not necessarily. Platforms report sellers with 30 or more sales or about £1,700 or more in a calendar year. Selling your own unwanted things is not taxed. You only need to declare it if you were trading, such as buying items to resell, and your trading income was over £1,000."),
    ("Does Universal Credit go on my tax return?",
     "No. Universal Credit is not taxable, so it is not included. You report your self-employed income and expenses for the tax year as normal."),
]

def faq_ld():
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
        ensure_ascii=False, separators=(",", ":"))

h = SRC.read_text()
old_url = "https://taxreadysheets.co.uk/guides/self-assessment-january-2027-checklist/"

# head
h = re.sub(r"<title>.*?</title>", f"<title>{TITLE}</title>", h, count=1)
h = re.sub(r'(<meta name="description" content=")[^"]*', r"\g<1>" + DESC, h, count=1)
h = re.sub(r'(<meta property="og:title" content=")[^"]*', r"\g<1>" + TITLE, h, count=1)
h = re.sub(r'(<meta property="og:description" content=")[^"]*', r"\g<1>" + DESC, h, count=1)
h = h.replace(f'href="{old_url}"', f'href="{URL}"').replace(f'content="{old_url}"', f'content="{URL}"')
article = {"@context": "https://schema.org", "@type": "Article", "headline": H1, "description": DESC,
           "datePublished": "2026-11-20", "dateModified": "2026-11-20", "mainEntityOfPage": URL,
           "author": {"@type": "Organization", "name": "TaxReadySheets", "url": "https://taxreadysheets.co.uk/"},
           "publisher": {"@type": "Organization", "name": "TaxReadySheets", "url": "https://taxreadysheets.co.uk/"}}
crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://taxreadysheets.co.uk/"},
    {"@type": "ListItem", "position": 2, "name": "Guides", "item": "https://taxreadysheets.co.uk/guides/"},
    {"@type": "ListItem", "position": 3, "name": H1, "item": URL}]}
lds = re.findall(r'<script type="application/ld\+json">.*?</script>', h)
assert len(lds) == 3
for old, new in zip(lds, [article, crumbs, None]):
    body = faq_ld() if new is None else json.dumps(new, ensure_ascii=False, separators=(",", ":"))
    h = h.replace(old, f'<script type="application/ld+json">{body}</script>', 1)

# hero
h = re.sub(r'(<li aria-current="page">)[^<]*(</li></ol></nav>)', r"\g<1>" + H1 + r"\g<2>", h, count=1)
h = h.replace(">6 min read<", ">7 min read<", 1)
h = re.sub(r"<h1>.*?</h1>", f"<h1>{H1}</h1>", h, count=1)
h = re.sub(r'<p class="lead">.*?</p>', f'<p class="lead">{LEAD}</p>', h, count=1, flags=re.S)
h = h.replace("last reviewed 29 October 2026.</span>", "last reviewed 20 November 2026.</span>", 1)

# toc
toc = "<ol>\n" + "\n".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in TOC) + "\n</ol>"
h = re.sub(r'(<nav class="toc"[^>]*>\s*<p class="toc-title".*?</p>\s*)<ol>.*?</ol>', lambda m: m.group(1) + toc, h, count=1, flags=re.S)
h = re.sub(r'<a class="toc-cta" href="[^"]*">(.*?)<span><strong>Run the numbers</strong>[^<]*</span></a>',
           lambda m: f'<a class="toc-cta" href="../../calculators/self-employed-tax-calculator/">{m.group(1)}<span><strong>Run the numbers</strong>Self-employed tax calculator</span></a>',
           h, count=1, flags=re.S)

# body: everything from the first h2 to the end of the sources line, replaced
h = re.sub(r'<div class="content article-body">.*?<p class="small">Sources:.*?</p>\n',
           lambda m: '<div class="content article-body">\n' + BODY, h, count=1, flags=re.S)

# faq
faq_html = '<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">Frequently asked questions</h2>\n' + "\n".join(
    f"<details><summary>{q}</summary><div><p>{a}</p></div></details>" for q, a in FAQ) + "\n</section>"
h = re.sub(r'<section class="faq".*?</section>', lambda m: faq_html, h, count=1, flags=re.S)

# related: swap the self-link-free set (point one card at the January checklist)
h = h.replace('href="../../guides/self-assessment-deadlines-2026-27/"', 'href="../../guides/self-assessment-january-2027-checklist/"', 1)
h = h.replace("Self Assessment deadlines for 2026/27</span>", "31 January 2027: your Self Assessment checklist</span>", 1)

assert "aria-current=\"page\">" + H1 in h and "checklist/\">31 January checklist" in h
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(h)
print("wrote", OUT.relative_to(ROOT), len(h))
