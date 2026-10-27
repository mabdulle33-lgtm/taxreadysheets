/*
 * TaxReadySheets — extras for calculator forms: sliders paired with number
 * boxes, inline help, and the Copy / Share link / Print / Reset buttons.
 * Everything here runs in the browser only. Nothing is stored or sent:
 * "Share link" just puts the figures into the page address.
 */

import { decodeState, shareUrl } from './share.js';

/* ---------- reading the form ---------- */

function fieldKinds(form) {
  const kinds = {};
  for (const el of form.elements) {
    if (!el.name || el.type === 'hidden') continue;
    kinds[el.name] = el.type === 'checkbox' ? 'checkbox' : el.type === 'number' ? 'number' : 'choice';
  }
  return kinds;
}

function formValues(form) {
  const values = {};
  for (const el of form.elements) {
    if (!el.name || el.type === 'hidden') continue;
    if (el.type === 'checkbox') values[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) values[el.name] = el.value; }
    else values[el.name] = el.value;
  }
  return values;
}

/** Fill the form from ?field=value in the address. Returns true if anything was applied. */
export function restoreFromQuery(form, search = location.search) {
  if (!form || !search) return false;
  const state = decodeState(search, fieldKinds(form));
  let applied = false;
  for (const [name, value] of Object.entries(state)) {
    const els = [...form.elements].filter((el) => el.name === name);
    for (const el of els) {
      if (el.type === 'checkbox') { el.checked = value; applied = true; }
      else if (el.type === 'radio') { if (el.value === value) { el.checked = true; applied = true; } }
      else if (el.tagName === 'SELECT') { if ([...el.options].some((o) => o.value === value)) { el.value = value; applied = true; } }
      else { el.value = value; applied = true; }
    }
  }
  return applied;
}

/* ---------- sliders ---------- */

function setFill(range) {
  const min = Number(range.min) || 0;
  const max = Number(range.max) || 100;
  const pct = max > min ? ((Number(range.value) - min) / (max - min)) * 100 : 0;
  range.style.setProperty('--fill', `${Math.min(100, Math.max(0, pct))}%`);
}

/** Bring every slider back in line with its number box (after reset or a shared link). */
export function syncSliders(form) {
  form.querySelectorAll('input[type="range"][data-for]').forEach((range) => {
    const input = form.querySelector(`#${CSS.escape(range.dataset.for)}`);
    if (!input) return;
    const n = parseFloat(input.value);
    range.value = Number.isFinite(n) ? String(Math.min(Number(range.max), Math.max(Number(range.min), n))) : range.min;
    setFill(range);
  });
}

function addSliders(form) {
  form.querySelectorAll('input[type="number"][data-range]').forEach((input) => {
    const [min, max, step] = input.dataset.range.split(/\s+/);
    const range = document.createElement('input');
    range.type = 'range';
    range.className = 'range';
    range.min = min; range.max = max; range.step = step || '1';
    range.dataset.for = input.id;
    // The number box is the accessible control; the slider is a mouse/touch shortcut for it.
    range.setAttribute('aria-hidden', 'true');
    range.tabIndex = -1;
    const wrap = input.closest('.input-wrap') || input;
    wrap.insertAdjacentElement('afterend', range);
    range.addEventListener('input', () => {
      input.value = range.value;
      setFill(range);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    input.addEventListener('input', () => syncSliders(form));
  });
  syncSliders(form);
}

/* ---------- inline help ---------- */

function closeTips(except) {
  document.querySelectorAll('.tip[aria-expanded="true"]').forEach((b) => {
    if (b === except) return;
    b.setAttribute('aria-expanded', 'false');
    const pop = document.getElementById(b.getAttribute('aria-controls'));
    if (pop) pop.classList.remove('is-open');
  });
}

export function setupTips(root = document) {
  root.querySelectorAll('.tip[aria-controls]').forEach((btn) => {
    const pop = document.getElementById(btn.getAttribute('aria-controls'));
    if (!pop || btn.dataset.ready) return;
    btn.dataset.ready = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeTips(btn);
      btn.setAttribute('aria-expanded', String(open));
      pop.classList.toggle('is-open', open);
    });
  });
  if (!document.documentElement.dataset.tipsReady) {
    document.documentElement.dataset.tipsReady = '1';
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.tip[aria-expanded="true"]');
      closeTips();
      if (open) open.focus();
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.tip, .tip-pop')) closeTips(); });
  }
}

/* ---------- copy / share / print / reset ---------- */

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch (err) { /* fall through to the old way */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
  ta.remove();
  return ok;
}

const tidy = (s) => (s || '').replace(/\s+/g, ' ').trim();

