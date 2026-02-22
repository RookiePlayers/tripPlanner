import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { clearAuthCookies, getAuthTokens, setAuthCookies } from '../../../../config/auth/sessionCookies'
import { AuthSession } from '../../../../config/auth/types'
import { createAuthorizedServerClient } from '../../../../lib/api/authServerClient'

async function proxyRequest(req: NextRequest, path: string[]) {
    const { accessToken, refreshToken } = getAuthTokens(req)
    let refreshedSession: any = null
    let unauthorized = false

    const client = createAuthorizedServerClient({
        accessToken,
        refreshToken,
        onSessionUpdate: async (session: AuthSession) => {
            refreshedSession = session
        },
        onUnauthorized: async () => {
            unauthorized = true
        },
    })

    try {
        const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'
        const targetPath = `/${path.join('/')}${req.nextUrl.search}`
        const contentType = req.headers.get('content-type') || ''

        let data: unknown = undefined
        if (method !== 'get' && method !== 'delete') {
            if (contentType.includes('application/json')) {
                data = await req.json().catch(() => undefined)
            } else {
                data = await req.text().catch(() => undefined)
            }
        }

        const response = await client.request({
            url: targetPath,
            method,
            data,
            headers: contentType ? { 'Content-Type': contentType } : undefined,
        })

        const nextResponse = NextResponse.json(response.data, { status: response.status })

        if (refreshedSession) {
            setAuthCookies(nextResponse, refreshedSession)
        }

        return nextResponse
    } catch (error) {
        if (unauthorized) {
            const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            clearAuthCookies(response)
            return response
        }

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                { error: (error.response?.data as any)?.error || error.message },
                { status: error.response?.status ?? 500 }
            )
        }

        return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 })
    }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params
    return proxyRequest(req, path)
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params
    return proxyRequest(req, path)
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params
    return proxyRequest(req, path)
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params
    return proxyRequest(req, path)
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params
    return proxyRequest(req, path)
}
