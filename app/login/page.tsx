'use client';

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { data: session, status } = useSession();

    // se ja estiver lgoado vai pra pagina inicial
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await signIn('credentials', {
            redirect: false, // vou fazer o redirect manualmente
            username: username,
            password: password,
        });

        if (result?.error) {
            setError("Usuário ou senha inválidos. Tente novamente.");
            setIsLoading(false);
        } else if (result?.ok) {
            // passou. o middleware pega a nova sessao e o useEffect vai redirecionar
            // fazendo push so pra garantir
            router.push('/');
        }
    };

    if (status === 'loading') {
        return <LoadingSpinner />
    }

    // so renderiza a pagina de login se nao estiver autenticado
    if (status === 'unauthenticated') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm">
                    <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">AgroSync Login</h2>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="botao flex gap-2 place-self-end">
                        {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
                        {isLoading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
            </div>
        );
    }

    // fallback para caso ja estiver logado (antes do redirect do useEffect)
    return null;
}