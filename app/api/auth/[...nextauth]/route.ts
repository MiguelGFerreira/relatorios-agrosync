import { dbQuery } from "@/app/lib/db";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials"
import { JWT } from "next-auth/jwt"
import { sanitizeForSQL } from "@/app/utils/sanitizeSql";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Usuário", type: "text" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password) {
                    return null;
                }

                const sanitizedUsername = sanitizeForSQL(credentials.username);

                const query = `
                    SELECT id, usuario, trim(senha) senha, idgrupo
                    FROM Usuarios
                    WHERE status = 1 AND usuario = '${sanitizedUsername}'
                `;

                const users = await dbQuery(query);

                if (!users || users.length === 0) {
                    console.log("Usuário não encontrado:", credentials.username);
                    return null;
                }

                const user = users[0];
                console.log("usuario:", user);
                console.log("senha enviada:", credentials.password);
                console.log("comparacao:", credentials.password === user.senha)

                const passwordMatch = credentials.password === user.senha;

                if (!passwordMatch) {
                    console.log("Senha inválida para o usuário:", credentials.username);
                    return null;
                }

                return {
                    id: user.id,
                    name: user.usuario,
                    idgrupo: user.idgrupo
                };
            }
        })
    ],
    pages: {
        signIn: '/login', // pro nexauth saber onde esta a pagina de login
    },
    callbacks: {
        // chamado sempre que um JWT e criado ou atualizado
        async jwt({ token, user }) {
            if (user) {
                // no login, user e o objeto retornado de authorize
                token.id = user.id;
                token.idgrupo = user.idgrupo;
            }
            return token;
        },
        // chamado sempre que uma sessao e acessada
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.idgrupo = token.idgrupo as number;
            }
            return session
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST};