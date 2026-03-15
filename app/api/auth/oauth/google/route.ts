import { NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { exchangeOauthIdTokenForSession } from "../../../../../lib/api/authServerClient"
import { setAuthCookies, toPublicSession } from "../../../../../config/auth/sessionCookies"
import { AuthProvider, AuthLoginDto } from "../../../../../types/auth.types"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const idToken = body?.idToken

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 })
  }

  try {
    const oauthDto: AuthLoginDto = {
      provider: AuthProvider.google,
      idToken,
    }
    const { user, session } = await exchangeOauthIdTokenForSession(oauthDto)
    const response = NextResponse.json({ user, session: toPublicSession(session) })
    setAuthCookies(response, session)
    return response
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 401) : 401
    const message = axios.isAxiosError(error)
      ? (error.response?.data as any)?.error || "Failed to authenticate with Google"
      : "Failed to authenticate with Google"
    console.error("Google OAuth error:", error)
    return NextResponse.json({ error: message }, { status })
  }
}
