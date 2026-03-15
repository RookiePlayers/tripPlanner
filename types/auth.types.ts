export enum AuthProvider {
  email = 'email',
  google = 'google',
  apple = 'apple',
  facebook = 'facebook',
}

export type AuthLoginDto = {
    provider: AuthProvider;
    idToken: string;
    authorizationCode?: string;
    nonce?: string;
    redirectUri?: string;
}
