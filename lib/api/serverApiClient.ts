import axios, { AxiosError, AxiosRequestConfig } from 'axios'

export class ServerApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ServerApiError'
    this.status = status
    this.data = data
  }
}

type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

const serverApi = axios.create({
  baseURL: `${process.env.NEXT_SERVER_URL}/`,
  withCredentials: true,
  timeout: 20_000,
})

serverApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && window.location.pathname !== '/auth') {
      const next = `${window.location.pathname}${window.location.search}`
      window.location.replace(`/auth?next=${encodeURIComponent(next)}`)
    }
    return Promise.reject(error)
  }
)

async function request<TResponse>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  data?: unknown,
  config?: RequestConfig
): Promise<TResponse> {
  try {
    const response = await serverApi.request<TResponse>({
      url: normalizePath(path),
      method,
      data,
      ...config,
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const responseData = error.response?.data
      const message =
        (responseData as any)?.error ||
        (responseData as any)?.message ||
        error.message ||
        'Server request failed'

      throw new ServerApiError(message, status, responseData)
    }

    throw new ServerApiError('Unknown server request error', 500, null)
  }
}

export const backendApi = {
  get: <TResponse>(path: string, config?: RequestConfig) =>
    request<TResponse>('get', path, undefined, config),

  post: <TResponse, TBody = unknown>(path: string, body?: TBody, config?: RequestConfig) =>
    request<TResponse>('post', path, body, config),

  put: <TResponse, TBody = unknown>(path: string, body?: TBody, config?: RequestConfig) =>
    request<TResponse>('put', path, body, config),

  patch: <TResponse, TBody = unknown>(path: string, body?: TBody, config?: RequestConfig) =>
    request<TResponse>('patch', path, body, config),

  delete: <TResponse>(path: string, config?: RequestConfig) =>
    request<TResponse>('delete', path, undefined, config),
}
