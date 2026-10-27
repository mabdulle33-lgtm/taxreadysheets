/*
 * TaxReadySheets — "What do you do?" picker and search for the calculator grid.
 * Without JavaScript every card simply shows.
 */

/** Lower-case, accent-free words for matching. */
export function normalise(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9£]+/g, ' ').trim();
}

/**
 * Does a card match the chosen trade and the search words?
 * @param {{ trades: string[], text: string }} card  trades may include 'all' (shows for every trade)
 * @param {{ trade?: string, query?: string }} filter
 */
export function cardMatches(card, { trade = 'all', query = '' } = {}) {
  const tradeOk = trade === 'all' || card.trades.includes('all') || card.trades.includes(trade);
  if (!tradeOk) return false;
  const words = normalise(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = normalise(card.text);
  return words.every((w) => hay.includes(w));
}

export function setupFinder() {
  document.querySelectorAll('[data-finder]').forEach((finder) => {
    const chips = [...finder.querySelectorAll('[data-filter]')];
    const search = finder.querySelector('[data-finder-search]');
    const count = finder.querySelector('[data-finder-count]');
    const empty = finder.querySelector('[data-finder-empty]');
    const cards = [...finder.querySelectorAll('[data-trades]')].map((el) => ({
      el,
      trades: el.dataset.trades.split(/\s+/),
      text: `${el.textContent} ${el.dataset.keywords || ''}`
    }));
    let trade = 'all';

    const apply = () => {
      const query = search ? search.value : '';
      let shown = 0;
      cards.forEach((c) => {
        const ok = cardMatches(c, { trade, query });
        c.el.hidden = !ok;
        if (ok && !c.el.classList.contains('card-extra')) shown += 1;
      });
      if (empty) empty.hidden = shown > 0;
      if (count) {
        const total = cards.filter((c) => !c.el.classList.contains('card-extra')).length;
        count.textContent = shown === total ? `Showing all ${total} calculators` : `Showing ${shown} of ${total} calculators`;
      }
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      trade = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      apply();
    }));
    if (search) {
      search.addEventListener('input', apply);
      search.closest('form')?.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
    }
    const reset = finder.querySelector('[data-finder-reset]');
    if (reset) reset.addEventListener('click', () => {
      trade = 'all';
      if (search) search.value = '';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === 'all')));
      apply();
      if (search) search.focus();
    });
    apply();
  });
}
