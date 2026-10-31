/* spotify-proxy-worker.js · Proxy mínimo para buscar carátulas en Spotify
   Spotify exige un token (Client Credentials) y este necesita tu Client Secret, que NUNCA debe ir
   en el navegador. Este Worker (gratis en Cloudflare) guarda el secreto, pide el token, busca
   la canción y devuelve solo lo necesario, con CORS.

   CÓMO PONERLO EN MARCHA:
   1. https://developer.spotify.com/dashboard -> Create app. Cualquier nombre; en "Redirect URI"
      pon https://example.com/callback (no se usa). Marca "Web API". Copia Client ID y Client Secret.
      (Desde 2026 el dueño de la app necesita cuenta Spotify Premium para apps en Development Mode.)
   2. https://dash.cloudflare.com -> Workers & Pages -> Create -> Create Worker -> Deploy -> Edit code.
      Pega ESTE archivo entero y pulsa Deploy.
   3. En el Worker: Settings -> Variables and Secrets -> añade como "Secret":
         SPOTIFY_CLIENT_ID      = tu Client ID
         SPOTIFY_CLIENT_SECRET  = tu Client Secret
      y vuelve a pulsar Deploy.
   4. Copia la URL del Worker (https://nexo-spotify.TU-USUARIO.workers.dev) y pégala en nexo-data.js:
         window.NEXO_SPOTIFY_PROXY='https://nexo-spotify.TU-USUARIO.workers.dev';
   5. (Recomendado) Cambia ALLOWED_ORIGIN por el dominio de tu web.
   Solo permite buscar canciones: no es un proxy abierto. Las respuestas se guardan 24 h en caché
   para no gastar la cuota de Spotify. */

const ALLOWED_ORIGIN = '*';          // ej.: 'https://nexofm.es'

let tokenCache = { value: '', exp: 0 };

async function getToken(env, force) {
  if (!force && tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(env.SPOTIFY_CLIENT_ID + ':' + env.SPOTIFY_CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error('token ' + r.status);
  const j = await r.json();
  tokenCache = { value: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 3600) - 60) * 1000 };
  return tokenCache.value;
}

async function search(env, target) {
  let token = await getToken(env, false);
  let up = await fetch(target, { headers: { Authorization: 'Bearer ' + token } });
  if (up.status === 401) {            // token caducado: renovar y reintentar una vez
    token = await getToken(env, true);
    up = await fetch(target, { headers: { Authorization: 'Bearer ' + token } });
  }
  return up;
}

export default {
  async fetch(req, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin'
    };
    const json = (obj, status, extra) => new Response(JSON.stringify(obj), {
      status, headers: { ...cors, 'Content-Type': 'application/json', ...(extra || {}) }
    });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'GET') return json({ tracks: [] }, 405);
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return json({ tracks: [] }, 500);

    const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 200);
    if (!q) return json({ tracks: [] }, 400);

    // Desde febrero de 2026 el máximo de "limit" es 10; usamos 5.
    const target = 'https://api.spotify.com/v1/search?type=track&limit=5&q=' + encodeURIComponent(q);
    const cacheKey = new Request(target);
    const cache = caches.default;

    const hit = await cache.match(cacheKey);
    if (hit) {
      const out = new Response(hit.body, hit);
      for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
      return out;
    }

    let up;
    try { up = await search(env, target); } catch (e) { return json({ tracks: [] }, 502); }

    // 429 (cuota/ritmo): no se cachea; se pasa Retry-After
    if (up.status === 429) return json({ tracks: [] }, 429, { 'Retry-After': up.headers.get('Retry-After') || '30' });
    if (!up.ok) return json({ tracks: [] }, 502);

    let body = null;
    try { body = await up.json(); } catch (e) {}
    const items = body && body.tracks && Array.isArray(body.tracks.items) ? body.tracks.items : null;
    if (!items) return json({ tracks: [] }, 502);

    const tracks = items.filter(Boolean).map(t => ({
      name: t.name || '',
      artists: (t.artists || []).map(a => a.name),
      image: (t.album && t.album.images && t.album.images[0] && t.album.images[0].url) || ''   // 640x640
    }));

    const res = new Response(JSON.stringify({ tracks }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
    });
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  }
};
