/*
 * TaxReadySheets — runs on every page.
 *  - fills product boxes from products.js
 *  - switches the email sign-up between MailerLite and the Etsy shop link
 * No cookies, no storage, no third-party scripts.
 */

import { SITE, MAILERLITE_FORM_ACTION, MAILERLITE_EMAIL_FIELD } from './site-config.js';
import { PRODUCTS, productUrl } from './products.js';

function fillProducts() {
  document.querySelectorAll('[data-product]').forEach((box) => {
    const key = box.getAttribute('data-product');
    const p = PRODUCTS[key];
    if (!p) return;
    const url = productUrl(key);
    box.querySelectorAll('[data-product-title]').forEach((el) => { el.textContent = p.title; });
    box.querySelectorAll('[data-product-blurb]').forEach((el) => { el.textContent = p.blurb; });
    box.querySelectorAll('a[data-product-link]').forEach((a) => {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  });
  document.querySelectorAll('a[data-shop-link]').forEach((a) => { a.href = SITE.etsyShopUrl; });
}

const THANKS = 'Thanks! Check your inbox to confirm.';

function setupSignups() {
  const action = (MAILERLITE_FORM_ACTION || '').trim();
  document.querySelectorAll('[data-signup]').forEach((block) => {
    const form = block.querySelector('form');
    const fallback = block.querySelector('[data-signup-fallback]');
    const status = block.querySelector('[data-signup-status]');
    if (!form) return;
    // No MailerLite form configured: show the Etsy shop button instead.
    if (!action) {
      form.hidden = true;
      if (fallback) fallback.hidden = false;
      return;
    }
    form.action = action;
    form.method = 'post';
    form.target = '_blank';
    const email = form.querySelector('input[type="email"]');
    email.name = MAILERLITE_EMAIL_FIELD;
    form.hidden = false;
    if (fallback) fallback.hidden = true;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const say = (msg, ok = true) => { if (status) { status.textContent = msg; status.classList.toggle('bad-text', !ok); } };
      // Honeypot: real people never see or fill this field, so quietly drop bot submissions.
      const trap = form.querySelector('[data-hp]');
      if (trap && trap.value) { form.reset(); say(THANKS); return; }
      if (!email.value || !email.checkValidity()) { say('Please enter a valid email address.', false); email.focus(); return; }
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        if (!window.fetch || !window.FormData) throw new Error('fetch unavailable');
        // no-cors: the response is opaque, so a resolved promise means the request was sent.
        await fetch(action, { method: 'POST', mode: 'no-cors', body: new FormData(form) });
        form.reset();
        say(THANKS);
      } catch (err) {
        // Fallback: a normal POST to MailerLite in a new tab, so this page stays open.
        HTMLFormElement.prototype.submit.call(form);
        say('Opening the sign-up confirmation in a new tab…');
      } finally {
        button.disabled = false;
      }
    });
  });
}

fillProducts();
setupSignups();
