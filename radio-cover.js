/* radio-cover.js · Textos y carátulas para reproductor de radio web
   1) Filtro de jingles/sweepers: si el texto los contiene, no se toca nada (se mantiene lo último válido).
   2) Cascada: Spotify (640x640) -> iTunes (alta calidad) -> logo de la emisora.
   3) Sin coincidencia clara o con error: SIEMPRE el logo, nunca una carátula inventada.

   USO:
     <span id="track-title"></span>
     <img id="album-art" alt="Carátula" width="300" height="300">
     <script src="radio-cover.js"></script>
     <script>
       RadioCover.init({
         titleId: 'track-title',
         imgId: 'album-art',
         logo: 'logo.svg',                               // URL de tu logotipo
         spotifyProxy: 'https://nexo-spotify.tu-usuario.workers.dev'
       });
       // Cada vez que tu stream te dé un texto nuevo:
       RadioCover.update('Maluma & Shakira - AGUA');
     </script>

   NOTA: Spotify necesita un token que se obtiene con tu Client Secret, así que NO puede llamarse
   desde el navegador. Usa el Worker spotify-proxy-worker.js (guarda el secreto) y pon su URL en
   spotifyProxy. Sin proxy, se salta directamente a iTunes. */
(function () {
  'use strict';

  var cfg = {
    titleId: 'track-title',
    imgId: 'album-art',
    logo: '',
    spotifyProxy: '',                // URL de tu Worker de Spotify (spotify-proxy-worker.js)
    keywords: ['jingle', 'sweeper', 'id', 'nexo fm', 'cuña', 'cortinilla', 'promo'],
    defaultTitle: '',                // texto mientras no haya canción válida
    timeout: 5000,
    mediaSession: true,              // título/carátula en pantalla de bloqueo, Bluetooth y coche
    station: 'Radio'                 // nombre de la emisora (artista cuando no hay)
  };

  var titleEl, imgEl, KW = [];
  var cache = new Map();             // "artista - título" -> url | null
  var lastSong = '';                 // última canción válida mostrada
  var token = 0;                     // evita que una respuesta lenta pise a otra más nueva

  /* minúsculas, sin tildes, solo letras/números; con espacios en los extremos para casar PALABRA COMPLETA
     ("id" no salta con "Dido" ni "Idol") */
  function norm(s) {
    return ' ' + String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }

  function clean(raw) {
    return String(raw == null ? '' : raw)
      .replace(/_/g, ' ')
      .replace(/\s*[\u2013\u2014\u2212]\s*/g, ' - ')
      .replace(/\.(mp3|wav|flac|m4a|aac|ogg)$/i, '')
      .replace(/\s+/g, ' ').trim();
  }

  /* 1) Filtro de jingles */
  function isJingle(text) {
    var t = norm(text);
    return KW.some(function (k) { return t.indexOf(k) > -1; });
  }

  function split(song) {
    var i = song.indexOf(' - ');
    return i > -1 ? { artist: song.slice(0, i), title: song.slice(i + 3) }
                  : { artist: '', title: song };
  }

  // "Maluma & Shakira" -> "Maluma"
  function mainArtist(a) { return a.split(/\s+(?:&|feat\.?|ft\.?|x|y|and)\s+|[,;]/i)[0].trim(); }
  // "Tema (Remix) feat. X" -> "Tema"
  function baseTitle(t) {
    return t.replace(/[(\[][^)\]]*[)\]]/g, '').replace(/\s+(feat|ft)\.?\s.*$/i, '').trim() || t;
  }

  /* Coincidencia clara: el artista coincide y el título coincide (uno contiene al otro).
     Sin artista en el texto, se exige solo el título. */
  function isMatch(artist, title, rArtist, rTitle) {
    var a = norm(mainArtist(artist)), t = norm(baseTitle(title));
    var ra = norm(rArtist), rt = norm(rTitle);
    var titleOk = rt.indexOf(t) > -1 || t.indexOf(rt) > -1;
    var artistOk = !artist || ra.indexOf(a) > -1;
    return titleOk && artistOk;
  }

  function getJSON(url) {
    var c = new AbortController(), id = setTimeout(function () { c.abort(); }, cfg.timeout);
    return fetch(url, { signal: c.signal })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { clearTimeout(id); });
  }

  /* 2a) Spotify (vía proxy) -> imagen de 640x640 */
  async function fromSpotify(artist, title) {
    var base = String(cfg.spotifyProxy || '').replace(/\/+$/, '');
    if (!/^https:\/\//i.test(base)) return null;
    var main = mainArtist(artist).replace(/"/g, ''), t = baseTitle(title).replace(/"/g, '');
    var queries = artist ? ['track:"' + t + '" artist:"' + main + '"', main + ' ' + t] : [t];
    for (var q = 0; q < queries.length; q++) {
      var json = await getJSON(base + '/?q=' + encodeURIComponent(queries[q]));
      var list = (json && json.tracks) || [];
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r && isMatch(artist, title, (r.artists || []).join(' '), r.name) &&
            /^https:\/\/i\.scdn\.co\/image\/\w+$/.test(r.image || '')) return r.image;
      }
    }
    return null;
  }

  /* 2b) iTunes -> artwork en alta calidad */
  async function fromItunes(artist, title) {
    var term = (artist ? mainArtist(artist) + ' ' : '') + baseTitle(title);
    var json = await getJSON('https://itunes.apple.com/search?media=music&entity=song&limit=5&term=' + encodeURIComponent(term));
    var list = (json && json.results) || [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r && r.artworkUrl100 && isMatch(artist, title, r.artistName, r.trackName)) {
        return r.artworkUrl100.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/i, '/1000x1000bb.$2');
      }
    }
    return null;
  }

  /* Cascada: Spotify -> iTunes -> null (el llamador pone el logo) */
  async function getCover(song) {
    if (cache.has(song)) return cache.get(song);
    var p = split(song), url = null;
    try { url = await fromSpotify(p.artist, p.title); } catch (e) { url = null; }
    if (!url) { try { url = await fromItunes(p.artist, p.title); } catch (e) { url = null; } }
    cache.set(song, url);
    return url;
  }

  function showCover(url) {
    if (!imgEl) return;
    var src = url || cfg.logo;
    if (!src) { imgEl.hidden = true; return; }
    imgEl.onerror = function () {           // si la carátula no carga, logo (sin bucles)
      imgEl.onerror = null;
      if (cfg.logo && imgEl.src !== new URL(cfg.logo, location.href).href) imgEl.src = cfg.logo;
    };
    imgEl.src = src;
    imgEl.hidden = false;
  }

  /* Media Session: lo que ven auriculares Bluetooth, el coche, la pantalla de bloqueo y las notificaciones */
  function setMedia(song, url) {
    try {
      if (!cfg.mediaSession || !('mediaSession' in navigator) || !window.MediaMetadata) return;
      var p = split(song), art = url || (cfg.logo ? new URL(cfg.logo, location.href).href : '');
      var type = url ? 'image/jpeg' : /\.svg(\?|$)/i.test(art) ? 'image/svg+xml' : /\.png(\?|$)/i.test(art) ? 'image/png' : 'image/jpeg';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: p.title, artist: p.artist || cfg.station, album: cfg.station,
        artwork: art ? [{ src: art, sizes: url ? '640x640' : '512x512', type: type }] : []
      });
    } catch (e) {}
  }

  function showTitle(text) { if (titleEl) titleEl.textContent = text; }

  /** Punto de entrada: pásale el texto crudo que llega del streaming. */
  async function update(raw) {
    var song = clean(raw);
    if (!song || isJingle(song)) return;    // 1) jingle/vacío: se mantiene lo último válido
    if (song === lastSong) return;          // sin cambios

    lastSong = song;
    var my = ++token;
    showTitle(song);                        // el texto sale al instante
    setMedia(song, null);
    var cover = await getCover(song);
    if (my !== token) return;               // llegó otra canción mientras buscábamos
    showCover(cover);                       // carátula real o, si no, logo
    setMedia(song, cover);
  }

  function init(opts) {
    for (var k in (opts || {})) if (k in cfg) cfg[k] = opts[k];
    KW = cfg.keywords.map(norm);
    titleEl = document.getElementById(cfg.titleId);
    imgEl = document.getElementById(cfg.imgId);
    showTitle(cfg.defaultTitle);
    showCover(null);                        // estado inicial: logo
  }

  window.RadioCover = { init: init, update: update, isJingle: function (t) { return isJingle(clean(t)); } };
})();
