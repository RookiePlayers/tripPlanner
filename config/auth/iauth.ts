export interface IAuth {
    signInWithEmailAndPassword(email: string, password: string): Promise<string>;
    createUserWithEmailAndPassword(email: string, password: string): Promise<string>;
    signOut(): Promise<void>;
    refreshToken(): Promise<string>;
    getCurrentUser(): Promise<{ email: string } | null>;
    oAuthStateChangeListener: (callback: (user: { email: string } | null) => void) => void;
}