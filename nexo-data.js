// Logo de la web: pon aquí la ruta de tu imagen (ej. 'logo.png' o 'img/logo.svg'). Vacío = texto NEXO FM
window.NEXO_LOGO='logo.svg';
// ⚠ Pon aquí la URL real de tu stream
window.NEXO_STREAM='https://stream.zeno.fm/6wxdxt9fvpltv';
// Carátulas con Spotify. Pega aquí la URL de tu Worker de Cloudflare (ver spotify-proxy-worker.js).
// Mientras esté vacío se usa iTunes como respaldo. Ej.: 'https://nexo-spotify.tu-usuario.workers.dev'
window.NEXO_SPOTIFY_PROXY='';
// Programación: s/e = hora inicio/fin · days = 1 (lun) … 6 (sáb), 0 (dom)
window.NEXO_P=[
 {n:'Las Mañanas Techno',s:7,e:10,days:[1,2,3,4,5],d:'Despierta con los mayores éxitos, noticias y buen humor.'},
 {n:'Solo Hits Mañana',s:10,e:14,days:[1,2,3,4,5],d:'Música non-stop y las canciones que más suenan.'},
 {n:'Solo Temazos',s:14,e:16,days:[1,2,3,4,5],d:'Los mejores temazos de la radio, sin parar.'},
 
 {n:'Nexo Nights',s:20,e:24,days:[0,1,2,3,4,5,6],d:'Los mejores hits para cerrar el día.'},
 {n:'Temazos de Fin de Semana ',s:9,e:20,days:[0,6],d:'Sábados y domingos con la mejor selección musical.'},
 {n:'Solo Temazos 24h',s:0,e:7,days:[0,1,2,3,4,5,6],d:'Música sin parar durante la madrugada.'}
];
// Top 10 Nexo (ejemplo: cámbialo por tu lista real) · mv: 1 sube, -1 baja, 0 igual
window.NEXO_TOP=[
 ['Loser','Tame Impala',1],['Bass Persuades','Myley Cyrus',1],['AGUA','Maluma & Shakira',1],
 ['','',0],['','',0],['','',0],
 ['','',0],['','',0],['','',0],['','',0]];
// ⚠ Cambia por tus datos reales de contacto (WhatsApp con prefijo, sin +)
window.NEXO_CONTACT={mail:'trsnetspain@gmail.com'};

// "Ahora suena" en directo. Elige UNA opción:
// Zeno (tu stream actual):   {type:'zeno', id:'6wxdxt9fvpltv'}
// Icecast:                   {type:'icecast', url:'https://TU-SERVIDOR/status-json.xsl', mount:'/stream'}
// Shoutcast v2:              {type:'shoutcast', url:'https://TU-SERVIDOR/stats?sid=1&json=1'}
// Otro (JSON genérico):      {type:'json', url:'https://...', path:'now_playing.song.text'}
window.NEXO_META={type:'zeno',id:'6wxdxt9fvpltv'};


// Podcasts. Para publicar un episodio rellena "src" con la URL https (o ruta local) de un .mp3/.m4a/.ogg.
// Sube tus audios a la carpeta /podcasts y usa src:'podcasts/episodio1.mp3'. Sin "src" el episodio aparece como "Próximamente". Los tres de abajo son marcadores de ejemplo: cámbialos.
window.NEXO_PODCASTS=[
 {t:'Episodio 1 · Así nace Nexo FM',d:'La historia de la emisora y lo que viene.',date:'',dur:'',src:'https://ak.picdn.net/shutterstock/audio/40837/preview/preview.mp3'},
 
];
