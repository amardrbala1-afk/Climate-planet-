const CACHE='climate-planet-v3-shell-1';
const CORE=['/','/assets/app.js','/assets/space.js','/assets/v3.js','/assets/operations.js','/assets/models.js','/assets/style.css','/assets/v3.css','/data/cosmos-v3.json','/images/brand/climate-planet-mark.webp'];
self.addEventListener('install',evt=>evt.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',evt=>evt.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',evt=>{const u=new URL(evt.request.url);if(evt.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/data/')&&u.pathname!=='/data/cosmos-v3.json'||u.pathname.startsWith('/articles/'))return;
 evt.respondWith(fetch(evt.request).then(response=>{if(response.ok&&u.pathname!=='/')caches.open(CACHE).then(cache=>cache.put(evt.request,response.clone())).catch(()=>{});return response}).catch(()=>caches.match(evt.request).then(r=>r||Response.error())));
});
