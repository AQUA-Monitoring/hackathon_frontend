importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD99yL3eRyz5Jdc9D5WiPbfx--zCfjb1F4',
  authDomain: 'aqua-ec1ae.firebaseapp.com',
  projectId: 'aqua-ec1ae',
  storageBucket: 'aqua-ec1ae.firebasestorage.app',
  messagingSenderId: '599466260329',
  appId: '1:599466260329:web:a162de46fa5e7cbd4daff8',
  measurementId: 'G-R9BC79MNF3',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa_icons/pwa-192x192.png',
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
