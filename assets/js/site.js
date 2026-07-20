(function () {
  'use strict';

  /* ---------------------------------------------------------------- nav --- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ------------------------------------------------------------ filters --- */
  var list = document.getElementById('post-list');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
  var search = document.getElementById('q');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.filters__chips .chip'));
  var count = document.getElementById('result-count');
  var empty = document.getElementById('empty-state');

  var state = { q: '', trip: null, loc: null };

  function matches(card) {
    if (state.trip && card.getAttribute('data-trip') !== state.trip) return false;

    if (state.loc) {
      var locs = (card.getAttribute('data-locations') || '').split(',');
      if (locs.indexOf(state.loc) === -1) return false;
    }

    if (state.q) {
      var hay = card.getAttribute('data-search') || '';
      // Every whitespace-separated term must appear somewhere.
      var terms = state.q.split(/\s+/);
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) === -1) return false;
      }
    }

    return true;
  }

  function apply() {
    var shown = 0;

    cards.forEach(function (card) {
      var ok = matches(card);
      card.hidden = !ok;
      if (ok) shown++;
    });

    if (empty) empty.hidden = shown !== 0;

    if (count) {
      var filtered = state.q || state.trip || state.loc;
      count.textContent = filtered
        ? shown + ' of ' + cards.length + (cards.length === 1 ? ' entry' : ' entries')
        : '';
    }

    // Keep the chip highlighting honest.
    chips.forEach(function (chip) {
      var kind = chip.getAttribute('data-filter');
      var val = chip.getAttribute('data-value');
      var active =
        kind === 'all' ? (!state.trip && !state.loc)
        : kind === 'trip' ? state.trip === val
        : state.loc === val;
      chip.classList.toggle('is-active', active);
    });

    syncUrl();
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams();
    if (state.trip) params.set('trip', state.trip);
    if (state.loc) params.set('loc', state.loc);
    if (state.q) params.set('q', state.q);
    var qs = params.toString();
    window.history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var kind = chip.getAttribute('data-filter');
      var val = chip.getAttribute('data-value');

      if (kind === 'all') {
        state.trip = null;
        state.loc = null;
      } else if (kind === 'trip') {
        state.trip = state.trip === val ? null : val;   // click again to clear
      } else if (kind === 'loc') {
        state.loc = state.loc === val ? null : val;
      }
      apply();
    });
  });

  if (search) {
    var timer;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = search.value.trim().toLowerCase();
        apply();
      }, 120);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-clear]');
    if (!btn) return;
    state = { q: '', trip: null, loc: null };
    if (search) search.value = '';
    apply();
  });

  /* Deep links: /?loc=zion, /?trip=southwest-2026, /?q=canyon */
  var incoming = new URLSearchParams(window.location.search);
  state.trip = incoming.get('trip') || null;
  state.loc = incoming.get('loc') || null;
  state.q = (incoming.get('q') || '').trim().toLowerCase();
  if (state.q && search) search.value = state.q;

  apply();
})();
