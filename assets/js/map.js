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
    html += '<ul class="pin__posts">';

    place.posts.forEach(function (p) {
      html += '<li><a href="' + esc(p.url) + '">';
      if (p.image) {
        html += '<img src="' + esc(p.image) + '" alt="" loading="lazy">';
      }
      html += '<span><strong>' + esc(p.title) + '</strong>';
      html += '<time>' + esc(p.date) + '</time></span></a></li>';
    });

    html += '</ul></div>';
    return html;
  }

  // One marker per place; each keeps the set of trips it belongs to so the
  // trip filter can hide it without rebuilding the layer.
  var markers = places.map(function (place) {
    var trips = {};
    place.posts.forEach(function (p) { if (p.trip) trips[p.trip] = true; });

    var marker = L.marker([place.lat, place.lng], {
      title: place.name
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

      var visible = [];
      markers.forEach(function (m) {
        var show = want === 'all' || m._trips[want];
        if (show) {
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
