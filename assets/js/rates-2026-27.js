/*
 * TaxReadySheets — UK tax rates and thresholds for the 2026/27 tax year
 * (6 April 2026 to 5 April 2027).
 *
 * THIS IS THE ONLY FILE THAT HOLDS RATES. Every calculator reads from it.
 * If the Budget (28 October 2026) or any later announcement changes a figure,
 * edit it here, update LAST_CHECKED, run `node --test` and you are done.
 *
 * Conventions
 *  - Money is in pounds, rates are decimals (0.2 = 20%).
 *  - Income tax band limits are expressed as TAXABLE income (income after the
 *    personal allowance), exactly as HMRC defines the bands. The comments show
 *    the gross-income equivalent for someone with the full £12,570 allowance.
 *  - Dates are ISO strings (YYYY-MM-DD) unless they are display text.
 *
 * Sources (checked for 2026/27):
 *  - Income tax rates and allowances: gov.uk/income-tax-rates
 *  - Scottish income tax: gov.uk/scottish-income-tax
 *  - Self-employed National Insurance: gov.uk/self-employed-national-insurance-rates
 *  - Trading and property allowances: gov.uk/guidance/tax-free-allowances-on-property-and-trading-income
 *  - Rent a Room Scheme: gov.uk/rent-room-in-your-home
 *  - Mileage allowance payments: gov.uk/government/publications/rates-and-allowances-travel-mileage-and-fuel-allowances
 *  - Construction Industry Scheme: gov.uk/what-is-the-construction-industry-scheme
 *  - Making Tax Digital for Income Tax: gov.uk/guidance/check-if-youre-eligible-for-making-tax-digital-for-income-tax
 *  - Digital platform reporting: gov.uk/guidance/reporting-rules-for-digital-platforms
 *  - Property income rates from 2027/28: Budget 2026 (28 October 2026), OOTLAR Annex A — 24%, 44%, 49%
 *  - Trading allowance £3,000 and 35p mileage over 10,000 miles from 6 April 2027: Budget 2026 policy costings
 *  - Mileage 55p from 6 April 2026: gov.uk/simpler-income-tax-simplified-expenses/vehicles
 *  - Self Assessment deadlines and payments on account: gov.uk/self-assessment-tax-returns,
 *    gov.uk/understand-self-assessment-bill/payments-on-account
 */

export const LAST_CHECKED = '29 October 2026';

