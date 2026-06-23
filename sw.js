self.addEventListener('push', (event) => {
  let data = { titolo: 'Promemoria Task', testo: 'Hai un impegno in scadenza!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.testo = event.data.text();
    }
  }
  const opzioni = {
    body: data.testo,
    icon: '/icona.png',
    badge: '/badge.png',
    data: {
      url: '/'
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.titolo, opzioni)
  );
});
// Gestisce il click sulla notifica per riaprire la pagina web
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});