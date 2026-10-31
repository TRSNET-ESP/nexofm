/* nexo-cover.js · Carátulas vía Spotify (iTunes de respaldo) + limpieza + filtro de jingles/sweepers
   Cárgalo ANTES de mega.js:  <script src="nexo-cover.js"></script>
   API pública: window.NexoCover = { isJingle, getCover, update } */
(function () {
  'use strict';

  // Palabras clave de separación/marca. Se comparan como PALABRA COMPLETA
  // (sin tildes ni mayúsculas), así "id" no salta con "Dido" o "Idol".
  var KEYWORDS = ['jingle', 'sweeper', 'id', 'nexo fm', 'cuña', 'cortinilla', 'promo'];

  var ITUNES = 'https://itunes.apple.com/search';   // solo como respaldo
  var cache = new Map();   // "artista - título" -> url | null
  var lastSong = '';       // última canción real mostrada
  var lastCover = null;

  // minúsculas, sin tildes, solo letras/números separados por un espacio
  function norm(s) {
    return ' ' + String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim() + ' ';
  }


  // ---------- Limpieza / análisis del texto del streaming ----------
  // Windows-1252 (0x80-0x9F) -> byte, para arreglar "Ã±" -> "ñ", "â€™" -> "’"...
  var W1252 = {0x20AC:0x80,0x201A:0x82,0x0192:0x83,0x201E:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,
    0x02C6:0x88,0x2030:0x89,0x0160:0x8A,0x2039:0x8B,0x0152:0x8C,0x017D:0x8E,0x2018:0x91,0x2019:0x92,
    0x201C:0x93,0x201D:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02DC:0x98,0x2122:0x99,0x0161:0x9A,
    0x203A:0x9B,0x0153:0x9C,0x017E:0x9E,0x0178:0x9F};

  // Texto UTF-8 mal decodificado como Latin-1 (mojibake) -> texto correcto
  function fixMojibake(s) {
    if (!/[\u00C2\u00C3\u00E2\u00C5\u00F0]/.test(s) || typeof TextDecoder === 'undefined') return s;
    var bytes = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 256) bytes.push(c);
      else if (W1252[c]) bytes.push(W1252[c]);
      else return s;                      // hay caracteres reales: no tocar
    }
    var u8 = new Uint8Array(bytes);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); }
    catch (e) {                           // mojibake incompleto: decodifica lo posible (lo roto lo borra clean)
      var t = new TextDecoder('utf-8').decode(u8);
      return t.length < s.length ? t : s;
    }
  }

  function decodeEntities(s) {
    return s
      .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (m, d) { return String.fromCodePoint(+d); })
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  // Emojis, iconos, símbolos, caracteres de control, invisibles, "�", zona privada (fuentes de iconos)
  var JUNK = /[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{So}\p{Me}\p{Extended_Pictographic}\uFE00-\uFE0F\uFFFD]/gu;

  /** Devuelve el texto limpio: "Artista - Título" sin basura. */
  function clean(raw) {
    var s = String(raw == null ? '' : raw);
    try {
      s = decodeEntities(s);
      s = fixMojibake(s);
      s = s.normalize('NFC');
      s = s.replace(JUNK, ' ');
      s = s.replace(/_/g, ' ')
           .replace(/\s*[\u2013\u2014\u2212]\s*/g, ' - ')                      // – — −  ->  -
           .replace(/\.(mp3|wav|flac|m4a|aac|ogg)$/i, '')                       // extensión de archivo
           .replace(/\s*[(\[]\s*(official[^)\]]*|lyrics?[^)\]]*|video[^)\]]*|audio|hd|hq)\s*[)\]]/gi, '')
           .replace(/^\d{1,2}\s*[-.)]\s+/, '')                                  // "01 - " al inicio
           .replace(/\s+/g, ' ')
           .replace(/^[\s\-|\u2022·:]+|[\s\-|\u2022·:]+$/g, '');                // separadores sobrantes
    } catch (e) { s = s.replace(/\s+/g, ' ').trim(); }
    return s;
  }

  var KW = KEYWORDS.map(norm);

  /** 2) ¿El texto del streaming es un jingle / cuña / identificador? */
  function isJingle(text) {
    var t = norm(text);
    return KW.some(function (k) { return t.indexOf(k) > -1; });
  }

  function withTimeout(url, ms) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, ms);
    return fetch(url, { signal: c.signal }).finally(function () { clearTimeout(t); });
  }

  // "Maluma & Shakira" -> "Maluma"  (para casar mejor con el catálogo)
  function mainArtist(a) { return a.split(/\s+(?:&|feat\.?|ft\.?|x|y|and)\s+|[,;]/i)[0].trim(); }

  // "Tema (Remix) feat. X" -> "Tema"
  function baseTitle(t) { return t.replace(/[(\[][^)\]]*[)\]]/g, '').replace(/\s+(feat|ft)\.?\s.*$/i, '').trim() || t; }

  /** Coincidencia clara: artista y título coinciden (sin artista en el texto, solo el título). */
  function trackMatch(artist, title, rArtist, rTitle) {
    var t = norm(baseTitle(title)), rt = norm(baseTitle(rTitle));
    var titleOk = rt.indexOf(t) > -1 || t.indexOf(rt) > -1;
    var artistOk = !artist || norm(rArtist).indexOf(norm(mainArtist(artist))) > -1;
    return titleOk && artistOk;
  }

  /** Spotify (vía tu proxy: el Client Secret no puede ir en el navegador).
      Devuelve URL | null (sin coincidencia clara) | undefined (proxy sin configurar). */
  async function fromSpotify(artist, title) {
    var base = String(window.NEXO_SPOTIFY_PROXY || '').replace(/\/+$/, '');
    if (!/^https:\/\//i.test(base)) return undefined;

    var main = mainArtist(artist).replace(/"/g, '');
    var t = baseTitle(title).replace(/"/g, '');
    var queries = artist ? ['track:"' + t + '" artist:"' + main + '"', main + ' ' + t] : [t];

    for (var i = 0; i < queries.length; i++) {
      var res = await withTimeout(base + '/?q=' + encodeURIComponent(queries[i]), 5000);
      if (!res.ok) continue;
      var list = (await res.json()).tracks || [];
      for (var k = 0; k < list.length; k++) {
        var r = list[k];
        if (r && trackMatch(artist, title, (r.artists || []).join(' '), r.name) &&
            /^https:\/\/i\.scdn\.co\/image\/\w+$/.test(r.image || '')) return r.image;
      }
    }
    return null;
  }

  /** Respaldo: iTunes (sí admite CORS). */
  async function fromItunes(song, artist, title) {
    try {
      var res = await withTimeout(
        ITUNES + '?media=music&entity=song&limit=5&term=' + encodeURIComponent(song.replace(' - ', ' ')), 5000);
      if (!res.ok) return null;
      var results = (await res.json()).results || [];
      var hit = results.filter(function (r) { return trackMatch(artist, title, r.artistName, r.trackName); })[0];
      return hit && hit.artworkUrl100
        ? hit.artworkUrl100.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/i, '/600x600bb.$2')
        : null;
    } catch (e) { return null; }
  }

  /** Devuelve la URL de la carátula en 600x600, o null si no hay. Spotify primero, iTunes de respaldo; si no hay coincidencia clara devuelve null (la web pone el logo). */
  async function getCover(song) {
    song = clean(song);
    if (!song) return null;
    if (cache.has(song)) return cache.get(song);

    var i = song.indexOf(' - ');
    var artist = i > -1 ? song.slice(0, i) : '';
    var title = i > -1 ? song.slice(i + 3) : song;
    var url = null;

    try { url = (await fromSpotify(artist, title)) || null; } catch (e) { url = null; }
    if (!url && window.NEXO_COVER_FALLBACK !== false) url = await fromItunes(song, artist, title);

    cache.set(song, url);
    return url;
  }

  /**
   * Punto de entrada: pásale el texto crudo del streaming.
   * cb(titulo, caratula) se llama:
   *   - al instante con la carátula anterior/null (para no retrasar el texto)
   *   - de nuevo cuando llega la carátula
   * Si es un jingle (o vacío) no llama a cb: se mantiene la última canción real.
   */
  async function update(raw, cb) {
    raw = clean(raw);                       // 1º limpiar, 2º analizar
    if (!raw || isJingle(raw)) return;      // mantener pantalla actual
    if (raw === lastSong) return;           // sin cambios

    lastSong = raw;
    lastCover = null;
    cb(raw, null);

    var cover = await getCover(raw);
    if (raw !== lastSong) return;           // llegó otra canción mientras buscábamos
    lastCover = cover;
    if (cover) cb(raw, cover);
  }

  window.NexoCover = { clean: clean, isJingle: isJingle, getCover: getCover, update: update };
})();
