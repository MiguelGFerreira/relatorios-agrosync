import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // se o usaario esta logado e tenta acessar a pagina de login, vai pra tela inicial
        if (token && pathname === '/login') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // se a funcao 'authorized' abaixo retornar true, a requisicao e permitida
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const { pathname } = req.nextUrl;

                // logica para protecao das rotas

                // se o usuario nao estiver logado (token null)
                if (!token) {
                    // permite acesso somente ao login ou aos relatorios
                    if (pathname === '/login' || pathname.startsWith('/relatorios') || pathname.startsWith('/api/relatorios') || pathname === '/') {
                        return true;
                    }
                    // para todas as outras paginas, nega o acesso
                    return false;
                }

                // se o usuario estiver logado, vai permitir acesso para qualquer pagina
                return true;
            },
        },
        pages: {
            signIn: '/login', // a pagina para onde redirecionar se 'authorized' retornar false.
        }
    }
);

// configuracao do matcher
export const config = {
    matcher: [
        // especifica quais rotas o middleware deve rodar
        // ta tudo protegido, menos assets estaticos e a propria api de autenticacao
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ]
}