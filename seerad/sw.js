var CACHE = 'seerad-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL);
  }).catch(function () {}));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.pathname.indexOf('snapshot.json') >= 0) {
    e.respondWith(fetch(e.request).then(function (r) {
      var cr = r.clone();
      caches.open(CACHE).then(function (c) { c.put('snapshot', cr); });
      return r;
    }).catch(function () { return caches.match('snapshot'); }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (h) { return h || fetch(e.request); }));
});
