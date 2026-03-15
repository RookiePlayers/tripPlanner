import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { AuthLoginResponse, AuthSession } from '../../config/auth/types'
import { SERVER_ROUTES } from './serverRoutes'
import { AuthLoginDto } from '../../types/auth.types'

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean }

type AuthorizedClientOptions = {
  accessToken?: string
  refreshToken?: string
  onSessionUpdate?: (session: AuthSession) => void | Promise<void>
  onUnauthorized?: () => void | Promise<void>
}

function getAuthServerBaseUrl(): string {
  const baseUrl = process.env.NEXT_SERVER_URL
  if (!baseUrl) {
    throw new Error('Missing NEXT_SERVER_URL environment variable')
  }
  return baseUrl
}

function asAuthSession(payload: any): AuthSession {
  const source = payload?.session ?? payload
  if (!source?.accessToken || !source?.refreshToken) {
    throw new Error('Invalid auth session payload from server')
  }

  return {
    userId: source.userId,
    email: source.email,
    providerSub: source.providerSub,
    provider: source.provider,
    ipAddress: source.ipAddress,
    userAgent: source.userAgent,
    accessToken: source.accessToken,
    refreshToken: source.refreshToken,
    authToken: source.authToken,
  }
}

export async function exchangeIdTokenForSession({idToken}: AuthLoginDto): Promise<AuthLoginResponse> {
  console.log(`${getAuthServerBaseUrl()}/${SERVER_ROUTES.authLogin}`)
  const response = await axios.post(`${getAuthServerBaseUrl()}/${SERVER_ROUTES.authLogin}`, { idToken })
  return {
    user: response.data?.user,
    session: asAuthSession(response.data),
  }
}

export async function exchangeOauthIdTokenForSession(auth: AuthLoginDto): Promise<AuthLoginResponse> {
  console.log(`${getAuthServerBaseUrl()}/${SERVER_ROUTES.oauthLogin}`)
  const response = await axios.post(`${getAuthServerBaseUrl()}/${SERVER_ROUTES.oauthLogin}`, auth)
  return {
    user: response.data?.user,
    session: asAuthSession(response.data),
  }
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const response = await axios.post(`${getAuthServerBaseUrl()}/${SERVER_ROUTES.authRefresh}`, { refreshToken })
  return asAuthSession(response.data)
}

export async function signOutSession(refreshToken?: string, accessToken?: string): Promise<void> {
  await axios.post(
    `${getAuthServerBaseUrl()}/${SERVER_ROUTES.authSignout}`,
    { refreshToken },
    accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
  )
}

export function createAuthorizedServerClient(options: AuthorizedClientOptions): AxiosInstance {
  let accessToken = options.accessToken
  let refreshToken = options.refreshToken

  const client = axios.create({
    baseURL: getAuthServerBaseUrl(),
    timeout: 20_000,
  })

  client.interceptors.request.use((config) => {
    if (accessToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetriableConfig | undefined
      const status = error.response?.status

      if (!originalRequest || originalRequest._retry || status !== 401 || !refreshToken) {
        throw error
      }

      originalRequest._retry = true

      try {
        const refreshed = await refreshSession(refreshToken)
        accessToken = refreshed.accessToken
        refreshToken = refreshed.refreshToken

        if (options.onSessionUpdate) {
          await options.onSessionUpdate(refreshed)
        }

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        return client(originalRequest)
      } catch (refreshError) {
        if (options.onUnauthorized) {
          await options.onUnauthorized()
        }
        throw refreshError
      }
    }
  )

  return client
}
