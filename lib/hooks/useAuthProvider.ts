import 'server-only'
import { FirebaseAuth } from "../../config/auth/firebase_auth";
import { IAuth } from "../../config/auth/iauth";
import { GoogleAuth } from '../../config/auth/google_auth';

export const useAuthProvider = () => {
    const auth: IAuth = new FirebaseAuth();
    const googleAuth = new GoogleAuth();

    return {
        auth,
        googleAuth,
    };
}