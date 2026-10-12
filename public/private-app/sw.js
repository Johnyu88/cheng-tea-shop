const VERSION="tea-private-accounting-shell-v1";
const SHELL="/private-app/";
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(VERSION).then(async cache=>{
    try{const response=await fetch(SHELL,{credentials:"same-origin",cache:"reload"});if(response.ok&&response.headers.get("content-type")?.includes("text/html"))await cache.put(SHELL,response)}catch{}
  }).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname!==SHELL&&url.pathname!=="/private-app/index.html")return;
  event.respondWith(fetch(event.request).then(async response=>{
    if(response.ok&&response.headers.get("content-type")?.includes("text/html")){const c=await caches.open(VERSION);await c.put(SHELL,response.clone())}
    return response;
  }).catch(async()=>await caches.match(SHELL)||new Response("離線頁面尚未儲存，請先連線開啟一次。",{status:503,headers:{"content-type":"text/plain;charset=utf-8"}})));
});