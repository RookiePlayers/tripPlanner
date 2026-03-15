import { AuthCredential, UserCredential } from "firebase/auth";

export interface IAuth {
    signInWithEmailAndPassword(email: string, password: string): Promise<SignInCredentials>;
    createUserWithEmailAndPassword(email: string, password: string): Promise<SignInCredentials>;
    signOut(): Promise<void>;
    refreshToken(): Promise<string>;
    getCurrentUser(): Promise<{ email: string } | null>;
    oAuthStateChangeListener: (callback: (user: { email: string } | null) => void) => void;
    signInWithCredentials?(credentials: AuthCredential): Promise<UserCredential>;
}

export type SignInCredentials = {
    idToken: string;
    credentials: AuthCredential;
}