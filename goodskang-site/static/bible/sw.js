const C="bible-v19";
self.addEventListener("install",e=>{self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
 const img=/\/img\//.test(u.pathname);
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(e.request);
  if(img&&hit)return hit;
  try{const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r;}catch(err){if(hit)return hit;throw err;}}));});
