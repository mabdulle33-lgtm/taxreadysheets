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

function setupSignups() {
  const action = (MAILERLITE_FORM_ACTION || '').trim();
  if (!action) return; // static HTML already shows the Etsy shop button
  document.querySelectorAll('[data-signup]').forEach((block) => {
    const form = block.querySelector('form');
    const fallback = block.querySelector('[data-signup-fallback]');
    const status = block.querySelector('[data-signup-status]');
    if (!form) return;
    form.action = action;
    form.method = 'post';
    form.querySelector('input[type="email"]').name = MAILERLITE_EMAIL_FIELD;
    form.hidden = false;
    if (fallback) fallback.hidden = true;
    form.addEventListener('submit', async (e) => {
      // Send in the background so the visitor stays on the page. If that
      // fails for any reason, fall back to a normal form post.
      if (!window.fetch) return;
      e.preventDefault();
      const button = form.querySelector('button');
      button.disabled = true;
      try {
        await fetch(action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
        form.reset();
        if (status) status.textContent = 'Thanks! Check your inbox to confirm your email address.';
      } catch (err) {
        form.submit();
      } finally {
        button.disabled = false;
      }
    });
  });
}

fillProducts();
setupSignups();
