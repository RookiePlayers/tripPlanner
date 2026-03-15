import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setAuthCookies, toPublicSession } from '../../../../config/auth/sessionCookies'
import { useAuthProvider } from '../../../../lib/hooks/useAuthProvider'
import { exchangeIdTokenForSession } from '../../../../lib/api/authServerClient'
import { AuthProvider } from '../../../../types/auth.types'

export async function POST(req: NextRequest) {
  const { auth } = useAuthProvider()
  const { email, password } = await req.json()
  try {
    const authCredentials = await auth.createUserWithEmailAndPassword(email, password)
    const { user, session } = await exchangeIdTokenForSession({
      idToken: authCredentials.idToken,
      provider: AuthProvider.email,
    })
    const response = NextResponse.json({ user, session: toPublicSession(session) })
    setAuthCookies(response, session)
    return response
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 401) : 401
    const message = axios.isAxiosError(error)
      ? (error.response?.data as any)?.error || 'Signup failed'
      : 'Signup failed'
    console.error("Signup error:", error);
    return NextResponse.json({ error: message }, { status });
  }

}
