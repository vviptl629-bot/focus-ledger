const CACHE='focus-ledger-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;   // 跨域（api.github.com）直连，不缓存
  if(req.method!=='GET') return;
  e.respondWith(
    caches.match(req).then(cached=>{
      const net=fetch(req).then(res=>{ if(res&&res.status===200) caches.open(CACHE).then(c=>c.put(req,res.clone())); return res; });
      return cached || net;
    })
  );
});
