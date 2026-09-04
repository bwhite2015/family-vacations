(function () {
  'use strict';

  var el = document.getElementById('map');
  var dataEl = document.getElementById('map-data');
  if (!el || !dataEl || typeof L === 'undefined') return;

  var places;
  try {
    places = JSON.parse(dataEl.textContent);
  } catch (err) {
    el.innerHTML = '<p class="map__error">Could not load map data.</p>';
    return;
  }

  if (!places.length) {
    el.innerHTML = '<p class="map__error">No tagged places yet — add a location tag to an entry and it will appear here.</p>';
    return;
  }

  var map = L.map(el, { scrollWheelZoom: true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function popupHtml(place) {
    var html = '<div class="pin">';
    html += '<h3 class="pin__name">' + esc(place.name) + '</h3>';
    if (place.region) html += '<p class="pin__region">' + esc(place.region) + '</p>';

    // Group this place's posts by trip so a location shared across trips
    // shows one heading per trip rather than one flat, unlabeled list.
    var groups = [];
    var byTrip = {};
    place.posts.forEach(function (p) {
      var key = p.trip || '';
      if (!byTrip[key]) {
        byTrip[key] = { tripName: p.tripName, tripUrl: p.tripUrl, posts: [] };
        groups.push(byTrip[key]);
      }
      byTrip[key].posts.push(p);
    });

    groups.forEach(function (g) {
      if (g.tripName) {
        html += '<div class="pin__trip">';
        html += '<h4 class="pin__trip-name">' + esc(g.tripName) + '</h4>';
        if (g.tripUrl) {
          html += '<a class="pin__trip-link" href="' + esc(g.tripUrl) + '">View all trip entries</a>';
        }
        html += '</div>';
      }

      html += '<ul class="pin__posts">';
      g.posts.forEach(function (p) {
        html += '<li><a href="' + esc(p.url) + '">';
        if (p.image) {
          // imagePosition comes from the entry's "image_position:" front
          // matter — the same field the blog cards and trip lists use to pull
          // a crop off centre when the subject sits near an edge.
          var pos = p.imagePosition
            ? ' style="object-position: ' + esc(p.imagePosition) + '"'
            : '';
          html += '<img src="' + esc(p.image) + '" alt="" loading="lazy"' + pos + '>';
        }
        html += '<span><strong>' + esc(p.title) + '</strong>';
        html += '<time>' + esc(p.date) + '</time></span></a></li>';
      });
      html += '</ul>';
    });

    html += '</div>';
    return html;
  }

  /* ------------------------------------------------------------- pins --- */

  // Falls back to the site accent for a place whose entries have no trip, or
  // whose trip carries no "color:" in _data/trips.yml.
  var PIN_FALLBACK = '#c2410c';

  // A place can be tagged by entries from more than one trip, so there isn't
  // always a single right colour. Unfiltered, the pin takes the colour of the
  // most recent entry written about the place (place.posts is newest-first).
  // With a trip filter active, it takes that trip's colour instead, so a
  // filtered map reads as one colour.
  function pinColor(place, trip) {
    var posts = place.posts;
    for (var i = 0; i < posts.length; i++) {
      if (trip && posts[i].trip !== trip) continue;
      if (posts[i].tripColor) return posts[i].tripColor;
    }
    return PIN_FALLBACK;
  }

  function pinIcon(color) {
    var svg =
      '<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M13 35C13 35 24.2 21.4 24.2 12.8A11.2 11.2 0 1 0 1.8 12.8C1.8 21.4 13 35 13 35Z" ' +
      'fill="' + esc(color) + '" stroke="rgba(28,25,23,.55)" stroke-width="1.5"/>' +
      '<circle cx="13" cy="12.8" r="4.1" fill="#fff" fill-opacity=".92"/>' +
      '</svg>';

    return L.divIcon({
      className: 'pin-marker',
      html: svg,
      iconSize: [26, 36],
      iconAnchor: [13, 35],
      popupAnchor: [0, -31]
    });
  }

  // One marker per place; each keeps the set of trips it belongs to so the
  // trip filter can hide it without rebuilding the layer.
  var markers = places.map(function (place) {
    var trips = {};
    place.posts.forEach(function (p) { if (p.trip) trips[p.trip] = true; });

    var marker = L.marker([place.lat, place.lng], {
      title: place.name,
      icon: pinIcon(pinColor(place, null))
    }).bindPopup(popupHtml(place), { maxWidth: 320, minWidth: 220 });

    marker._trips = trips;
    marker._place = place;
    marker.addTo(map);
    return marker;
  });

  function fitTo(visible) {
    var pts = visible.map(function (m) { return m.getLatLng(); });
    if (!pts.length) return;
    if (pts.length === 1) {
      map.setView(pts[0], 8);
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 10 });
    }
  }

  fitTo(markers);

  /* --------------------------------------------------------- trip filter --- */
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-map-filter]'));

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var want = btn.getAttribute('data-map-filter');

      buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });

      var forTrip = want === 'all' ? null : want;

      var visible = [];
      markers.forEach(function (m) {
        var show = want === 'all' || m._trips[want];
        if (show) {
          m.setIcon(pinIcon(pinColor(m._place, forTrip)));
          if (!map.hasLayer(m)) m.addTo(map);
          visible.push(m);
        } else if (map.hasLayer(m)) {
          map.removeLayer(m);
        }
      });

      fitTo(visible);
    });
  });

  /* Deep link: /map/?loc=zion opens that pin. */
  var wanted = new URLSearchParams(window.location.search).get('loc');
  if (wanted) {
    markers.some(function (m) {
      if (m._place.id !== wanted) return false;
      map.setView(m.getLatLng(), 9);
      m.openPopup();
      return true;
    });
  }
})();
