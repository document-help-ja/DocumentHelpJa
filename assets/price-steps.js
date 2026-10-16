/* Price, step by step: renders every [data-price-steps] block from its JSON config.
   Rows: {label, note, usd} fixed US$ | {label, note, jmd} J$ converted at LC_RATES | {label, text} no amount.
   Groups: {title, rows} | {title, toggle:true, rows} adds an "Add" tick | {choose:[{label, jmd|usd}]} a pick-one row. */
(function () {
  var R = window.LC_RATES || { jmdPerUsd: 159, checked: '' };
  function usdOf(j) { return Math.ceil(j / R.jmdPerUsd); }
  function jm(n) { return 'J$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function amt(r) { return r.text ? r.text : (r.usd != null ? 'US$' + r.usd : (r.jmd != null ? 'about US$' + usdOf(r.jmd) : '')); }
  function val(r) { return r.usd != null ? r.usd : (r.jmd != null ? usdOf(r.jmd) : 0); }
  document.querySelectorAll('[data-price-steps]').forEach(function (box, bi) {
    var cfg = JSON.parse(box.querySelector('script[type="application/json"]').textContent);
    var html = '<p class="ps-head">Your price, step by step</p>';
    cfg.groups.forEach(function (g, gi) {
      var gid = 'ps' + bi + '-' + gi;
      html += '<div class="ps-group" data-g="' + gi + '"' + (g.toggle ? ' data-toggle' : '') + '>';
      html += '<div class="ps-gt"><span>' + (gi + 1) + '. ' + g.title + '</span>' +
        (g.toggle ? '<label class="ps-add"><input type="checkbox" data-add' + (g.on ? ' checked' : '') + '> Add</label>' : '') + '</div>';
      (g.rows || []).forEach(function (r) {
        if (r.choose) {
          html += '<fieldset class="ps-choose"><legend>' + r.label + '</legend>';
          r.choose.forEach(function (c, ci) {
            html += '<label class="ps-opt"><input type="radio" name="' + gid + '" value="' + ci + '"' + (ci === 0 ? ' checked' : '') + '><span>' + c.label +
              (c.jmd != null ? '<small>' + jm(c.jmd) + '</small>' : '') + '</span><b>' + amt(c) + '</b></label>';
          });
          html += '</fieldset>';
        } else {
          html += '<div class="ps-row"><span>' + r.label + (r.note ? '<small>' + r.note + '</small>' : (r.jmd != null ? '<small>' + jm(r.jmd) + '</small>' : '')) + '</span><b>' + amt(r) + '</b></div>';
        }
      });
      html += '</div>';
    });
    html += '<div class="ps-total" aria-live="polite"><p class="ps-tl">Estimated total</p><p class="ps-tv"></p><p class="ps-ts"></p></div>';
    html += '<p class="ps-note">Government fees are charged in Jamaican dollars and paid at cost. US amounts use this week\'s rate (US$1 = J$' + R.jmdPerUsd + (R.checked ? ', checked ' + R.checked : '') + '). We confirm the exact amount' + (cfg.dhl ? ', and your DHL quote,' : '') + ' before you pay.</p>';
    box.insertAdjacentHTML('beforeend', html);
    function update() {
      var total = 0, parts = [];
      cfg.groups.forEach(function (g, gi) {
        var el = box.querySelector('.ps-group[data-g="' + gi + '"]');
        var on = !g.toggle || el.querySelector('[data-add]').checked;
        el.classList.toggle('off', !on);
        if (!on) return;
        (g.rows || []).forEach(function (r) {
          var x = r;
          if (r.choose) { var pick = el.querySelector('input[type="radio"]:checked'); x = r.choose[pick ? +pick.value : 0]; }
          var v = val(x); if (v) { total += v; parts.push((x.jmd != null || /about/.test(x.text || '') ? 'about ' : '') + 'US$' + v); }
        });
      });
      box.querySelector('.ps-tv').textContent = 'US$' + total + (cfg.dhl ? ' + DHL' : '');
      box.querySelector('.ps-ts').textContent = parts.join(' + ');
    }
    box.addEventListener('change', update); update();
  });
})();
