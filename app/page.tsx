'use client';

import { ArrowRight, BarChart3, ClipboardX, Clock, Weight } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";

const dashboardCards = [
    {
        href: '/despejo-rkf',
        target: "_self",
        icon: Weight,
        title: 'Pesagem RKF',
        description: 'Inserir pesagem de RKF no sistema',
    },
    {
        href: '/relatorios/despejo-rkf',
        target: "_self",
        icon: BarChart3,
        title: 'Relatório de Despejos',
        description: 'Pesagens e despejos realizados para Realcafe',
    },
    {
        href: '/relatorios/bags-pendentes',
        target: "_self",
        icon: ClipboardX,
        title: 'Relatório de bags pendentes',
        description: 'Visualizar bags em trânsito ou armazenados na rua.',
    },
    {
        href: '/vida-do-bag',
        target: "_self",
        icon: Clock,
        title: 'Vida do Bag',
        description: 'Visualizar todos os eventos relacionados a um bag específico.',
    },
]

export default function Home() {
    const { data: session, status } = useSession();

    if (status !== 'authenticated') {
        redirect('/login');
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-gray-800">
                    Painel de Controle
                </h1>
                <div className="flex justify-between">
                    <p className="mt-2 text-lg text-gray-500">
                        Selecione uma das opções abaixo
                    </p>
                    <div className="p-4 rounded-md text-green-800">
                        Logado como: {session.user.name}
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="ml-4 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardCards.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="group block p-6 bg-white rounded-xl shadow-md hover:shadow-lg border border-transparent hover:border-green-500 transition-all duration-300"
                        target={card.target}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg text-green-600">
                                <card.icon size={28} />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800">{card.title}</h2>
                        </div>
                        <p className="mt-4 text-gray-600">{card.description}</p>
                        <div className="mt-6 flex items-center justify-end text-sm font-semibold text-green-600">
                            <span>Acessar</span>
                            <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
