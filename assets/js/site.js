/*
 * TaxReadySheets — runs on every page.
 *  - fills product boxes from products.js
 *  - switches the email sign-up between MailerLite and the Etsy shop link
 *  - mobile menu, light/dark switch, gentle scroll reveal, inline help
 * No cookies, no tracking, no third-party scripts. The only thing saved is
 * the light/dark choice (see theme-init.js).
 */

import { SITE, MAILERLITE_FORM_ACTION, MAILERLITE_EMAIL_FIELD } from './site-config.js';
import { PRODUCTS, productUrl } from './products.js';
import { setupTips } from './calc-tools.js';

const root = document.documentElement;
const THEME_KEY = 'trs-theme';
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function currentTheme() {
  const set = root.getAttribute('data-theme');
  if (set === 'light' || set === 'dark') return set;
  return darkQuery && darkQuery.matches ? 'dark' : 'light';
}

function setupTheme() {
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  const meta = document.querySelector('meta[name="theme-color"]');
  const paint = () => {
    const t = currentTheme();
    buttons.forEach((b) => {
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      b.setAttribute('aria-pressed', String(t === 'dark'));
    });
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b1f21' : '#0F5257');
  };
  buttons.forEach((b) => b.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { window.localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage blocked: choice lasts until the page closes */ }
    paint();
  }));
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', paint);
  paint();
}

function setupMenu() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('site-nav');
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  if (!toggle || !nav) return;
  const set = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 52rem)').addEventListener?.('change', (m) => { if (m.matches) set(false); });
}

/* Highlight the "On this page" link for the section being read. */
function setupToc() {
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const targets = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  const mark = (id) => links.forEach((a) => {
    if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  const io = new IntersectionObserver((entries) => {
    const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (seen) mark(seen.target.id);
  }, { rootMargin: '-15% 0px -70% 0px' });
  targets.forEach((t) => io.observe(t));
}

function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length || !('IntersectionObserver' in window) || (reduceMotion && reduceMotion.matches)) return;
  // Anything already on screen stays put; only what is further down fades in.
  items.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible'); });
  root.classList.add('reveal-ready');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  items.forEach((el) => io.observe(el));
}

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

setupTheme();
setupMenu();
fillProducts();
setupSignups();
setupTips();
setupReveal();
setupToc();
if (document.querySelector('[data-finder]')) import('./finder.js').then((m) => m.setupFinder()).catch((err) => console.error(err));
