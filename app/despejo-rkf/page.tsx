'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { bagParaDespejo } from "../types";
import { toast } from "sonner";
import { CheckCircle, ChevronDown, CornerDownLeft, Search } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const LoteAccordion = ({ lote, bags, selectedBag, onSelectBag }: { lote: string, bags: bagParaDespejo[], selectedBag: bagParaDespejo | null, onSelectBag: (bag: bagParaDespejo) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
            >
                <span className="font-bold text-lg text-gray-800">Lote: {lote}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm bg-green-200 text-green-800 font-semibold px-2 py-1 rounded-full">{bags.length} Bags</span>
                    <ChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-100' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-white">
                    {bags.map(bag => (
                        <button
                            key={bag.idBag}
                            onClick={() => onSelectBag(bag)}
                            className={`p-3 border rounded-md text-left transition-all duration-200 ${selectedBag?.idBag === bag.idBag ? 'bg-green-100 border-green-500 ring-2 ring-green-500' : 'bg-white hover:border-green-400'}`}
                        >
                            <p className="font-semibold text-gray-800">{bag.tag}</p>
                            <p className="text-xs text-gray-500">Local: {bag.localizacao}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function DespejoRkfPage() {
    const lancamentoRef = useRef<HTMLDivElement>(null);

    const [osIdentifier, setOsIdentifier] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [bags, setBags] = useState<bagParaDespejo[]>([]);
    const [selectedBag, setSelectedBag] = useState<bagParaDespejo | null>(null);
    const [peso, setPeso] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedBag && lancamentoRef.current) {
            lancamentoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedBag]);

    const handleSearch = async () => {
        if (!osIdentifier) {
            toast.warning('Por favor, informe o código da OS para buscar.');
            return;
        }
        setIsSearching(true);
        setSelectedBag(null); // so pra garantir que nao tem bag selecionado - resetar
        setBags([]);

        try {
            const response = await fetch(`/api/bags-por-os?os=${osIdentifier}`);
            if (!response.ok) {
                throw new Error('Falha ao buscar os dados.');
            }
            const data: bagParaDespejo[] = await response.json();
            setBags(data);
            if (data.length === 0) {
                toast.info('Nenhum bag encontrado para esta OS.');
            }
        }
        catch (error) {
            toast.error('Erro na busca:', { description: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        if (!selectedBag || !peso || parseFloat(peso) <= 0) {
            toast.warning('Selecione um bag e informe um peso válido.');
            return;
        }
        setIsSaving(true);

        try {
            const response = await fetch('/api/despejo-rkf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bag: selectedBag, pesoInput: parseFloat(peso) }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message);
            }
            toast.success('Lançamento realizado com sucesso!', { description: result.message });

            // remove o bag salvo da lista e reseta o form
            setBags(prevBags => prevBags.filter(b => b.idBag !== selectedBag.idBag));
            setSelectedBag(null);
            setPeso('');
        }
        catch (error) {
            toast.error('Erro ao salvar:', { description: error instanceof Error ? error.message : 'Erro desconhecido' });
        } finally {
            setIsSaving(false);
        }
    };

    const resetSearch = () => {
        setOsIdentifier('');
        setBags([]);
        setSelectedBag(null);
    };

    const groupedBags = useMemo(() => {
        return bags.reduce((acc, bag) => {
            const lote = bag.numLote;
            if (!acc[lote]) {
                acc[lote] = [];
            }
            acc[lote].push(bag);
            return acc;
        }, {} as Record<string, bagParaDespejo[]>);
    }, [bags])

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-700">
                    <p className="text-sm text-gray-500">Busque pela OS, selecione o bag e insira o peso validado.</p>
                </h2>
            </div>

            {/* BUSCA */}
            {Object.keys(groupedBags).length === 0 && !isSearching && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <label htmlFor="os-search" className="block text-md font-medium text-gray-800 mb-2">Buscar por OS</label>
                    <div className="flex gap-2">
                        <input
                            id="os-search"
                            type="text"
                            value={osIdentifier}
                            onChange={(e) => setOsIdentifier(e.target.value)}
                            placeholder="Digite a OS ou o AP"
                            className="flex-grow p-3 border-gray-300 rounded-md shadow-sm text-lg"
                        />
                        <button onClick={handleSearch} disabled={isSearching} className="botao !flex !py-3">
                            <Search size={20} />
                            {isSearching ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>
            )}

            {isSearching && <div className="text-center p-8"><LoadingSpinner /></div>}

            {/* SELECIONAR BAGS */}
            {Object.keys(groupedBags).length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Selecione o Bag para Lançamento</h3>
                        {/* <button onClick={resetSearch} className="text-sm text-green-600 hover:underline flex items-center gap-1"> */}
                        <button onClick={resetSearch} className="botao !flex !py-3 gap-2">
                            <CornerDownLeft size={16} /> Nova Busca
                        </button>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(groupedBags).map(([lote, bagsDoLote]) => (
                            <LoteAccordion
                                key={lote}
                                lote={lote}
                                bags={bagsDoLote}
                                selectedBag={selectedBag}
                                onSelectBag={setSelectedBag}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Adicionar peso */}
            {selectedBag && (
                <div ref={lancamentoRef} className="bg-white p-6 rounded-lg shadow-sm border animate-fade-in">
                    <h3 className="text-lg font-semibold mb-3">
                        Lançar Peso para o Bag: <span className="text-green-700 font-bold">{selectedBag.tag}</span>
                    </h3>
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label htmlFor="peso-input" className="block text-sm font-medium text-gray-700">Peso Validado (kg)</label>
                            <input
                                id="peso-input"
                                type="text"
                                inputMode="decimal"
                                value={peso}
                                onChange={(e) => {
                                    //aceita virgula e ponto, mas vai salvar com ponto
                                    const valor = e.target.value.replace(',', '.');
                                    if (/^\d*\.?\d*$/.test(valor)) {
                                        setPeso(valor);
                                    }
                                }}
                                placeholder="Ex: 1490.50"
                                className="mt-1 w-full p-3 border-gray-300 rounded-md shadow-sm text-lg"
                            />
                        </div>
                        <button onClick={handleSave} disabled={isSaving} className="botao !flex !py-3 gap-2">
                            <CheckCircle size={20} />
                            {isSaving ? 'Salvando...' : 'Salvar Peso'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}