import 'server-only'
import { FirebaseAuth } from "../../config/auth/firebase_auth";
import { IAuth } from "../../config/auth/iauth";

export const useAuthProvider = () => {
    const auth: IAuth = new FirebaseAuth();

    return auth;
}