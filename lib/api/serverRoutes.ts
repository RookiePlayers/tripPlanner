export const SERVER_ROUTES = {
    authLogin: 'auth/login',
    oauthLogin: 'auth/oauth/login',
    authRefresh: 'auth/refresh',
    authSignout: 'auth/signout',
} as const

export const SERVER_ROUTE_LIST = Object.values(SERVER_ROUTES) as readonly string[]

export type ServerRoute = (typeof SERVER_ROUTES)[keyof typeof SERVER_ROUTES]
