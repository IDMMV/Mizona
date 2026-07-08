/*
  MiZona Firebase Cloud Messaging Service Worker.
  IMPORTANTE: reemplaza los valores TU_... con los datos reales de Firebase.
*/
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'TU_FIREBASE_API_KEY',
  authDomain: 'TU_FIREBASE_AUTH_DOMAIN',
  projectId: 'TU_FIREBASE_PROJECT_ID',
  storageBucket: 'TU_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'TU_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'TU_FIREBASE_APP_ID'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const title = payload?.notification?.title || payload?.data?.title || 'MiZona';
  const options = {
    body: payload?.notification?.body || payload?.data?.body || 'Tienes un nuevo aviso.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: payload?.data?.url || '/#chat',
      page: payload?.data?.page || 'chat'
    }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/#chat';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
    for (const client of clientList) {
      if ('focus' in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  }));
});
