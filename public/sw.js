// Trocar o nome apaga, na ativação, tudo o que versões anteriores guardaram.
const CACHE_NAME = "acheinovale-static-v8-immutable-only";

// Só arquivos com hash no nome podem vir do cache sem perguntar ao servidor:
// um deploy novo gera nomes novos. Páginas, imagens de /public e /_next/image
// sempre vão à rede (o cache HTTP do navegador cuida delas), para nunca mostrar
// uma versão antiga depois de um deploy.
function shouldServeFromCache(requestUrl, method, siteOrigin) {
  if (method !== "GET") return false;
  const url = new URL(requestUrl);
  return url.origin === siteOrigin && url.pathname.startsWith("/_next/static/");
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!shouldServeFromCache(request.url, request.method, self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }),
  );
});
