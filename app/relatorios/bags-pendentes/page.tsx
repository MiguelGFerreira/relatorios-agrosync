'use client';

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Bag, BagPendente } from "@/app/types";
import { Archive, Calendar, Clock, Hash, Info, MapPin, Truck, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

const BagDetailsModal = ({ bagId, onClose }: { bagId: number | null, onClose: () => void }) => {
    
    const { data, error, isLoading } = useSWR<Bag[]>(bagId ? `/api/bag?idbag=${bagId}` : null, fetcher)
    
    if (!bagId) return null;
    
    const bagData = data?.[0]
    console.log("Bag detalhes:", bagData);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Info size={20} className="text-green-700" />
                        Detalhes do Bag
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
                        <X size={22} className="cursor-pointer" />
                    </button>
                </div>

                <div className="p-6">
                    {isLoading && <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>}
                    {error && <div className="text-center text-red-600">Falha ao carregar os dados do bag.</div>}

                    {bagData && (
                        <>
                        <dl className="space-y-4">
                            <div className="flex justify-between items-center">
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Hash size={16} /> TAG</dt>
                                <dd className="text-lg font-semibold text-green-800 bg-green-100 px-3 py-1 rounded-md">{bagData.tag}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Archive size={16} /> Lote</dt>
                                <dd className="text-lg font-semibold text-green-800 bg-green-100 px-3 py-1 rounded-md">{bagData.numLote}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><MapPin size={16} /> Status</dt>
                                <dd className="text-lg font-semibold text-green-800 bg-green-100 px-3 py-1 rounded-md">{bagData.status}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Hash size={16} /> Os Vinculada</dt>
                                <dd className="text-lg font-semibold text-green-800 bg-green-100 px-3 py-1 rounded-md">{bagData.os || 'N/A'}</dd>
                            </div>
                        </dl>

                        <div className="mt-6 pt-4 border-t">
                            <Link
                                href={`/vida-do-bag?idbag=${bagData.idbag}`}
                                className="w-full text-center inline-block px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition-colors"
                            >
                                Ver Vida do Bag Completa
                            </Link>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const EmpilhadeiraColumn = ({ tag_emp, bags, onBagClick }: { tag_emp: string, bags: BagPendente[], onBagClick: (id: number) => void }) => {
    console.log(bags);
    return (
        <div className="flex-1 min-w-[320px] bg-gray-50 rounded-lg border flex flex-col">
            <div className="p-4 border-b bg-white rounded-t-lg sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-green-700" />
                        <h3 className="font-bold text-lg text-gray-800">{tag_emp}</h3>
                    </div>
                    <span className="text-base bg-orange-200 text-orange-800 font-semibold px-3 py-1 rounded-full">
                        {bags.length}
                    </span>
                </div>
            </div>

            <div className="p-2 space-y-2 overflow-y-auto">
                {bags.map(bag => (
                    <div
                        key={bag.tagBag + bag.horaReg}
                        className={`${bag.status === 'A' ? "bg-green-200" : "bg-yellow-200"} p-3 rounded-md shadow-sm border border-gray-200 cursor-pointer hover:opacity-80`}
                        onClick={() => onBagClick(bag.idBag)}
                    >
                        <p className="font-semibold text-gray-900">{bag.tagBag}</p>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{new Date(bag.horaReg.replace('Z', '')).toLocaleTimeString('pt-BR')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function BagsPendentesPage() {
    const [dia, setDia] = useState(getTodayDateString());
    const [selectedBagId, setSelectedBagId] = useState<number | null>(null);

    const { data, error, isLoading } = useSWR<BagPendente[]>(`/api/bags-pendentes?dia=${dia}`, fetcher);

    console.log("dados:", data);
    const bagsPorEmpilhadeira = useMemo(() => {
        if (!data) return {};
        return data.reduce((acc, bag) => {
            const emp = `${bag.tag_emp}: ${bag.usuarioEmp}`;
            if (!acc[emp]) acc[emp] = [];
            acc[emp].push(bag);
            return acc
        }, {} as Record<string, BagPendente[]>);
    }, [data])

    console.log(bagsPorEmpilhadeira);

    return (
        <>
            <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
                <div className="bg-white p-4 rounded-lg shadow-sm border flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700">Visão de Bags Pendentes</h2>
                            <p className="text-sm text-gray-500">Acompanhe os bags em trânsito ou armazenados na rua.</p>
                        </div>
                        <div className="w-full max-w-xs">
                            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Dia</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    id="date-filter"
                                    type="date"
                                    value={dia}
                                    onChange={(e) => setDia(e.target.value)}
                                    className="!pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-x-auto">
                    {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                    {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">Erro ao carregar os dados. Por favor, tente novamente.</div>}

                    {data && (
                        <div className="flex gap-4 h-full">
                            {Object.keys(bagsPorEmpilhadeira).length > 0 ? (
                                Object.entries(bagsPorEmpilhadeira).map(([tag_emp, bags]) => (
                                    <EmpilhadeiraColumn
                                        key={tag_emp}
                                        tag_emp={tag_emp}
                                        bags={bags}
                                        onBagClick={setSelectedBagId}
                                    />
                                ))
                            ) : (
                                <div className="bg-white flex-grow text-center flex items-center justify-center p-8 rounded-lg shadow border">
                                    <p>Nenhum bag pendente encontrado para o dia selecionado.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <BagDetailsModal
                bagId={selectedBagId}
                onClose={() => setSelectedBagId(null)}
            />
        </>
    )
}