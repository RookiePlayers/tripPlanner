import { NextRequest, NextResponse } from 'next/server'
import { getAuthTokens, toPublicSession } from '../../../../config/auth/sessionCookies'

export async function GET(req: NextRequest) {
    const { accessToken, sessionBase } = getAuthTokens(req)

    if (!sessionBase || !accessToken) {
        return NextResponse.json({ session: null }, { status: 401 })
    }

    return NextResponse.json({
        session: toPublicSession(sessionBase as any),
    })
}
