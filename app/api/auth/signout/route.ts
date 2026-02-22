import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, getAuthTokens } from '../../../../config/auth/sessionCookies'
import { signOutSession } from '../../../../lib/api/authServerClient'

export async function POST(req: NextRequest) {
  const { accessToken, refreshToken } = getAuthTokens(req)

  try {
    if (refreshToken || accessToken) {
      await signOutSession(refreshToken, accessToken)
    }

    const response = NextResponse.json({ success: true })
    clearAuthCookies(response)
    return response
  } catch (error) {
    console.error('Signout error:', error)
    const response = NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
    clearAuthCookies(response)
    return response
  }
}
