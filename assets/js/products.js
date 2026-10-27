/*
 * TaxReadySheets — Etsy products. Every product box on the site is filled
 * from this file. To change a listing, edit its id (the number in
 * https://www.etsy.com/listing/ID) or its wording here.
 */

export const ETSY_LISTING_BASE = 'https://www.etsy.com/listing/';

export const PRODUCTS = {
  bookkeeping: {
    id: '4595071195',
    title: 'Sole Trader Bookkeeping Spreadsheet',
    blurb: 'Log income and expenses as you go and see your profit, tax estimate and set-aside figure update automatically — ready for Self Assessment and Making Tax Digital record-keeping.'
  },
  mileage: {
    id: '4595882837',
    title: 'HMRC Mileage Log Spreadsheet',
    blurb: 'Record every business journey with date, purpose and miles. The 45p/25p switch at 10,000 miles is worked out for you, so your claim is ready when you file.'
  },
  cleaning: {
    id: '4596163618',
    title: 'Cleaning Business Spreadsheet',
    blurb: 'Track clients, jobs, supplies and payments in one place, with running profit and tax set-aside totals for your cleaning business.'
  },
  tutor: {
    id: '4597423130',
    title: 'Private Tutor Income & Expenses Tracker',
    blurb: 'Keep lessons, student payments, resources and travel in one tidy sheet and always know what to put aside for tax.'
  },
  universalCredit: {
    id: '4600811594',
    title: 'Universal Credit Self-Employed Reporting Tracker',
    blurb: 'Total your income and expenses for each assessment period so your monthly UC report takes minutes, not an evening.'
  },
  cis: {
    id: '4601531848',
    title: 'CIS Tax Refund Tracker',
    blurb: 'Log every payment and CIS deduction from each contractor, plus materials and expenses, and watch your estimated refund build up through the year.'
  },
  beauty: {
    id: '4601518891',
    title: 'Beauty Business Spreadsheet',
    blurb: 'Track appointments, product costs, chair or room rent and takings — with service pricing and tax set-aside built in for hair, nails, lashes and brows.'
  },
  reseller: {
    id: '4602486846',
    title: 'Vinted & Reseller Profit Tracker',
    blurb: 'Record what each item cost, what it sold for and the fees and postage, so you can see real profit and have evidence ready if HMRC asks.'
  },
  dogWalker: {
    id: '4602464525',
    title: 'Dog Walker & Pet Sitter Spreadsheet',
    blurb: 'Manage walks, visits, client payments, mileage and costs, with your profit and tax set-aside updated as you go.'
  },
  landlord: {
    id: '4603537833',
    title: 'Landlord Rental Income Spreadsheet',
    blurb: 'Track rent, costs and mortgage interest per property, see profit after tax and keep digital records ready for Making Tax Digital.'
  },
  childminder: {
    id: '4603556166',
    title: 'Childminder Accounts Spreadsheet',
    blurb: 'Record fees, funded hours, food, resources and use-of-home costs, and see your take-home pay and tax estimate month by month.'
  },
  airbnb: {
    id: '4604244047',
    title: 'Airbnb Host Income & Expenses Tracker',
    blurb: 'Log bookings, platform fees, cleaning and bills, and compare Rent a Room, the property allowance and actual expenses for your own figures.'
  },
  driver: {
    id: '4604271596',
    title: 'Taxi, Uber & Delivery Driver Spreadsheet',
    blurb: 'Track fares, platform fees, fuel and mileage side by side and see which HMRC method saves you more tax.'
  }
};

export function productUrl(key) {
  const p = PRODUCTS[key];
  return p ? ETSY_LISTING_BASE + p.id : null;
}