export const RATES = {
  taxYear: '2026/27',
  taxYearStart: '2026-04-06',
  taxYearEnd: '2027-04-05',
  lastChecked: LAST_CHECKED,

  // Personal allowance. Reduced by £1 for every £2 of adjusted net income
  // over £100,000, so it is nil at £125,140.
  personalAllowance: {
    amount: 12570,
    taperStartsAt: 100000,
    taperRate: 0.5 // £1 lost per £2 over the taper threshold
  },

  incomeTax: {
    // England, Wales and Northern Ireland (Welsh rates currently match).
    rUK: {
      label: 'England, Wales & Northern Ireland',
      bands: [
        { name: 'Basic rate', rate: 0.20, upTo: 37700 },      // £12,571 – £50,270
        { name: 'Higher rate', rate: 0.40, upTo: 125140 },    // £50,271 – £125,140
        { name: 'Additional rate', rate: 0.45, upTo: Infinity } // over £125,140
      ]
    },
    // Scotland: non-savings, non-dividend income (earnings, profits, rent).
    scotland: {
      label: 'Scotland',
      bands: [
        { name: 'Starter rate', rate: 0.19, upTo: 3967 },        // £12,571 – £16,537
        { name: 'Basic rate', rate: 0.20, upTo: 16956 },         // £16,538 – £29,526
        { name: 'Intermediate rate', rate: 0.21, upTo: 31092 },  // £29,527 – £43,662
        { name: 'Higher rate', rate: 0.42, upTo: 62430 },        // £43,663 – £75,000
        { name: 'Advanced rate', rate: 0.45, upTo: 125140 },     // £75,001 – £125,140
        { name: 'Top rate', rate: 0.48, upTo: Infinity }         // over £125,140
      ]
    }
  },

  // Class 4 National Insurance on self-employed profits (UK-wide).
  class4: {
    lowerProfitsLimit: 12570,
    upperProfitsLimit: 50270,
    mainRate: 0.06,  // on profits between the two limits
    upperRate: 0.02  // on profits above the upper limit
  },

  // Class 2 National Insurance: nothing to pay. With profits at or above the
  // small profits threshold you are treated as having paid (you still get the
  // State Pension credit). Below it you can choose to pay voluntarily.
  class2: {
    smallProfitsThreshold: 7105,
    voluntaryWeekly: 3.65,
    weeksInYear: 52
  },

  tradingAllowance: 1000,  // £1,000 tax-free trading income / alternative to expenses
  tradingAllowanceFrom2027: { effectiveFrom: '2027-04-06', taxYear: '2027/28', amount: 3000 }, // Budget 2026
  propertyAllowance: 1000, // £1,000 tax-free property income / alternative to expenses

  rentARoom: {
    full: 7500,   // furnished accommodation in your own home
    shared: 3750  // if someone else also receives income from letting in the same home
  },

  // Rental property income tax. In 2026/27 rent is taxed at the normal rates
  // above and mortgage interest gets a basic-rate tax credit.
  property: {
    financeCostCredit: 0.20,
    // From 6 April 2027 property income has its own rates in England and
    // Northern Ireland. Wales and Scotland set their own rates — the
    // calculators keep today's rates for those nations and say so.
    from2027: {
      effectiveFrom: '2027-04-06',
      taxYear: '2027/28',
      regions: ['england', 'ni'],
      rates: [0.24, 0.44, 0.49], // basic, higher, additional (same band limits as rUK above) — Budget 2026
      financeCostCredit: 0.24
    }
  },

  // HMRC approved mileage allowance payments (business miles in a tax year).
  // 55p from 6 April 2026 (raised from 45p in May 2026, backdated). From
  // 6 April 2027 the rate over 10,000 miles rises from 25p to 35p (Budget 2026).
  mileage: {
    carVan: { firstRate: 0.55, laterRate: 0.25, threshold: 10000 },
    from2027: { effectiveFrom: '2027-04-06', taxYear: '2027/28', carVanLaterRate: 0.35 },
    motorcycle: 0.24,
    bicycle: 0.20
  },

  // Construction Industry Scheme deduction rates (applied to labour, not materials).
  cis: {
    registered: 0.20,
    unregistered: 0.30,
    grossPayment: 0
  },

  // Making Tax Digital for Income Tax. "Qualifying income" = gross
  // self-employment turnover + gross property income (before expenses).
  // HMRC uses the figure from the tax return two years earlier.
  mtd: [
    { startDate: '2026-04-06', startLabel: '6 April 2026', taxYear: '2026/27', over: 50000, basedOn: '2024/25' },
    { startDate: '2027-04-06', startLabel: '6 April 2027', taxYear: '2027/28', over: 30000, basedOn: '2025/26' },
    { startDate: '2028-04-06', startLabel: '6 April 2028', taxYear: '2028/29', over: 20000, basedOn: '2026/27' }
  ],
  mtdQuarterlyDeadlines: ['7 August', '7 November', '7 February', '7 May'],

  // Digital platform reporting (Vinted, eBay, Etsy, Airbnb…). Platforms send
  // HMRC details of sellers with 30+ sales OR about £1,700 (EUR 2,000) or more
  // in a calendar year. Being reported is not a tax in itself.
  platformReporting: {
    salesCount: 30,
    approxGBP: 1700,
    eur: 2000
  },

  // Self Assessment for the 2026/27 tax year.
  selfAssessment: {
    registerBy: '5 October 2027',
    paperDeadline: '31 October 2027',
    onlineDeadline: '31 January 2028',
    balancingPayment: '31 January 2028',
    firstPaymentOnAccount: '31 January 2027',
    secondPaymentOnAccount: '31 July 2027',
    nextYearFirstPaymentOnAccount: '31 January 2028',
    nextYearSecondPaymentOnAccount: '31 July 2028',
    // Payments on account are due when the bill is over £1,000 AND less
    // than 80% of your tax was collected at source (e.g. PAYE).
    paymentsOnAccountThreshold: 1000,
    collectedAtSourceLimit: 0.8
  }
};
