(function(){'use strict';
 var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
 var $=function(s){return document.querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))},pg=document.body.dataset.p||'',RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
 var I='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',Q='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',LG=window.NEXO_LOGO,L=LG?'<a class="logo" href="index.html"><img src="'+LG+'" alt="Nexo FM"></a>':'<a class="logo" href="index.html">NEXO<b>FM</b></a>',eq='<div class="eq">'+new Array(22).join('<i></i>').replace(/^/,'<i></i>')+'</div>';
 if(LG){var fi=document.querySelector('link[rel=icon]')||document.head.appendChild(document.createElement('link'));fi.rel='icon';fi.href=LG}
 $('#top').innerHTML='<div class="nav"><div class="wrap">'+L+'<nav aria-label="Principal">'+[['index.html','Inicio','i'],['programacion.html','Programación','p'],['podcasts.html','Podcasts','c'],['frecuencias.html','Frecuencias','f'],['index.html#noticias','Noticias','n']].map(function(x){return '<a href="'+x[0]+'"'+(x[2]===pg?' aria-current="page"':'')+'>'+x[1]+'</a>'}).join('')+'</nav><span class="live">EN DIRECTO</span></div></div>';
 $('#foot').innerHTML='<footer class="ft"><div class="wrap"><div>'+L+'<p>Solo hits, 24 horas.</p></div><div><h4>Emisora</h4><a href="programacion.html">Programación</a><a href="podcasts.html">Podcasts</a><a href="frecuencias.html">Frecuencias</a><a href="index.html#contacto">Contacto y publicidad</a></div><div><h4>Legal</h4><a href="legal.html#aviso">Aviso legal</a><a href="legal.html#privacidad">Privacidad</a><a href="legal.html#cookies">Cookies</a></div><div><h4>Síguenos</h4><a href="https://www.instagram.com/nexofm_es">Instagram</a><a href="https://x.com/nexofm_es">X</a><a href="https://www.youtube.com/@nexofm">YouTube</a></div></div><div class="wrap"><small>© 2026 Nexo FM. Todos los derechos reservados.</small></div></footer><div class="bar"><div class="wrap"><button class="pb" id="bp" aria-label="Escuchar en directo">'+I+'</button><img class="cover" data-cover hidden alt="" width="56" height="56"><div class="i"><b>Nexo FM · En directo</b><small id="bs">Solo hits, 24 horas</small></div>'+eq+'</div><audio id="au" preload="none"></audio></div>';
 $$('.eq').forEach(function(e){if(!e.children.length)e.innerHTML=new Array(22).join('<i></i>');[].forEach.call(e.children,function(i){i.style.setProperty('--d',(.35+Math.random()*.7).toFixed(2)+'s');i.style.setProperty('--s',(-Math.random()).toFixed(2)+'s')})});
 var pa=new Audio(),a=$('#au'),btns=[$('#bp')].concat($$('[data-play]'));
 function paint(){document.body.classList.toggle('on',!a.paused);btns.forEach(function(b){if(b.tagName==='BUTTON'&&b.classList.contains('pb'))b.innerHTML=a.paused?I:Q})}
 btns.forEach(function(b){b.addEventListener('click',function(){if(!/^https:\/\//i.test(window.NEXO_STREAM||'')){$('#bs').textContent='Añade la URL del stream en nexo-data.js';return}lv();if(a.paused){pa.pause();var pr=a.play();if(pr&&pr.catch)pr.catch(function(){})}else a.pause()})});
 a.addEventListener('play',function(){pa.pause();paint()});a.addEventListener('pause',paint);
 // directo: tras una pausa se recarga el stream para volver al directo (no al audio atrasado en el búfer)
 var stale=0;function lv(){if(!a.src||stale){a.src=window.NEXO_STREAM;stale=0}}
 a.addEventListener('pause',function(){stale=1});
 // programa actual
 var n=new Date(),h=n.getHours(),dy=n.getDay(),mn=h*60+n.getMinutes(),P=window.NEXO_P,F=function(x){return ('0'+(x%24)).slice(-2)+':00'};
 var today=P.filter(function(p){return p.days.indexOf(dy)>-1}).sort(function(x,y){return x.s-y.s}),
  now=today.filter(function(p){return h>=p.s&&h<p.e})[0],nx=today.filter(function(p){return p.s>=h&&p!==now})[0];
 function pct(p){return Math.max(0,Math.min(100,(mn-p.s*60)/((p.e-p.s)*60)*100))}
 if(now){$('#bs').textContent=now.n;$$('[data-now]').forEach(function(e){e.textContent=now.n});$$('[data-nowd]').forEach(function(e){e.textContent=now.d+' · hasta las '+F(now.e)});setTimeout(function(){$$('#pgb').forEach(function(e){e.style.width=pct(now)+'%'})},300)}
 if(nx)$$('[data-next]').forEach(function(e){e.textContent=F(nx.s)+' · '+nx.n});
 if(pg==='p'||pg==='c')document.body.classList.add('lock');
 // dial
 var D=$('#dial');
 if(D){var MIN=88,MAX=108,ST=[{f:106.0,n:'Nexo FM Burgos'},{f:105.8,n:'Nexo FM Cantabria · Reinosa'}],cur=MIN,raf,first=1,tk='',X=function(f){return (f-MIN)/(MAX-MIN)*100};
  for(var f=MIN;f<=MAX;f+=.5)tk+='<i class="t'+(f%1?'':' b')+'" style="left:'+X(f)+'%"></i>'+(f%2?'':'<span class="n" style="left:'+X(f)+'%">'+f+'</span>');
  D.innerHTML='<div class="scale" id="sc">'+tk+ST.map(function(s){return '<button class="st" data-f="'+s.f+'" style="left:'+X(s.f)+'%" aria-label="Sintonizar '+s.n+' '+s.f+'"></button>'}).join('')+'<div class="needle" id="nd"></div></div><div class="ro"><b id="rf">88.0</b><span id="rs">Buscando señal…</span></div>';
  function set(f){cur=Math.max(MIN,Math.min(MAX,f));$('#nd').style.left=X(cur)+'%';$('#rf').textContent=cur.toFixed(1);
   var s=ST.filter(function(s){return Math.abs(s.f-cur)<.12})[0];D.classList.toggle('tuned',!!s);$('#rs').textContent=s?'Sintonizado · '+s.n:'Estática…';
   }
  function go(to,ms){cancelAnimationFrame(raf);if(RM){set(to);return}var a0=cur,t0=performance.now();(function s(t){var p=Math.min((t-t0)/ms,1),e=1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);set(a0+(to-a0)*e);if(p<1)raf=requestAnimationFrame(s);else if(first===0)first=3})(t0)}
  $$('.st').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();go(+b.dataset.f,900)})});
  var sc=$('#sc'),dr=0;function at(e){var r=sc.getBoundingClientRect();set(MIN+(e.clientX-r.left)/r.width*(MAX-MIN))}
  sc.addEventListener('pointerdown',function(e){dr=1;cancelAnimationFrame(raf);sc.setPointerCapture(e.pointerId);at(e)});
  sc.addEventListener('pointermove',function(e){if(dr)at(e)});sc.addEventListener('pointerup',function(){dr=0});
  first=0;
  setTimeout(function(){go(106.0,RM?1:2600);setTimeout(function(){document.body.classList.add('lock')},RM?0:2700)},500)}
 // top 10
 var T=$('#chart');if(T){T.innerHTML=window.NEXO_TOP.filter(function(t){return t[0]}).map(function(t,i){return '<li style="--i:'+i+'"><em>'+(i+1)+'</em><div><b>'+esc(t[0])+'</b><small>'+esc(t[1])+'</small></div><span class="'+(t[2]>0?'up':t[2]<0?'dn':'')+'" aria-label="'+(t[2]>0?'sube':t[2]<0?'baja':'igual')+'">'+(t[2]>0?'▲':t[2]<0?'▼':'–')+'</span></li>'}).join('');
  new IntersectionObserver(function(en,o){if(en[0].isIntersecting){T.classList.add('v');o.disconnect()}},{threshold:.2}).observe(T)}
 // programación
 var B=$('#tabs');if(B){var DN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],sel=dy;
  B.innerHTML=[1,2,3,4,5,6,0].map(function(d){return '<button role="tab" data-d="'+d+'">'+DN[d]+'</button>'}).join('')+'<u id="ul"></u>';
  function draw(){$$('#tabs button').forEach(function(b){var on=+b.dataset.d===sel;b.setAttribute('aria-selected',on);if(on){var u=$('#ul');u.style.left=b.offsetLeft+'px';u.style.width=b.offsetWidth+'px'}});
   $('#list').innerHTML=P.filter(function(p){return p.days.indexOf(sel)>-1}).sort(function(x,y){return x.s-y.s}).map(function(p){var on=sel===dy&&h>=p.s&&h<p.e;return '<div class="row'+(on?' on':'')+'"><time>'+F(p.s)+'</time><div><h3>'+esc(p.n)+'</h3><p>'+esc(p.d)+'</p>'+(on?'<div class="pg"><i style="width:'+pct(p)+'%"></i></div>':'')+'</div></div>'}).join('')}
  B.addEventListener('click',function(e){if(e.target.dataset.d){sel=+e.target.dataset.d;draw()}});draw();addEventListener('resize',draw)}


 // metadatos en directo (Icecast / Zeno / JSON genérico)
 var M=window.NEXO_META||{};
 var lt='',lc=null,MS=('mediaSession' in navigator)&&window.MediaMetadata;
 // carátula para pantalla de bloqueo / Bluetooth / coche: la real o, si no hay, el logo
 function art(){var u=lc||(LG?new URL(LG,location.href).href:'');if(!u)return [];
  var t=lc?'image/jpeg':/\.svg(\?|$)/i.test(u)?'image/svg+xml':/\.png(\?|$)/i.test(u)?'image/png':'image/jpeg';
  return [{src:u,sizes:lc?'640x640':'512x512',type:t}]}
 function ms(){try{if(!MS||a.paused)return;var i=lt.indexOf(' - ');
  navigator.mediaSession.metadata=new MediaMetadata({title:lt?(i>-1?lt.slice(i+3):lt):'Nexo FM · En directo',artist:i>-1?lt.slice(0,i):'Nexo FM',album:'Nexo FM · En directo',artwork:art()});
  navigator.mediaSession.playbackState='playing'}catch(_){}}
 // botones del móvil, auriculares Bluetooth y volante: play / pausa (en directo no hay saltos)
 function msh(){if(!MS)return;var m=navigator.mediaSession,h=function(n,f){try{m.setActionHandler(n,f)}catch(_){}};
  h('play',function(){lv();pa.pause();var pr=a.play();if(pr&&pr.catch)pr.catch(function(){})});
  h('pause',function(){a.pause()});h('stop',function(){a.pause()});
  ['seekbackward','seekforward','seekto','previoustrack','nexttrack'].forEach(function(n){h(n,null)})}
 a.addEventListener('play',function(){msh();ms()});
 a.addEventListener('pause',function(){try{if(MS)navigator.mediaSession.playbackState='paused'}catch(_){}});
 function song(t){NexoCover.update(t,function(title,cover){lt=title;lc=cover;ms();
  $$('[data-song]').forEach(function(e){e.textContent=title});$('#bs').textContent=title;
  $$('[data-cover]').forEach(function(img){var src=cover||LG;if(!src){img.hidden=true;return}img.classList.toggle('logo',!cover);img.onerror=function(){img.onerror=function(){img.hidden=true};if(LG&&img.getAttribute('src')!==LG){img.classList.add('logo');img.src=LG}else img.hidden=true};img.src=src;img.hidden=false});
  $$('[data-bg]').forEach(function(e){if(cover){e.style.backgroundImage='url("'+encodeURI(cover)+'")';e.classList.add('on')}else e.classList.remove('on')})})}
 function poll(){fetch(M.url,{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){var t='',s;
  if(M.type==='icecast'){s=[].concat(j.icestats.source||[]);if(M.mount)s=s.filter(function(x){return (x.listenurl||'').indexOf(M.mount)>-1});s=s[0]||{};t=s.title?(s.artist?s.artist+' - ':'')+s.title:''}
  else if(M.type==='shoutcast')t=j.songtitle;
  else t=(M.path||'title').split('.').reduce(function(a,k){return a&&a[k]},j);
  song(t)}).catch(function(){})}
 if(M.type==='zeno'&&/^[\w-]+$/.test(M.id||'')&&window.EventSource)new EventSource('https://api.zeno.fm/mounts/metadata/subscribe/'+M.id).onmessage=function(e){try{song(JSON.parse(e.data).streamTitle)}catch(_){}};
 else if(/^https:\/\//i.test(M.url||'')){poll();setInterval(poll,15000)}
 // pedir canción
 var C=window.NEXO_CONTACT||{},R=$('#req');
 if(R)R.addEventListener('submit',function(e){e.preventDefault();var v=function(i){return R.elements[i].value.trim()};
  var t='Hola Nexo FM, quiero pedir: '+v('song')+(v('ded')?' · Dedicatoria: '+v('ded'):'')+(v('name')?' · De: '+v('name'):'');
  open('https://wa.me/'+String(C.wa||'').replace(/\D/g,'')+'?text='+encodeURIComponent(t),'_blank','noopener')});
 $$('[data-share]').forEach(function(b){b.addEventListener('click',function(){var d={title:'Nexo FM',text:'Solo temazos, 24 horas',url:location.origin+location.pathname.replace(/[^\/]*$/,'')};
  if(navigator.share)navigator.share(d).catch(function(){});else if(navigator.clipboard){navigator.clipboard.writeText(d.url);b.textContent='Enlace copiado'}})});
 $$('[data-mail]').forEach(function(e){if(!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(C.mail||''))return;e.href='mailto:'+C.mail;e.textContent=C.mail});
 $$('[data-tel]').forEach(function(e){var w=String(C.wa||'').replace(/\D/g,'');if(!w)return;e.href='tel:+'+w;e.textContent='+'+w});

 // podcasts · reproductor propio
 var PC=$('#pods'),PL=$('#pl');
 if(PC&&PL){var E=(window.NEXO_PODCASTS||[]).filter(function(x){return x&&x.t}),cp=-1,SP=[1,1.25,1.5,2,.75],si=0,
  ok=function(u){u=u||'';return /^https:\/\/[^\s"'<>]+$/i.test(u)||/^[\w\-\/.]+\.(mp3|m4a|ogg|wav)$/i.test(u)},
  fmt=function(s){if(!isFinite(s)||s<0)return '0:00';s=Math.floor(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),c=s%60;return (h?h+':'+('0'+m).slice(-2):m)+':'+('0'+c).slice(-2)};
  PL.innerHTML='<div class="ch pl"><small id="pm">Elige un episodio</small><h2 id="pt">Reproductor de podcasts</h2>'+
   '<div class="pr"><span id="pc">0:00</span><input type="range" id="ps" min="0" max="1000" step="1" value="0" aria-label="Posición del episodio" disabled><span id="pd">0:00</span></div>'+
   '<div class="pcn"><button class="sk" id="pb15" aria-label="Retroceder 15 segundos" disabled>−15</button><button class="pb" id="pp" aria-label="Reproducir" disabled>'+I+'</button><button class="sk" id="pf30" aria-label="Avanzar 30 segundos" disabled>+30</button><button class="sk" id="psp" aria-label="Velocidad de reproducción" disabled>1×</button>'+
   '<label class="vl">Volumen<input type="range" id="pv" min="0" max="1" step=".05" value="1"></label></div><p class="pe" id="pe" role="status"></p></div>';
  PC.innerHTML=E.length?E.map(function(x,i){var r=ok(x.src);
   return '<article class="ep" data-e="'+i+'">'+(r?'<button class="pb" data-i="'+i+'" aria-label="Reproducir: '+esc(x.t)+'">'+I+'</button>':'<span class="pb off" aria-hidden="true">'+I+'</span>')+
    '<div><small>'+(r?esc(x.date||'')+(x.dur?(x.date?' · ':'')+esc(x.dur):''):'Próximamente')+'</small><h3>'+esc(x.t)+'</h3><p>'+esc(x.d||'')+'</p></div></article>'}).join(''):
   '<p class="ch">Los primeros podcasts llegan muy pronto.</p>';
  var pt=$('#pt'),pm=$('#pm'),ps=$('#ps'),pc=$('#pc'),pd=$('#pd'),pp=$('#pp'),pe=$('#pe'),b15=$('#pb15'),f30=$('#pf30'),psp=$('#psp'),pv=$('#pv');
  function fill(){var v=pa.duration?pa.currentTime/pa.duration*1000:0;ps.value=v;ps.style.setProperty('--v',(v/10)+'%');pc.textContent=fmt(pa.currentTime)}
  function ui(){var pl=cp>-1&&!pa.paused;pp.innerHTML=pl?Q:I;pp.setAttribute('aria-label',pl?'Pausar':'Reproducir');
   $$('#pods button[data-i]').forEach(function(b){b.innerHTML=(+b.dataset.i===cp&&pl)?Q:I});
   $$('#pods .ep').forEach(function(r){r.classList.toggle('on',+r.dataset.e===cp)})}
  function meta(x){try{if(!('mediaSession' in navigator)||!window.MediaMetadata)return;var m=navigator.mediaSession;m.metadata=new MediaMetadata({title:x.t,artist:'Nexo FM',album:'Podcasts'});
   m.setActionHandler('play',function(){pp.click()});m.setActionHandler('pause',function(){pp.click()});
   m.setActionHandler('seekbackward',function(){b15.click()});m.setActionHandler('seekforward',function(){f30.click()})}catch(_){}}
  function load(i,go){var x=E[i];if(!x||!ok(x.src))return;cp=i;pe.textContent='';pa.src=x.src;pa.defaultPlaybackRate=pa.playbackRate=SP[si];
   pt.textContent=x.t;pm.textContent=(x.date||'Nexo FM')+(x.dur?' · '+x.dur:'');pd.textContent=x.dur||'0:00';
   [ps,pp,b15,f30,psp].forEach(function(e){e.disabled=false});fill();meta(x);
   if(go){a.pause();var pr=pa.play();if(pr&&pr.catch)pr.catch(function(){})}ui()}
  function nextOk(from){for(var i=from+1;i<E.length;i++)if(ok(E[i].src))return i;return -1}
  pp.addEventListener('click',function(){if(cp<0){var f=nextOk(-1);if(f>-1)load(f,true);return}
   if(pa.paused){a.pause();var pr=pa.play();if(pr&&pr.catch)pr.catch(function(){})}else pa.pause()});
  ps.addEventListener('input',function(){if(pa.duration){pa.currentTime=ps.value/1000*pa.duration}fill()});
  b15.addEventListener('click',function(){pa.currentTime=Math.max(0,pa.currentTime-15)});
  f30.addEventListener('click',function(){pa.currentTime=pa.duration?Math.min(pa.duration,pa.currentTime+30):pa.currentTime+30});
  psp.addEventListener('click',function(){si=(si+1)%SP.length;pa.defaultPlaybackRate=pa.playbackRate=SP[si];psp.textContent=SP[si]+'×'});
  pv.addEventListener('input',function(){pa.volume=+pv.value;pv.style.setProperty('--v',(pv.value*100)+'%')});
  PC.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button[data-i]');if(!b)return;var i=+b.dataset.i;if(i===cp)pp.click();else load(i,true)});
  pa.addEventListener('play',ui);pa.addEventListener('pause',ui);pa.addEventListener('timeupdate',fill);
  pa.addEventListener('loadedmetadata',function(){pd.textContent=fmt(pa.duration);fill()});
  pa.addEventListener('ended',function(){var n=nextOk(cp);if(n>-1)load(n,true);else{pa.currentTime=0;ui()}});
  pa.addEventListener('error',function(){if(cp>-1)pe.textContent='No se pudo cargar este episodio. Revisa que el archivo exista y la URL sea correcta.'})}
 // enlaces externos seguros
 $$('a[href^="http"]').forEach(function(l){l.rel='noopener noreferrer';l.target='_blank'});
})();
