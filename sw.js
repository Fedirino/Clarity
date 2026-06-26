self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification?.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(clients => {
      const targetBase = target.split('#')[0];
      for (const client of clients) {
        if ('focus' in client && (target === '/' || client.url.startsWith(targetBase))) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
