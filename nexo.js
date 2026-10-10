(function(){
  var f = function(){}, N = {style:{},dataset:{},classList:{toggle:f,add:f,remove:f},setAttribute:f,addEventListener:f};
  var $ = function(id){ return document.getElementById(id) || N; };
  var CE = 'info@nexofm.es';
  // Reproductor, aviso y diálogo compartidos por todas las variantes
  document.body.insertAdjacentHTML('beforeend',
    '<dialog id="dlg" aria-labelledby="dt"><button class="x" id="dx" aria-label="Cerrar">&times;</button><h2 id="dt"></h2><div id="db"></div></dialog>'+
    '<div class="player" id="player" role="region" aria-label="Reproductor de Nexo FM"><div class="ppg" aria-hidden="true"><i id="ppBar"></i></div><div class="in"><div class="cv"><img id="pCover" alt=""></div><div class="pi"><div class="pb"><span class="dot"></span><span id="pBadge">En directo</span></div><div class="pt" id="pTrack">Nexo FM</div><div class="pa" id="pArtist">Pulsa play para escuchar</div></div><div class="wf" aria-hidden="true">'+new Array(21).join('<i></i>')+'</div><div class="vc"><button class="mt" id="mute" aria-label="Silenciar"><svg id="muteIc" viewBox="0 0 24 24"></svg></button><input class="vol" id="vol" type="range" min="0" max="100" value="80" aria-label="Volumen"></div><button class="pbtn" id="fab" aria-label="Reproducir"><svg id="fabIcon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div></div><audio id="audio" preload="none"></audio><div class="toast" id="toast" role="status"></div>');
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  var P = [
    {n:'Madrugada Nexo', img:'NOCHV.png', h:250, d:'Hits sin parar mientras la ciudad duerme', days:[1,2,3,4,5], s:0, e:8},
    {n:'Las mañanas techno', img:'Las.png', h:260, d:'Las mañanas con más energía', days:[1,2,3,4,5], s:8, e:12},
    {n:'Hits del mediodía', img:'hits medio.png', h:220, d:'Un respiro con los temas que más suenan', days:[1,2,3,4,5], s:12, e:14},
    {n:'Los mejores hits', img:'lmhits.png', h:200, d:'Los temazos del momento', days:[1,2,3,4,5], s:14, e:19},
    {n:'Música variada', img:'musicav.png', h:330, d:'Música variada todo el día', days:[1,2,3,4], s:19, e:22},
    {n:'Nexo Night', img:'nnights.png', h:300, d:'Cerramos el día con lo mejor', days:[1,2,3,4,5], s:22, e:24},
    {n:'Madrugada Nexo', img:'FINV.png', h:270, d:'Hits sin parar mientras la ciudad duerme', days:[0,6], s:0, e:10},
    {n:'NEXO FM+', img:'nfmb2.png', h:210, d:'Arranca el finde con buen ritmo', days:[0,6], s:10, e:14},
    {n:'Tardes de temazos', img:'lmhits.png', h:200, d:'Los éxitos de la semana, sin prisa', days:[0,6], s:14, e:19},
    {n:'NEXO FM', img:'nfmb3.png', h:260, d:'Calienta motores antes de salir', days:[0,6], s:19, e:22},
    {n:'NEXO FM+', img:'nfmb2.png', h:260, d:'Calienta motores antes de salir', days:[5], s:19, e:22},
    {n:'Los findes variados', img:'FINV.png', h:150, d:'El fin de semana no para', days:[0,6], s:22, e:24}
  ];
  P.forEach(function(p){ p.l = (p.days.length === 5 ? 'L-V' : 'S-D') + ' · ' + pad(p.s) + ':00-' + pad(p.e % 24) + ':00'; });
  var TAB = [[1,'Lun'],[2,'Mar'],[3,'Mié'],[4,'Jue'],[5,'Vie'],[6,'Sáb'],[0,'Dom']];
  var cvKey = '', sel = new Date().getDay(), bgKey = '', curKey = '';
  function art(label, hue, nt){
    hue = +hue || 230; var bars = '', i;
    for (i = 0; i < 28; i++){ var hh = 40 + Math.abs(Math.sin(i*1.7 + hue)) * 190; bars += '<rect x="'+(24+i*27)+'" y="'+(500-hh)+'" width="14" height="'+hh+'" fill="#fff" opacity=".14"/>'; }
    var fs = Math.max(22, Math.min(48, 520 / (label.length * .78)));
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#150d08"/><stop offset="1" stop-color="hsl('+(10+hue%30)+',80%,24%)"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><circle cx="660" cy="110" r="150" fill="#ff7a1a" opacity=".9"/>'+bars+(nt?'':'<text x="400" y="300" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="'+fs+'" fill="#fff">'+label.toUpperCase().replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</text>')+'</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }
  window.__art = art; window.NEXO = {P:P};
  function fmt(m){ m = Math.max(0, Math.ceil(m)); var h = Math.floor(m/60), r = m % 60; return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : r + ' min'; }
  function state(now){
    var d = now.getDay(), m = now.getHours()*60 + now.getMinutes() + now.getSeconds()/60, cur = null, nx = null, best = 1e9;
    P.forEach(function(p){
      if (p.days.indexOf(d) > -1 && m >= p.s*60 && m < p.e*60) cur = p;
      for (var k = 0; k <= 7; k++){ if (p.days.indexOf((d+k)%7) < 0) continue; var st = k*1440 + p.s*60; if (st <= m) continue; if (st - m < best){ best = st - m; nx = p; } }
    });
    return {cur:cur, nx:nx, wait:best, m:m, d:d};
  }
  function stat(p, s){
    if (sel !== s.d || p.days.indexOf(s.d) < 0) return ['', 0];
    if (p === s.cur) return ['Termina en ' + fmt(p.e*60 - s.m), (s.m - p.s*60) / ((p.e - p.s)*60) * 100];
    if (p === s.nx && s.wait < 1440) return ['Siguiente · empieza en ' + fmt(s.wait), 0];
    return [s.m >= p.e*60 ? 'Ya emitido hoy' : 'Más tarde hoy', 0];
  }
  function render(){
    var s = state(new Date()), rows = P.filter(function(p){ return p.days.indexOf(sel) > -1; }).sort(function(a,b){ return a.s - b.s; });
    $('tabs').innerHTML = TAB.map(function(t){ return '<button role="tab" data-d="'+t[0]+'" aria-selected="'+(t[0]===sel)+'">'+t[1]+(t[0]===s.d?'<i class="td"></i>':'')+'</button>'; }).join('');
    $('list').innerHTML = rows.map(function(p, k){
      var i = P.indexOf(p), on = p === s.cur && sel === s.d, r = stat(p, s);
      return '<article class="card'+(on?' cur':'')+'" data-i="'+i+'" tabindex="0" role="button" style="--k:'+k+'"><div class="im">'+(on?'<span class="air"><span class="dot"></span>EN DIRECTO</span>':'')+'<img src="'+p.img+'" alt="'+p.n+'" loading="lazy" onerror="this.onerror=null;this.src=__art(\''+p.n+'\','+p.h+')"></div><div class="bd"><div class="hh">'+pad(p.s)+':00 <span>— '+pad(p.e % 24)+':00</span></div><h3>'+p.n+'</h3><p>'+p.d+'</p><div class="st" id="st'+i+'">'+r[0]+'</div>'+(on?'<div class="pgc"><i id="pb'+i+'" style="width:'+r[1]+'%"></i></div>':'')+'</div></article>';
    }).join('');
  }
  $('tabs').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ sel = +b.dataset.d; render(); } });
  function setBg(src, label, hue){
    if (bgKey === src) return; bgKey = src;
    var im = $('heroBg'); im.style.opacity = 0;
    im.onload = function(){ im.style.opacity = 1; };
    im.onerror = function(){ im.onerror = null; im.src = art(label, hue, 1); };
    im.src = src;
  }
  function tick(){
    var s = state(new Date()), c = s.cur, ci = c ? c.img : 'portada.jpg';
    setBg(ci, c ? c.n : 'Nexo FM', c ? c.h : 230);
    if (cvKey !== ci){ cvKey = ci; var pc = $('pCover'); pc.onerror = function(){ pc.onerror = null; pc.src = art(c ? c.n : 'Nexo FM', c ? c.h : 230, 1); }; pc.src = ci; }
    $('pBadge').textContent = 'En directo · ' + (c ? c.n : 'Solo hits 24 h');
    $('ppBar').style.width = c ? ((s.m - c.s*60) / ((c.e - c.s)*60) * 100) + '%' : '0';
    if (curKey !== (c ? c.n : '-')){
      curKey = c ? c.n : '-';
      $('liveTxt').textContent = 'En directo · ' + (c ? c.n : 'Solo hits 24 h');
      $('nowProg').textContent = c ? c.n + ' · ' + c.l : 'Solo hits, 24 horas';
      render();
    }
    $('pgw').style.display = c ? '' : 'none';
    if (c){ $('pgBar').style.width = ((s.m - c.s*60) / ((c.e - c.s)*60) * 100) + '%'; $('pgL').textContent = 'Desde las ' + c.s + ':00'; $('pgR').textContent = 'Termina en ' + fmt(c.e*60 - s.m); }
    $('nxLine').textContent = 'Siguiente: ' + s.nx.n + ' · en ' + fmt(s.wait);
    P.forEach(function(p, i){ var r = stat(p, s), e = $('st'+i), b = $('pb'+i); if (e) e.textContent = r[0]; if (b) b.style.width = r[1] + '%'; });
  }
  var M = {
    equipo:['Nuestro equipo','<p>Nexo FM es una emisora musical de solo hits, con emisión las 24 horas en Burgos (104.7 FM) y Cantabria (105.8 FM).</p><p>Detrás del micro hay un equipo de locutores y programadores que selecciona cada día los temas del momento.</p>'],
    contacto:['Contacto','<p>Escríbenos a <a href="mailto:'+CE+'">'+CE+'</a> para publicidad, peticiones o colaboraciones.</p><p>Frecuencias: Burgos 104.7 FM · Cantabria 105.8 FM.</p>'],
    legal:['Aviso legal','<p>Este sitio web es propiedad de Nexo FM. Los contenidos, marcas y logotipos son de su titular y no pueden reproducirse sin autorización.</p>'],
    privacidad:['Privacidad','<p>La dirección de correo que facilites para recibir novedades se usará solo para ese fin. Puedes pedir su baja escribiendo a <a href="mailto:'+CE+'">'+CE+'</a>.</p>'],
    cookies:['Cookies','<p>Esta web no usa cookies de seguimiento propias. Servicios externos como Google Fonts y el servidor de streaming pueden recibir tu dirección IP al cargar.</p>'],
    n0:['Nexo FM renueva su identidad','<p>La emisora Nexo FM renueva su identidad con un nuevo diseño y contenido.</p>']
  };
  var dlg = $('dlg');
  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-m]'); if (!a) return; e.preventDefault();
    var m = M[a.dataset.m]; if (!m) return; $('dt').textContent = m[0]; $('db').innerHTML = m[1];
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  });
  $('dx').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
  $('nlForm').addEventListener('submit', function(e){ e.preventDefault(); document.body.classList.add('sent'); e.target.reset(); });

  var tt;
  function toast(m){ var t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function(){ t.classList.remove('show'); }, 2800); }
  var STREAM = 'https://stream.zeno.fm/6wxdxt9fvpltv', META = 'https://api.zeno.fm/mounts/metadata/subscribe/6wxdxt9fvpltv';
  var a = $('audio'), playing = false, loading = false;
  var IP = '<path d="M8 5v14l11-7z"/>', IA = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>', IL = '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="25 25"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite"/></circle>';
  function ui(s){
    var i = s === 'play' ? IP : s === 'pause' ? IA : IL;
    $('fabIcon').innerHTML = i; $('heroIcon').innerHTML = i;
    $('fab').setAttribute('aria-label', s === 'pause' ? 'Pausar' : 'Reproducir');
    $('heroPlay').setAttribute('aria-label', s === 'pause' ? 'Pausar' : 'Escuchar en directo');
    document.body.classList.toggle('on', s === 'pause'); $('player').classList.toggle('playing', s === 'pause');
  }
  function np(t, ar){
    $('nowTrack').textContent = $('pTrack').textContent = t;
    $('nowArtist').textContent = $('pArtist').textContent = ar;
    if ('mediaSession' in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({title:t, artist:ar, album:'Nexo FM · Solo Hits'});
  }
  function toggle(e){
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    if (playing) { a.pause(); return; }
    loading = true; ui('load');
    if (a.src !== STREAM) a.src = STREAM;
    a.play().catch(function(){ loading = false; ui('play'); toast('No se ha podido conectar con el directo.'); });
  }
  a.addEventListener('playing', function(){ loading = false; playing = true; ui('pause'); });
  a.addEventListener('waiting', function(){ loading = true; ui('load'); });
  a.addEventListener('pause', function(){ loading = false; playing = false; ui('play'); });
  a.addEventListener('error', function(){ loading = false; playing = false; ui('play'); });
  ['fab','heroPlay','footPlay','topPlay'].forEach(function(id){ $(id).addEventListener('click', toggle); });
  if ('mediaSession' in navigator) { navigator.mediaSession.setActionHandler('play', toggle); navigator.mediaSession.setActionHandler('pause', function(){ a.pause(); }); }
  ui('play'); a.volume = .8;
  var SP = '<path d="M3 10v4h4l5 5V5L7 10z"/>', IV = SP + '<path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>', IM = SP + '<path d="M17 9l5 6M22 9l-5 6"/>';
  function muteUi(){ var m = a.muted || a.volume === 0; $('muteIc').innerHTML = m ? IM : IV; $('mute').setAttribute('aria-label', m ? 'Activar sonido' : 'Silenciar'); }
  $('vol').addEventListener('input', function(e){ a.volume = e.target.value / 100; a.muted = false; muteUi(); });
  $('mute').addEventListener('click', function(){ if (a.volume === 0){ a.volume = .8; $('vol').value = 80; a.muted = false; } else a.muted = !a.muted; muteUi(); });
  muteUi();
  np('Nexo FM', 'Conectando con el directo…');
  var got = false, fb = setTimeout(function(){ if (!got) np('Nexo FM', 'En directo · Solo Hits'); }, 4000);
  try {
    var es = new EventSource(META);
    es.onmessage = function(ev){
      try {
        var d = JSON.parse(ev.data), t = d.streamTitle || '', p = t.split(' - ');
        got = true; clearTimeout(fb);
        if (p.length >= 2) np(p.slice(1).join(' - ').trim(), p[0].trim()); else if (t) np(t, 'Nexo FM');
      } catch(x){}
    };
    es.onerror = function(){};
  } catch(x){ np('Nexo FM', 'En directo · Solo Hits'); }
  tick(); setInterval(tick, 1000);
})();
