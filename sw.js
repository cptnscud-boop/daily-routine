const C='routine-v6',ASSETS=['./','index.html','manifest.json','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// network-first for pages (so updates arrive), cache fallback offline; cache-first for other assets
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const nav=e.request.mode==='navigate';
 e.respondWith(nav?fetch(e.request).then(r=>{caches.open(C).then(c=>c.put('index.html',r.clone()));return r}).catch(()=>caches.match('index.html'))
 :caches.match(e.request).then(h=>h||fetch(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
 if(e.action==='add250'){if(cs.length){cs[0].postMessage({type:'add250'});return}return self.clients.openWindow('./?add=250')}
 if(cs.length)return cs[0].focus();return self.clients.openWindow('./')}))});
