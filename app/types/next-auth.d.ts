import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    /**
     *  Objeto de sessao retornado por `useSession`
     */
    interface Session {
        user: {
            id: string;
            idgrupo: number;
        } & DefaultSession["user"]
    }

    /**
     *  Objeto de usuario retornado pelo provider `authorize`
     */
    interface User extends DefaultUser {
        idgrupo: number;
    }
}

declare module "next-auth/jwt" {
    /**
     *  Token JWT
     */
    interface JWT extends DefaultJWT {
        id: string;
        idgrupo: number;
    }
}