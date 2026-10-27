/*
 * TaxReadySheets — runs before the page paints so there is no flash of the
 * wrong colours. The only thing the site ever saves is your light/dark
 * choice, in your own browser (key "trs-theme"). No cookies.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var t = window.localStorage.getItem('trs-theme');
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: follow the system setting */ }
})();
