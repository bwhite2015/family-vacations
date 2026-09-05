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

  /* ---------------------------------------------------------- lightbox --- */
  // Every photo in an entry — the one at the top, the ones between the
  // paragraphs, and the gallery at the bottom — opens in an overlay on top of
  // the page instead of sending the reader off to the raw image file. The
  // gallery keeps its <a> wrappers in the markup so the photos are still
  // reachable with JavaScript off; the click is intercepted here.
  (function () {
    var post = document.querySelector('.post');
    if (!post) return;

    // A comma selector returns document order, so the sequence runs
    // hero → prose → gallery: the order the photos are met while reading.
    var shots = Array.prototype.map.call(
      post.querySelectorAll('.post__hero img, .post__body img, .gallery img'),
      function (img) {
        // The gallery wraps each thumbnail in a link to the full file, and the
        // thumbnail itself is cropped to 4:3 by CSS — so prefer the href.
        var link = img.parentNode.tagName === 'A' ? img.parentNode : null;
        var figure = img.closest('figure');
        var cap = figure && figure.querySelector('figcaption');
        return {
          src: (link && link.getAttribute('href')) || img.getAttribute('src'),
          caption: cap ? (cap.textContent || '').trim() : (img.getAttribute('alt') || '').trim(),
          trigger: link || img
        };
      }
    );
    if (!shots.length) return;

    // Anything this wide is a panorama rather than a photo that happens to be
    // wide — the widest ordinary shot on the site is about 2:1, panoramas run
    // past 4:1. Shown whole one would be a thin strip, so it gets panned
    // across instead.
    var PANO_RATIO = 2.5;

    var index = 0;
    var lastFocus = null;
    var overlay, imgEl, stage, hintEl, capEl, countEl, closeBtn, prevBtn, nextBtn;

    // Each path is drawn symmetrically about the middle of the 24×24 box, so
    // the mark sits in the centre of its circle whatever font is around. The
    // button carries the label; the drawing itself is nothing to read out.
    function icon(path) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
             '<path d="' + path + '"/></svg>';
    }

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.hidden = true;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Photo viewer');
      overlay.innerHTML =
        '<p class="lightbox__count" aria-hidden="true"></p>' +
        '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close photo (Esc)">' +
          icon('M6 6 18 18M18 6 6 18') + '</button>' +
        '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous photo">' +
          icon('M15.5 5 8.5 12l7 7') + '</button>' +
        '<button class="lightbox__btn lightbox__next" type="button" aria-label="Next photo">' +
          icon('M8.5 5 15.5 12l-7 7') + '</button>' +
        '<p class="lightbox__hint" hidden>Drag to pan across the photo</p>' +
        '<figure class="lightbox__figure">' +
          '<div class="lightbox__stage" role="group"><img class="lightbox__img" alt=""></div>' +
          '<figcaption class="lightbox__caption"></figcaption>' +
        '</figure>';
      document.body.appendChild(overlay);

      imgEl = overlay.querySelector('.lightbox__img');
      stage = overlay.querySelector('.lightbox__stage');
      hintEl = overlay.querySelector('.lightbox__hint');
      capEl = overlay.querySelector('.lightbox__caption');
      countEl = overlay.querySelector('.lightbox__count');
      closeBtn = overlay.querySelector('.lightbox__close');
      prevBtn = overlay.querySelector('.lightbox__prev');
      nextBtn = overlay.querySelector('.lightbox__next');

      // A lone photo has nowhere to step to.
      if (shots.length < 2) {
        prevBtn.hidden = true;
        nextBtn.hidden = true;
      }

      prevBtn.addEventListener('click', function () { show(index - 1); });
      nextBtn.addEventListener('click', function () { show(index + 1); });
      closeBtn.addEventListener('click', close);

      // Anywhere in the dark closes — but not the photo, its caption, or a button.
      overlay.addEventListener('click', function (e) {
        if (e.target.closest('.lightbox__img, .lightbox__caption, .lightbox__btn, .lightbox__hint')) return;
        // The panorama's strip runs the full width, so a click on it is aimed
        // at the photo even where the photo doesn't reach.
        if (isPano() && e.target.closest('.lightbox__stage')) return;
        close();
      });

      imgEl.addEventListener('load', function () {
        imgEl.classList.add('is-ready');
        setPano(imgEl.naturalWidth / imgEl.naturalHeight >= PANO_RATIO);
      });
      imgEl.addEventListener('error', function () { imgEl.classList.add('is-ready'); });

      // Drag the panorama with a mouse. Touch is left to the browser, which
      // already scrolls the strip and does it with the right momentum.
      var dragging = false, grabX = 0, grabScroll = 0;
      stage.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || !isPano()) return;
        dragging = true;
        grabX = e.clientX;
        grabScroll = stage.scrollLeft;
        stage.setPointerCapture(e.pointerId);
        e.preventDefault();   // otherwise the browser starts dragging the image itself
      });
      stage.addEventListener('pointermove', function (e) {
        if (dragging) stage.scrollLeft = grabScroll - (e.clientX - grabX);
      });
      ['pointerup', 'pointercancel'].forEach(function (type) {
        stage.addEventListener(type, function (e) {
          if (!dragging) return;
          dragging = false;
          if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
        });
      });

      // A plain wheel or a two-finger swipe reads as "move along the photo".
      stage.addEventListener('wheel', function (e) {
        if (!isPano() || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        stage.scrollLeft += e.deltaY;
        e.preventDefault();
      }, { passive: false });

      // Swipe sideways on a phone. A mostly-vertical drag is a scroll attempt,
      // not a page turn, so it is left alone.
      var startX = 0, startY = 0;
      overlay.addEventListener('touchstart', function (e) {
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
      }, { passive: true });
      overlay.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (shots.length < 2 || Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
        // On a panorama a sideways drag means "pan", so it can't also mean
        // "next photo" — the arrows are there for that.
        if (isPano()) return;
        show(index + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    function isPano() { return overlay.classList.contains('is-pano'); }

    function setPano(on) {
      overlay.classList.toggle('is-pano', on);
      hintEl.hidden = !on;
      // Focusable so the strip can be panned with the arrow keys, which the
      // browser scrolls for us — see onKey, which steps out of the way.
      if (on) {
        stage.setAttribute('tabindex', '0');
        stage.setAttribute('aria-label', 'Panorama — scroll sideways to pan across it');
      } else {
        stage.removeAttribute('tabindex');
        stage.removeAttribute('aria-label');
      }
    }

    function preload(i) {
      var shot = shots[(i + shots.length) % shots.length];
      if (shot) new Image().src = shot.src;
    }

    function show(i) {
      index = (i + shots.length) % shots.length;   // the ends wrap around
      var shot = shots[index];

      imgEl.classList.remove('is-ready');
      // Whether this one pans is only known once it has loaded and its shape
      // is readable; until then treat it as an ordinary photo.
      setPano(false);
      stage.scrollLeft = 0;
      imgEl.src = shot.src;
      imgEl.alt = shot.caption;
      capEl.textContent = shot.caption;
      capEl.hidden = !shot.caption;
      countEl.textContent = shots.length > 1 ? (index + 1) + ' / ' + shots.length : '';

      if (shots.length > 1) { preload(index + 1); preload(index - 1); }
    }

    function open(i) {
      if (!overlay) build();
      lastFocus = document.activeElement;

      // Holding the page still costs it its scrollbar; pay the width back so
      // the sticky header doesn't jump sideways underneath.
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (gap > 0) document.body.style.paddingRight = gap + 'px';

      show(i);
      overlay.hidden = false;
      closeBtn.focus();
      document.addEventListener('keydown', onKey);
    }

    function close() {
      overlay.hidden = true;
      imgEl.removeAttribute('src');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }

      if (shots.length > 1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        // With the panorama strip itself focused the arrows pan it, which the
        // browser does natively — so leave them alone.
        if (isPano() && document.activeElement === stage) return;
        e.preventDefault();
        show(index + (e.key === 'ArrowRight' ? 1 : -1));
        return;
      }

      if (e.key !== 'Tab') return;

      // Keep Tab inside the overlay — the page behind it can't be reached anyway.
      var stops = [closeBtn];
      if (shots.length > 1) stops.push(prevBtn, nextBtn);
      if (isPano()) stops.push(stage);   // so the panorama can be reached and panned
      var at = stops.indexOf(document.activeElement);
      e.preventDefault();
      stops[(at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
    }

    shots.forEach(function (shot, i) {
      var trigger = shot.trigger;
      trigger.classList.add('is-zoomable');

      trigger.addEventListener('click', function (e) {
        e.preventDefault();   // the gallery's link to the raw file stays a no-JS fallback
        open(i);
      });

      // The gallery's triggers are links and already answer to a keyboard; a
      // bare <img> has to be told it's something you can press.
      if (trigger.tagName !== 'A') {
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
        trigger.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          open(i);
        });
      }
    });
  })();

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
