import { NextRequest, NextResponse } from 'next/server'
import { AuthSession } from './types'

const ACCESS_TOKEN_COOKIE = 'tp_access_token'
const REFRESH_TOKEN_COOKIE = 'tp_refresh_token'
const SESSION_COOKIE = 'tp_session'

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function encodeSession(session: AuthSession): string {
  const sessionWithoutTokens = {
    userId: session.userId,
    email: session.email,
    providerSub: session.providerSub,
    provider: session.provider,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    authToken: session.authToken,
  }
  return encodeURIComponent(JSON.stringify(sessionWithoutTokens))
}

function decodeSession(raw: string | undefined): Omit<AuthSession, 'accessToken' | 'refreshToken'> | null {
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}

export function setAuthCookies(res: NextResponse, session: AuthSession) {
  res.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: session.accessToken,
    maxAge: MAX_AGE_SECONDS,
    ...baseCookieOptions,
  })

  res.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: session.refreshToken,
    maxAge: MAX_AGE_SECONDS,
    ...baseCookieOptions,
  })

  res.cookies.set({
    name: SESSION_COOKIE,
    value: encodeSession(session),
    maxAge: MAX_AGE_SECONDS,
    ...baseCookieOptions,
  })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set({ name: ACCESS_TOKEN_COOKIE, value: '', maxAge: 0, ...baseCookieOptions })
  res.cookies.set({ name: REFRESH_TOKEN_COOKIE, value: '', maxAge: 0, ...baseCookieOptions })
  res.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, ...baseCookieOptions })
}

export function getAuthTokens(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const sessionBase = decodeSession(req.cookies.get(SESSION_COOKIE)?.value)
  const authToken = sessionBase?.authToken

  return {
    accessToken,
    refreshToken,
    authToken,
    sessionBase,
  }
}

export function toPublicSession(session: Partial<AuthSession> | null) {
  if (!session) return null
  return {
    userId: session.userId ?? null,
    email: session.email ?? null,
    role: session.role ?? null,
    emailVerified: session.emailVerified ?? null,
    providerSub: session.providerSub ?? null,
    authUid: session.authUid ?? null,
    provider: session.provider ?? null,
    ipAddress: session.ipAddress ?? null,
    userAgent: session.userAgent ?? null,
  }
}
