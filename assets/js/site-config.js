/*
 * TaxReadySheets — site settings. Edit this file, not the pages.
 */

export const SITE = {
  name: 'TaxReadySheets',
  tagline: 'Free UK tax calculators for the self-employed',

  // The live address of the site, with a trailing slash. It is also written
  // into each page's canonical/Open Graph tags, sitemap.xml and robots.txt
  // (search engines need it in plain HTML). To move the site, change it here
  // and run:  node tools/set-base-url.mjs
  baseUrl: 'https://taxreadysheets.co.uk/',

  etsyShopUrl: 'https://www.etsy.com/shop/TaxReadySheets'
};

/*
 * ===================== MAILERLITE_FORM_ACTION =====================
 * Paste the "action" URL from your MailerLite embedded form between the
 * quotes, e.g. 'https://assets.mailerlite.com/jsonp/123456/forms/987654321/subscribe'
 *
 * While this is empty, every "Free UK tax deadline reminders" box shows a
 * button to the Etsy shop instead of an email field.
 * ==================================================================
 */
export const MAILERLITE_FORM_ACTION = 'https://assets.mailerlite.com/jsonp/2747334/forms/202498295451354728/subscribe';

// The name MailerLite gives its email field. Only change it if your embed code uses a different name.
export const MAILERLITE_EMAIL_FIELD = 'fields[email]';
