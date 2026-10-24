/* 30% sale on our fee, local (J$) clients only.
   Runs until the end of 30 November 2026 (Jamaica time), then every page
   goes back to normal prices on its own. To end the sale early, change
   SALE_ENDS to a date in the past.

   How a page uses it:
   - data-sale-only     : shown only during the sale (e.g. the sale banner)
   - data-sale-fee="J$2,800" on a fee <b> : shows the old price crossed out, new price under it
   - data-sale-text="..." : text swapped in during the sale
   - data-sale-base="2800" on a .bill : the total calculator uses the sale fee
*/
(function () {
  var SALE_ENDS = new Date('2026-12-01T00:00:00-05:00');
  var on = new Date() < SALE_ENDS;
  window.DHJ_SALE = on;
  if (!on) return;

  var css = document.createElement('style');
  css.textContent =
    '.sale-was{display:block;font-size:.85rem;font-weight:400;color:#8A949C;letter-spacing:0;text-decoration:line-through}' +
    '.sale-note{margin:14px 0 0;padding:10px 14px;background:#FBF3DC;border:1px solid #E6CF8A;color:#6B4E0C;font-size:.92rem;line-height:1.5}' +
    '.sale-note[hidden]{display:none}' +
    '.sale-save{display:block;margin-top:4px;color:#F6DFA6}';
  document.head.appendChild(css);

  document.querySelectorAll('[data-sale-only]').forEach(function (el) { el.hidden = false; });
  document.querySelectorAll('[data-sale-text]').forEach(function (el) { el.textContent = el.getAttribute('data-sale-text'); });
  document.querySelectorAll('[data-sale-fee]').forEach(function (el) {
    var was = el.textContent;
    el.innerHTML = '<s class="sale-was">' + was + '</s>' + el.getAttribute('data-sale-fee');
  });
  document.querySelectorAll('[data-sale-base]').forEach(function (el) {
    el.setAttribute('data-was', el.getAttribute('data-base'));
    el.setAttribute('data-base', el.getAttribute('data-sale-base'));
  });
})();
