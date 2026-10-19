import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
})
export const auth = getAuth(app)

// Saved copy on the phone, so the app opens with data instantly. Falls back if the browser cannot store it.
const base = { experimentalAutoDetectLongPolling: true }
let firestore
try { firestore = initializeFirestore(app, { ...base, localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }) }
catch { firestore = initializeFirestore(app, base) }
export const db = firestore
