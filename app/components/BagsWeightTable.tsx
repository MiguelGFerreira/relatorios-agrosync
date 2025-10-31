import { BagWeightRecord } from "@/app/types";
import LoadingSpinner from "./LoadingSpinner";

interface BagsWeightTableProps {
    data?: BagWeightRecord[];
    isLoading: boolean;
    error: Error | null;
}

const getStatusBagde = (status: string) => {
    let colorClasses = 'bg-gray-200 text-gray-800';
    if (status === 'A') colorClasses = 'bg-green-200 text-green-800';
    if (status === 'T') colorClasses = 'bg-yellow-200 text-yellow-800';
    if (status === 'S') colorClasses = 'bg-red-200 text-red-800';

    return (
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};

export default function BagsWeightTable({ data, isLoading, error }: BagsWeightTableProps) {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="text-center p-8 text-red-600">Falha ao carregar os dados.</div>;
    if (!data || data.length === 0) return <div className="text-center p-8 text-white rounded-md shadow">Nenhum registro encontrado com os parâmetros.</div>

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 grupotristao">
                    <thead className="bg-gray-100">
                        <tr>
                            <th>Lote</th>
                            <th>Tag</th>
                            <th>Entrada (kg)</th>
                            <th>Peso RKF(kg)</th>
                            <th>Emp.</th>
                            <th>OS</th>
                            <th>AP</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item, index) => (
                            <tr key={`${item.tagBag}-${index}`}>
                                <td>{item.nrLote}</td>
                                <td>{item.tagBag}</td>
                                <td>{item.qtdEntradaBag}</td>
                                <td>{item.qtdValidado}</td>
                                <td>{item.refGs}</td>
                                <td>{item.dataHoraAtualizacao}</td>
                                <td>{item.statusBag}</td>
                                <td>{item.siloDestino}</td>
                                <td>{getStatusBagde(item.statusBag)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}