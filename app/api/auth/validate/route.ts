import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, getAuthTokens, setAuthCookies, toPublicSession } from '../../../../config/auth/sessionCookies'
import { refreshSession } from '../../../../lib/api/authServerClient'

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
    return payload.exp ? payload.exp * 1000 <= Date.now() : false
  } catch {
    return true
  }
}

export async function POST(req: NextRequest) {
  const { accessToken, refreshToken, sessionBase } = getAuthTokens(req)

  if (!refreshToken && !accessToken) {
    return NextResponse.json({ valid: false, reason: 'no_session' }, { status: 401 })
  }

  try {
    if (accessToken && !isJwtExpired(accessToken)) {
      return NextResponse.json({ valid: true, session: toPublicSession(sessionBase as any) })
    }

    if (!refreshToken) {
      const response = NextResponse.json({ valid: false, reason: 'no_refresh_token' }, { status: 401 })
      clearAuthCookies(response)
      return response
    }

    const refreshed = await refreshSession(refreshToken)
    const response = NextResponse.json({ valid: true, session: toPublicSession(refreshed) })
    setAuthCookies(response, refreshed)
    return response
  } catch (error: any) {
    console.error('Token validation error:', error)
    const response = NextResponse.json({ valid: false, reason: 'invalid' }, { status: 401 })
    clearAuthCookies(response)
    return response
  }
}
