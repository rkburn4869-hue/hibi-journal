/* =========================================================
   Hibi — Service Worker
   アプリ本体をキャッシュし、オフラインでも起動できるようにする。
   ========================================================= */

const CACHE = "hibi-v2"; // キャッシュのバージョン（更新時に数字を上げる）

// 最初にキャッシュしておく「アプリの骨組み」
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

// インストール時：アセットをまとめてキャッシュ
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 有効化時：古いバージョンのキャッシュを削除
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 取得時：キャッシュ優先。なければネットワークから取得しつつキャッシュに追加
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // 同一オリジンのGETレスポンスのみキャッシュに保存
        if (new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
