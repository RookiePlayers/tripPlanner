import { NextRequest, NextResponse } from 'next/server'
import { getAuthTokens, toPublicSession } from '../../../../config/auth/sessionCookies'

function decodeJwt(token: string | undefined) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { accessToken, refreshToken, authToken, sessionBase } = getAuthTokens(req)

  if (!sessionBase || !accessToken) {
    return NextResponse.json({ error: 'No active session' }, { status: 401 })
  }

  try {
    const payload = decodeJwt(accessToken)

    return NextResponse.json({
      ...toPublicSession(sessionBase as any),
      uid: payload?.user_id || payload?.sub || null,
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      authTime: payload.auth_time ? new Date(payload.auth_time * 1000).toISOString() : null,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      authToken: authToken || null,
    })
  } catch (error) {
    console.error('Dev info error:', error)
    return NextResponse.json({ error: 'Failed to load session info' }, { status: 500 })
  }
}
