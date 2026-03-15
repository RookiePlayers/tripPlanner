export type OAuthProvider =
    | 'firebase'
    | 'google'
    | 'apple'
    | 'github'
    | 'email'
    | string

export type AuthSession = {
    userId: string;
    authUid?: string;
    email: string;
    emailVerified?: boolean;
    role?: string;
    providerSub?: string;
    provider?: OAuthProvider;
    ipAddress?: string;
    userAgent?: string;
    accessToken: string;
    refreshToken: string;
    authToken?: string;
}

export type AuthUser = {
    id: string
    dateCreated?: number
    lastUpdated?: number
    version?: number
    collectionRef?: string
    isActive?: boolean
    email: string
}

export type AuthLoginResponse = {
    user: AuthUser
    session: AuthSession
}
