'use client';

import LoadingSpinner from "@/app/components/LoadingSpinner";
import { DespejoRkfReportRecord } from "@/app/types";
import { Loader2, Scale, Search, Warehouse } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// mudei o fetcher para qunado a api retornar algum erro, jogar um erro pro swr
const fetcher = async (url: string) => {
    const res = await fetch(url)

    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.message || "Erro ao buscar dados");
    }

    return res.json();
};

const SummaryCards = ({ data }: { data: DespejoRkfReportRecord[] }) => {
    const { totalValidado, totalPorSilo } = (() => {
        const totalValidado = data.reduce((sum, item) => sum + item.qtdValidado, 0);

        const totalPorSilo = data.reduce((acc, item) => {
            const silo = item.siloDestino || '';
            if (!silo) return acc;

            acc[silo] = ((acc[silo] || 0) + item.qtdValidado);
            return acc;
        }, {} as Record<string, number>);

        return { totalValidado, totalPorSilo };
    })();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-600 text-white p-5 rounded-lg shadow">
                <div className="flex items-center gap-4">
                    <Scale size={32} />
                    <div>
                        <p className="text-sm font-light">QTD. TOTAL VALIDADO</p>
                        <p className="text-2xl font-bold">{totalValidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</p>
                    </div>
                </div>
            </div>
            {Object.entries(totalPorSilo).map(([silo, total]) => (
                <div key={silo} className="bg-white p-5 rounded-lg shadow border">
                    <div className="flex items-center gap-4">
                        <Warehouse size={32} className="text-green-700" />
                        <div>
                            <p className="text-sm text-gray-500">TOTAL PARA O SILO {silo}</p>
                            <p className="text-2xl font-bold text-gray-800">{total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportTable = ({ data }: { data: DespejoRkfReportRecord[] }) => {
    if (data.length === 0) {
        return <div className="bg-white text-center p-8 rounded-lg shadow border">Nenhum registro encontrado para os filtros selecionados.</div>
    }

    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
                <table className="grupotristao">
                    <thead>
                        <tr>
                            <th>Data/Hora Despejo</th>
                            <th>Lote</th>
                            <th>Tag Bag</th>
                            <th>Qtd. Validado (kg)</th>
                            <th>Ref. OS</th>
                            <th>Silo Destino</th>
                            <th>Data/Hora Inventario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={`${item.tagBag}-${index}`}>
                                <td>{new Date(item.despejo.replace('Z', '')).toLocaleString('pt-BR')}</td>
                                <td>{item.nrLote}</td>
                                <td>{item.tagBag}</td>
                                <td>{item.qtdValidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td>{item.refGs}</td>
                                <td>{item.siloDestino}</td>
                                <td>{new Date(item.pesagem.replace('Z', '')).toLocaleString('pt-BR')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function RelatorioDespejoRkfPage() {
    const [filters, setFilters] = useState({ os: '', dataInicio: '', dataFim: '' });
    const [data, setData] = useState<DespejoRkfReportRecord[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearch = async () => {
        setIsLoading(true);

        if (!filters.os && !filters.dataInicio && !filters.dataFim) {
            toast.warning('Utilize os filtros para buscar os dados.');
            return;
        }

        const searchParams = ['?'];
        setError(null);
        setData(null);

        if (filters.os) searchParams.push(`os=${filters.os}`);
        if (filters.dataInicio) searchParams.push(`dataInicio=${filters.dataInicio}`);
        if (filters.dataFim) searchParams.push(`dataFim=${filters.dataFim}`);

        try {
            const apiUrl = `/api/relatorios/despejo-rkf${searchParams.join('&')}`;
            const result = await fetcher(apiUrl);
            setData(result);
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-700">Relatório de Despejo RKF</h2>
                <p className="text-sm text-gray-500">Visualize as pesagens validadas e os totais por silo.</p>
            </div>

            {/* Friltos */}
            <div className="bg-white p-4 rounded-lg shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OS / Referência</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input name="os" value={filters.os} onChange={handleFilterChange} className="!pl-10" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                    <input type="date" name="dataInicio" value={filters.dataInicio} onChange={handleFilterChange} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <input type="date" name="dataFim" value={filters.dataFim} onChange={handleFilterChange} />
                </div>
                <div>
                    <button
                        onClick={handleSearch}
                        className="botao"
                        disabled={isLoading || (!filters.dataInicio && !filters.dataFim && !filters.os)}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Buscar"}
                    </button>
                </div>
            </div>

            {/* Principal */}
            {isLoading && <LoadingSpinner />}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">Erro ao carregar os dados. Por favor, tente novamente.</div>}

            {data && (
                <div className="space-y-6 animate-fade-in">
                    <SummaryCards data={data} />
                    <ReportTable data={data} />
                </div>
            )}
        </div>
    );
};