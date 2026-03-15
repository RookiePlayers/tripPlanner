import { IAuth, SignInCredentials } from "./iauth";

export class GoogleAuth implements IAuth {
  async signIn(): Promise<SignInCredentials> {
    throw new Error("Google sign-in must be initiated from the client.")
  }

  async signInWithEmailAndPassword(_email: string, _password: string): Promise<SignInCredentials> {
    return this.signIn()
  }

  async createUserWithEmailAndPassword(_email: string, _password: string): Promise<SignInCredentials> {
    return this.signIn()
  }

  async signOut(): Promise<void> {}

  async refreshToken(): Promise<string> {
    throw new Error("Google token refresh is not handled by this provider.")
  }

  async getCurrentUser(): Promise<{ email: string } | null> {
    return null
  }

  oAuthStateChangeListener(callback: (user: { email: string } | null) => void): void {
    callback(null)
  }
}
