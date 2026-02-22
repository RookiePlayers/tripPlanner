import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setAuthCookies, toPublicSession } from '../../../../config/auth/sessionCookies'
import { useAuthProvider } from '../../../../lib/hooks/useAuthProvider'
import { exchangeIdTokenForSession } from '../../../../lib/api/authServerClient'

function mapFirebaseAuthError(error: unknown): string {
  const code = (error as any)?.code

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password'
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please try again later.'
  }

  return 'Failed to authenticate with server'
}

export async function POST(req: NextRequest) {
  const auth = useAuthProvider()
  const { idToken: incomingIdToken, email, password } = await req.json()

  try {
    let idToken = incomingIdToken

    if (!idToken && email && password) {
      idToken = await auth.signInWithEmailAndPassword(email, password)
    }

    if (!idToken) {
      return NextResponse.json({ error: 'idToken or email/password is required' }, { status: 400 })
    }

    const { user, session } = await exchangeIdTokenForSession(idToken)
    const response = NextResponse.json({ user, session: toPublicSession(session) })
    setAuthCookies(response, session)
    return response
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 401) : 401
    const message = axios.isAxiosError(error)
      ? (error.response?.data as any)?.error || 'Failed to authenticate with server'
      : mapFirebaseAuthError(error)
    console.error("Login error:", error);
    return NextResponse.json({ error: message }, { status });
  }

}
