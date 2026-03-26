import '@/@core/assets/main.css'
import 'reflect-metadata'
import '@mdi/font/css/materialdesignicons.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'vue3-toastify/dist/index.css'

import registerServices from './@core/di/registerServices'
import { registerPlugins } from './@core/plugins/registerPlugins'
import { createApp } from 'vue'

import PrimeVue from 'primevue/config'
import App from './App.vue'

import { initializeApp } from 'firebase/app'
import { getFirestore, setDoc, doc, onSnapshot } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const missingFirebase = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)

if (missingFirebase.length) {
    // eslint-disable-next-line no-console
    console.warn(
        '[Firebase] Variáveis ausentes:',
        missingFirebase.join(', '),
        '\nVerifique o arquivo .env e reinicie o servidor de desenvolvimento.',
    )
}

const firebaseApp = initializeApp(firebaseConfig)

import { toast } from 'vue3-toastify'

Notification.requestPermission()

export function showNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
                body,
                icon: '/pwa_icons/pwa-192x192.png',
            })
        })
    } else {
        toast.success(body, {
            autoClose: 10000,
            position: 'top-right',
        })
    }
}

const clientId = (() => {
    const saved = localStorage.getItem('cId')
    if (saved) return saved
    const id = Math.random().toString().replace('0.', '')
    localStorage.setItem('cId', id)
    return id
})()

const db = getFirestore(firebaseApp)
const docRef = doc(db, 'notification', 'notify')

let initialized = false
onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
        const data = snap.data()

        if (data.senderId === clientId) {
            initialized = true
            return
        }

        if (!initialized) {
            initialized = true
            return
        }

        showNotification('Nova notificação recebida', data.text)
    }
})

window.sendNotification = (text: string) => {
    setDoc(docRef, { text, senderId: clientId, createdAt: Date.now() })
}
const app = createApp(App)

registerPlugins(app)
registerServices()
app.use(PrimeVue)
app.mount('#app')
