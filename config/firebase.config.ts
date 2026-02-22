import 'server-only'
import { initializeApp } from 'firebase/app'
import * as auth from 'firebase/auth'

const firebaseConfigFromBase64 = process.env.FIREBASE_CONFIG_BASE64

if (!firebaseConfigFromBase64) {
  throw new Error(
    'Missing Firebase config. Set FIREBASE_CONFIG_BASE64 to a base64-encoded JSON config.'
  )
}

let firebaseConfig: Record<string, unknown>
try {
  const firebaseConfigJson = Buffer.from(firebaseConfigFromBase64, 'base64').toString('utf-8')
  firebaseConfig = JSON.parse(firebaseConfigJson)
} catch (error) {
  throw new Error('Invalid Firebase config. Ensure the base64 value decodes to valid JSON.')
}

const app = initializeApp(firebaseConfig)
const authInstance = auth.getAuth(app)

export { app, authInstance, auth }
