const CACHE='focus-ledger-v8';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
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

  // 导航 / HTML：网络优先，保证每次打开都拿到最新版；离线时回退缓存
  const isDoc = req.mode==='navigate' || /\.html?$/.test(url.pathname) || url.pathname.endsWith('/');
  if(isDoc){
    e.respondWith(
      fetch(req).then(res=>{
        if(res&&res.status===200) caches.open(CACHE).then(c=>c.put(req,res.clone()));
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // 静态资源（图标 / manifest 等）：缓存优先
  e.respondWith(
    caches.match(req).then(cached=>{
      const net=fetch(req).then(res=>{ if(res&&res.status===200) caches.open(CACHE).then(c=>c.put(req,res.clone())); return res; });
      return cached || net;
    })
  );
});