/** Plain-text summary of the page's inputs and results. */
export function resultsText(form, results, url) {
  const lines = [];
  const h1 = document.querySelector('h1');
  if (h1) lines.push(tidy(h1.textContent), '');
  lines.push('Your figures');
  form.querySelectorAll('.field, .check, fieldset').forEach((f) => {
    if (f.closest('fieldset') && f.tagName !== 'FIELDSET') return;
    const input = f.querySelector('input:not([type="range"]):not([type="hidden"]), select');
    if (!input) return;
    let label; let value;
    if (f.tagName === 'FIELDSET') {
      label = tidy(f.querySelector('legend')?.textContent);
      const checked = [...f.querySelectorAll('input:checked')].map((i) => tidy(i.closest('label')?.textContent));
      value = checked.join(', ') || '—';
    } else if (input.type === 'checkbox') {
      label = tidy(f.querySelector('label')?.textContent);
      value = input.checked ? 'Yes' : 'No';
    } else {
      label = tidy(f.querySelector('label')?.textContent);
      value = input.tagName === 'SELECT' ? tidy(input.selectedOptions[0]?.textContent) : (input.value === '' ? '—' : input.value);
      const pre = tidy(f.querySelector('.prefix')?.textContent);
      const suf = tidy(f.querySelector('.suffix')?.textContent);
      if (input.value !== '') value = `${pre}${value}${suf ? ' ' + suf : ''}`;
    }
    if (label) lines.push(`- ${label}: ${value}`);
  });
  lines.push('', tidy(results.querySelector('h2')?.textContent) || 'Results');
  const bigLabel = tidy(results.querySelector('.big-label')?.textContent);
  const bigNumber = tidy(results.querySelector('.big-number')?.textContent);
  if (bigLabel || bigNumber) lines.push(`${bigLabel}: ${bigNumber}`);
  results.querySelectorAll('table').forEach((t) => {
    const head = [...t.querySelectorAll('thead th')].map((th) => tidy(th.textContent));
    t.querySelectorAll('tbody tr').forEach((tr) => {
      const cells = [...tr.children].map((c) => tidy(c.textContent));
      const [first, ...rest] = cells;
      lines.push(`- ${first}: ${rest.map((v, i) => (head[i + 1] ? `${head[i + 1]} ${v}` : v)).join(' | ')}`);
    });
  });
  results.querySelectorAll('.result-list > div').forEach((row) => {
    if (row.hidden) return;
    const dt = row.querySelector('dt'); const dd = row.querySelector('dd');
    if (dt && dd) lines.push(`- ${tidy(dt.firstChild?.textContent ?? dt.textContent)}: ${tidy(dd.textContent)}`);
  });
  results.querySelectorAll('.callout, .hint').forEach((n) => {
    if (n.closest('[hidden]') || n.hidden || n.closest('.tip-pop')) return;
    const t = tidy(n.textContent);
    if (t) lines.push('', t);
  });
  lines.push('', `Link: ${url}`, 'Estimates only, not tax advice — TaxReadySheets');
  return lines.join('\n');
}

function setupActions(form, run) {
  const bar = document.querySelector('[data-calc-actions]');
  const results = document.getElementById('results');
  if (!bar || !results) return;
  const status = document.querySelector('[data-action-status]');
  let timer;
  const say = (msg) => {
    if (!status) return;
    status.textContent = msg;
    clearTimeout(timer);
    timer = setTimeout(() => { status.textContent = ''; }, 6000);
  };
  bar.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const url = shareUrl(location.href, formValues(form));
    if (action === 'copy') {
      say((await copyText(resultsText(form, results, url))) ? 'Results copied — paste them into a note, email or message.' : 'Sorry, your browser blocked copying. Select the results and copy them instead.');
    } else if (action === 'share') {
      history.replaceState(null, '', url);
      const title = document.title;
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ title, url }); say('Link ready to share.'); return; } catch (err) { if (err && err.name === 'AbortError') return; }
      }
      say((await copyText(url)) ? 'Link copied. Anyone who opens it sees these same figures.' : `Copy this link: ${url}`);
    } else if (action === 'print') {
      window.print();
    } else if (action === 'reset') {
      form.reset();
      history.replaceState(null, '', location.pathname);
      syncSliders(form);
      run();
      say('Reset to the example figures.');
    }
  });
}

/** Called by bindForm once the first results are on screen. */
export function enhanceCalculator(form, run, { restored = false, actions = true } = {}) {
  addSliders(form);
  setupTips(form.closest('main') || document);
  if (actions) setupActions(form, run);
  if (restored) {
    const status = document.querySelector('[data-action-status]');
    if (status) status.textContent = 'Showing the figures from a shared link. Press Reset to start again.';
  }
}

