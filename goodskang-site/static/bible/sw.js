// 程式與經文：每次先抓新的，離線才用舊的。圖片：先用存好的（立刻出現），背景再對一次有沒有換圖。
// 圖片快取 IMG 不跟版本走，改版不會把讀者已經存好的幾百張圖清掉。
const C="bible-v23",IMG="bible-img-1";
self.addEventListener("install",e=>{self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C&&k!==IMG&&/^(bible|judges)-/.test(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
 const img=/\/(img|th)\//.test(u.pathname);
 if(img){e.respondWith(caches.open(IMG).then(async c=>{const hit=await c.match(e.request);
   const net=fetch(e.request,{cache:"no-cache"}).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;});
   if(hit){e.waitUntil(net.catch(()=>{}));return hit;}
   return net;}));return;}
 e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(e.request);
  try{const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r;}catch(err){if(hit)return hit;throw err;}}));});
