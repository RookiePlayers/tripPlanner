import 'server-only'
import { auth, authInstance } from "../firebase.config";
import { IAuth } from "./iauth";

export class FirebaseAuth implements IAuth {
    async createUserWithEmailAndPassword(email: string, password: string): Promise<string> {
        try {
            const { user } = await auth.createUserWithEmailAndPassword(authInstance, email, password);
            if (!user) {
                throw new Error("No user returned from Firebase");
            }
            return await user.getIdToken();
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    }
    async signInWithEmailAndPassword(email: string, password: string): Promise<string> {
        try {
            const { user } = await auth.signInWithEmailAndPassword(authInstance, email, password);
            if (!user) {
                throw new Error("No user returned from Firebase");
            }
            return await user.getIdToken();
        } catch (error) {
            console.error("Error signing in:", error);
            throw error;
        }
    }
    async signOut(): Promise<void> {
        try {
            await auth.signOut(authInstance);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    }
    async refreshToken(): Promise<string> {
        const user = authInstance.currentUser;
        if (!user) {
            throw new Error("No authenticated user to refresh token for");
        }
        return await user.getIdToken(true);
    }
    async getCurrentUser(): Promise<{ email: string; } | null> {
        try {
            const user = authInstance.currentUser;
            if (!user) {
                return null;
            }
            return { email: user.email || "" };
        } catch (error) {
            console.error("Error getting current user:", error);
            throw error;
        }
    }
    oAuthStateChangeListener(callback: (user: { email: string; } | null) => void): void {
        auth.onAuthStateChanged(authInstance, (user) => {
            if (user) {
                callback({ email: user.email || "" });
            } else {
                callback(null);
            }
        });
    }
}