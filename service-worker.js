const CACHE_NAME = 'finance-app-v11';
const urlsToCache = ['./', './index.html', './manifest.json'];

// При установке — сразу активируем новый worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Немедленная активация
  );
});

// При активации — очищаем старые кэши и берём контроль
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляю старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Немедленный контроль над всеми страницами
  );
});

// При запросе файлов — используем кэш, но обновляем в фоне
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Клонируем запрос для проверки обновлений
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Если получили ответ от сети — обновляем кэш
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Если сеть недоступна — используем кэш
          return response;
        });

        // Возвращаем кэш сразу (быстро), а обновление идёт в фоне
        return response || fetchPromise;
      })
  );
});

// Проверка обновлений при каждом открытии
self.addEventListener('message', event => {
  if (event.data === 'checkForUpdate') {
    self.skipWaiting();
  }
});
