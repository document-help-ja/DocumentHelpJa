/* Price, step by step: renders every [data-price-steps] block from its JSON config.
   One currency at a time: Jamaica shows J$ only, overseas shows US$ only.
   Rows: {label, note, usd, local} our fee (local = the J$ price in Jamaica)
       | {label, note, jmd} government fee in J$ (shown as an estimate in US$ overseas)
       | {label, text, textLocal} no amount.
   Groups: {title, rows} | {title, toggle:true, rows} adds an "Add" tick | {choose:[{label, jmd|usd|local}]} a pick-one row.
   Delivery: a row or option with dhl:true adds "+ DHL" to the total; localOnly:true options show only for Jamaica.
   overseasOnly:true on a group hides it for Jamaica (an apostille is only for documents going abroad).
   cfg.where: true adds a "Where are you applying from?" switch (Jamaica / Overseas). Without it the box is overseas only. */
(function () {
  var R = window.LC_RATES || { jmdPerUsd: 159, checked: '' };
  function usdOf(j) { return Math.ceil(j / R.jmdPerUsd); }
  function jm(n) { return 'J$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* Amount and value for one row in the chosen currency. Missing local price = we confirm it. */
  function money(r, local) {
    if (r.text) return { label: local && r.textLocal ? r.textLocal : r.text, v: 0 };
    if (local) {
      if (r.jmd != null) return { label: jm(r.jmd), v: r.jmd };
      if (r.local != null) return { label: jm(r.local), v: r.local };
      if (r.usd != null) return { label: 'We confirm', v: 0, missing: true };
      return { label: '', v: 0 };
    }
    if (r.usd != null) return { label: 'US$' + r.usd, v: r.usd };
    if (r.jmd != null) return { label: 'about US$' + usdOf(r.jmd), v: usdOf(r.jmd), about: true };
    return { label: '', v: 0 };
  }
  document.querySelectorAll('[data-price-steps]').forEach(function (box, bi) {
    var cfg = JSON.parse(box.querySelector('script[type="application/json"]').textContent);
    var local = !!cfg.where && cfg.whereDefault !== 'os';
    var html = '<p class="ps-head">Your price, step by step</p>';
    if (cfg.where) {
      html += '<div class="ps-where" role="radiogroup" aria-label="Where are you applying from?"><p class="ps-wl">Where are you applying from?</p>' +
        '<label><input type="radio" name="psw' + bi + '" value="ja"' + (local ? ' checked' : '') + '><span>Jamaica</span></label>' +
        '<label><input type="radio" name="psw' + bi + '" value="os"' + (local ? '' : ' checked') + '><span>Overseas</span></label></div>';
    }
    cfg.groups.forEach(function (g, gi) {
      var gid = 'ps' + bi + '-' + gi;
      html += '<div class="ps-group" data-g="' + gi + '"' + (g.toggle ? ' data-toggle' : '') + (g.overseasOnly ? ' data-os-only' : '') + '>';
      html += '<div class="ps-gt"><span><span class="ps-n"></span>' + g.title + '</span>' +
        (g.toggle ? '<label class="ps-add"><input type="checkbox" data-add' + (g.on ? ' checked' : '') + '> Add</label>' : '') + '</div>';
      (g.rows || []).forEach(function (r, ri) {
        if (r.choose) {
          html += '<fieldset class="ps-choose"><legend>' + r.label + '</legend>';
          r.choose.forEach(function (c, ci) {
            html += '<label class="ps-opt"' + (c.localOnly ? ' data-local-only' : '') + '><input type="radio" name="' + gid + '-' + ri + '" value="' + ci + '"' + (ci === 0 ? ' checked' : '') + '><span>' + c.label + (c.note ? '<small>' + c.note + '</small>' : '') +
              '</span><b data-amt="' + gi + '-' + ri + '-' + ci + '"></b></label>';
          });
          html += '</fieldset>';
        } else {
          html += '<div class="ps-row"><span>' + r.label + (r.note ? '<small>' + r.note + '</small>' : '') + '</span><b data-amt="' + gi + '-' + ri + '"></b></div>';
        }
      });
      html += '</div>';
    });
    html += '<div class="ps-total" aria-live="polite"><p class="ps-tl">Estimated total</p><p class="ps-tv"></p><p class="ps-ts"></p><p class="ps-dn" hidden>DHL is quoted by your address and added before you pay.</p></div>';
    html += '<p class="ps-note"></p>';
    box.insertAdjacentHTML('beforeend', html);
    function update() {
      var w = box.querySelector('.ps-where input:checked');
      local = !!(w && w.value === 'ja');
      var total = 0, parts = [], missing = false, about = false, dhl = false;
      box.querySelectorAll('[data-local-only]').forEach(function (o) {
        o.hidden = !local;
        var r = o.querySelector('input');
        if (!local && r.checked) { r.checked = false; var f = o.parentNode.querySelector('.ps-opt:not([data-local-only]) input'); if (f) f.checked = true; }
      });
      cfg.groups.forEach(function (g, gi) {
        var el = box.querySelector('.ps-group[data-g="' + gi + '"]');
        (g.rows || []).forEach(function (r, ri) {
          if (r.choose) r.choose.forEach(function (c, ci) { box.querySelector('[data-amt="' + gi + '-' + ri + '-' + ci + '"]').textContent = money(c, local).label; });
          else box.querySelector('[data-amt="' + gi + '-' + ri + '"]').textContent = money(r, local).label;
        });
        if (g.overseasOnly) { el.hidden = local; if (local) { var a = el.querySelector('[data-add]'); if (a) a.checked = false; return; } }
        var on = !g.toggle || el.querySelector('[data-add]').checked;
        el.classList.toggle('off', !on);
        if (!on) return;
        (g.rows || []).forEach(function (r, ri) {
          var x = r;
          if (r.choose) { var pick = el.querySelector('input[name="ps' + bi + '-' + gi + '-' + ri + '"]:checked'); x = r.choose[pick ? +pick.value : 0]; }
          if (x.dhl) dhl = true;
          var m = money(x, local);
          if (m.missing) missing = true;
          if (m.v) { total += m.v; if (m.about) about = true; parts.push((m.about ? 'about ' : '') + (local ? jm(m.v) : 'US$' + m.v)); }
        });
      });
      var extra = (missing ? ' + items we confirm' : '') + (dhl ? ' + DHL' : '');
      box.querySelector('.ps-dn').hidden = !dhl;
      var n = 0; box.querySelectorAll('.ps-group').forEach(function (el) { if (!el.hidden) el.querySelector('.ps-n').textContent = (++n) + '. '; });
      box.querySelector('.ps-tv').textContent = (local ? jm(total) : 'US$' + total) + extra;
      box.querySelector('.ps-ts').textContent = parts.join(' + ');
      box.querySelector('.ps-note').textContent = local
        ? 'Government fees are paid to the agency at cost. We confirm the exact amount before you pay.'
        : 'Government fees are paid in Jamaican dollars at cost, so US amounts are estimates. We confirm the exact amount' + (cfg.dhl ? ', and your DHL quote,' : '') + ' before you pay.';
    }
    box.addEventListener('change', update); update();
  });
})();
