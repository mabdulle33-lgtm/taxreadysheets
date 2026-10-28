/*
 * TaxReadySheets — runs before the page paints so there is no flash of the
 * wrong colours. The only thing the site ever saves is your light/dark
 * choice, in your own browser (key "trs-theme"). No cookies.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  // Dark is the default look. A visitor's own light/dark choice (saved below) wins.
  var theme = 'dark';
  try {
    var t = window.localStorage.getItem('trs-theme');
    if (t === 'light' || t === 'dark') theme = t;
  } catch (e) { /* storage blocked: use the default */ }
  root.setAttribute('data-theme', theme);
})();
