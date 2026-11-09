const CACHE='rpg-bc-v4';
const ARCHIVOS=['./','index.html','manifest.json','icon-192.png','icon-512.png','og.jpg',
'img/rio-canoa.jpg','img/rio-isla.jpg','img/atardecer.jpg','img/siembra.jpg','img/arbol.jpg',
'img/equipo.jpg','img/letras-caucasia.jpg','img/templo.jpg','img/monumento.jpg','img/mapa-bajo-cauca.jpg','img/mapa-colombia.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARCHIVOS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
