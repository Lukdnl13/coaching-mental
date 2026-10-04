const CACHE='coaching-mental-static-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/offline.html','/favicon.svg','/images/landscape.jpg','/icons/icon-192.png','/icons/icon-512.png'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('coaching-mental-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 // Never cache API, auth, personal data, documents or React server responses.
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/offline.html')));return;}
 if(/^\/(images|icons)\//.test(u.pathname)||u.pathname==='/favicon.svg')e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();void caches.open(CACHE).then(cache=>cache.put(e.request,copy))}return r})));
});
