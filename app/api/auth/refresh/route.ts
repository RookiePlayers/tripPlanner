import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getAuthTokens, setAuthCookies, toPublicSession } from '../../../../config/auth/sessionCookies'
import { refreshSession } from '../../../../lib/api/authServerClient'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { refreshToken: refreshTokenFromCookie } = getAuthTokens(req)
  const refreshToken = refreshTokenFromCookie || body?.refreshToken

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No authenticated session to refresh' },
      { status: 401 }
    )
  }

  try {
    const session = await refreshSession(refreshToken)
    const response = NextResponse.json({ session: toPublicSession(session) })
    setAuthCookies(response, session)
    return response
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 401) : 401
    const message = axios.isAxiosError(error)
      ? (error.response?.data as any)?.error || 'No authenticated session to refresh'
      : 'No authenticated session to refresh'
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
