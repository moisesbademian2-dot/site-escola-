'use strict';

// Service worker: keeps the app itself (page, styles, scripts, logo) available offline. It never
// touches api/ — school data is not stored on the phone — and it always prefers the network, so an
// update on the server shows up on the next open instead of hiding behind an old cache.
// Add any new file the page loads to SHELL (a test checks index.html against this list).

const CACHE = 'portal-shell-v1';
const SHELL = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'logo2.0-quadrada.png',
  'js/core.js', 'js/app.js', 'js/dashboards.js', 'js/pessoas.js', 'js/academico.js', 'js/boletim.js',
  'js/calendario.js', 'js/auditoria.js', 'js/anos.js', 'js/fechamento.js', 'js/export.js', 'js/mensagens.js', 'js/anexos.js', 'js/justificativas.js', 'js/pwa.js', 'js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const offlineJson = () => new Response(JSON.stringify({ ok: false, error: 'Sem conexão com o servidor. Verifique sua internet e tente de novo.' }),
  { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // POSTs and other sites go straight through

  if (url.pathname.includes('/api/')) {
    // data: network only; when it fails, answer in the shape the screens already understand
    event.respondWith(fetch(req).catch(() => offlineJson()));
    return;
  }

  event.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
