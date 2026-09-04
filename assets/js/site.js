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

  /* ----------------------------------------------------------- captions --- */
  // Photos between paragraphs are written as plain Markdown, which Kramdown
  // renders as a bare <img> alone in its own <p> — so the text in the square
  // brackets never shows. Every entry writes that text as a caption, so
  // promote it: the paragraph becomes a <figure> with the text underneath.
  // The alt is emptied in the process, otherwise a screen reader reads the
  // same sentence twice, once as the image and once as its caption.
  Array.prototype.forEach.call(
    document.querySelectorAll('.post__body p > img[alt]'),
    function (img) {
      var p = img.parentNode;

      // Only a paragraph holding nothing but the photo. An image sitting
      // mid-sentence is part of the prose and stays as it is.
      if (p.children.length !== 1 || (p.textContent || '').trim()) return;

      var text = (img.getAttribute('alt') || '').trim();
      if (!text) return;

      var figure = document.createElement('figure');
      figure.className = 'post__figure';
      var caption = document.createElement('figcaption');
      caption.textContent = text;

      p.parentNode.replaceChild(figure, p);
      figure.appendChild(img);
      figure.appendChild(caption);
      img.setAttribute('alt', '');
    }
  );

  /* ------------------------------------------------------------ filters --- */
  var list = document.getElementById('post-list');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
  var search = document.getElementById('q');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.filters__chips .chip, .filters__locs .chip'));
  var locGroups = Array.prototype.slice.call(document.querySelectorAll('.filters__loc-group'));
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

    // Only the selected trip's place chips are worth showing — that's the
    // whole point of nesting them, so it can't just be an is-active class.
    locGroups.forEach(function (g) {
      g.hidden = g.getAttribute('data-trip-group') !== state.trip;
    });

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
        state.loc = null;   // place chips belong to a trip; switching trips clears the place filter
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

  // A /?loc= link (e.g. from a post's inline place tag) won't carry the
  // trip, but its chip only renders inside that trip's group — find it so
  // the group is revealed instead of the chip being unreachable.
  if (state.loc && !state.trip) {
    var locChip = chips.filter(function (c) {
      return c.getAttribute('data-filter') === 'loc' && c.getAttribute('data-value') === state.loc;
    })[0];
    var owningGroup = locChip && locChip.closest('.filters__loc-group');
    if (owningGroup) state.trip = owningGroup.getAttribute('data-trip-group');
  }

  apply();
})();
