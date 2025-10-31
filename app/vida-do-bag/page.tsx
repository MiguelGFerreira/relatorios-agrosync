"use client";

import { AlertCircle, Anchor, Archive, ArrowLeft, ArrowRight, CheckCircle, Hash, Loader2, MapPin, Rss, Scale, Truck, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import LoadingSpinner from "../components/LoadingSpinner";
import useDebounce from "../utils/useDebounce";
import { toast } from "sonner";

interface BagSnapshot {
    idbag: number;
    tag: string;
    numLote: string;
    status: string;
    pesoEntrada: number;
    diaEntrada: string;
    localizacaoAla: string | null;
}
interface BagSaidaInfo {
    dataSaida: string;
    pesoSaida: number;
}
interface BagTimelineEvent {
    timestamp: string;
    tipo: 'ENTRADA' | 'MOVIMENTO' | 'LOG EMPILHADEIRA' | 'SAIDA';
    titulo: string;
    descricao: string;
    local: string | null;
}
interface VidaDoBagResponse {
    snapshot: BagSnapshot;
    saida: BagSaidaInfo | null;
    timeline: BagTimelineEvent[];
}
interface TipoLocalizacao {
    id: number;
    numtag: string;
    auxiliar: string;
}
interface BlocoAla {
    bloco: string;
    altura_atual: number;
    descricaoCombo: string;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);

    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        error.message = await res.json();
        error.cause = res.status
        throw error
    }

    return res.json();
}

const LocationUpdateModal = ({ bagId, onClose, onSave }: { bagId: number | null, onClose: () => void, onSave: () => void }) => {
    const [tipo, setTipo] = useState('');
    const [ala, setAla] = useState('');
    const [bloco, setBloco] = useState('');

    const [isAlaValid, setIsAlaValid] = useState<boolean | null>(null);
    const [validationMessage, setValidationMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingAla, setIsCheckingAla] = useState(false);

    const { data: tipos, error: errorTipos } = useSWR<TipoLocalizacao[]>('/api/localizacao/tipos', fetcher);

    // so busca os blocos se a ala for valida
    const { data: blocos, error: errorBlocos, isLoading: isLoadingBlocos } = useSWR<BlocoAla[]>(
        isAlaValid ? `/api/localizacao/blocos?tipo=${tipo}&ala=${ala}` : null,
        fetcher
    );

    // resetar o formulario quando o modal abrir ou fechar
    useEffect(() => {
        if (bagId) {
            setTipo('');
            setAla('');
            setBloco('');
            setIsAlaValid(null);
            setValidationMessage('');
        }
    }, [bagId]);

    const handleValidateAla = async () => {
        if (!ala) return;

        setIsCheckingAla(true);
        setValidationMessage('');
        setIsAlaValid(null);

        try {
            const res = await fetch(`/api/localizacao/valida-ala?ala=${ala}`);
            const data = await res.json();
            setIsAlaValid(data.isValid);
            if (!data.isValid) {
                setValidationMessage('Ala não encontrada. Verifique o valor digitado.');
            }
        }
        catch (err) {
            setValidationMessage('Erro ao validar a ala. Tente novamente.');
        } finally {
            setIsCheckingAla(false);
        }
    }

    const handleSave = async () => {
        if (!isAlaValid && tipo.toLowerCase() === 'ala') {
            toast.error('Ala inválida. Corrija antes de salvar.');
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch('/api/localizacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idbag: bagId, tipo, ala, bloco })
            })
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            toast.success(result.message);
            onSave();
        }
        catch (err) {
            toast.error('Erro ao salvar.')
        } finally {
            setIsSaving(false);
        }
    }

    if (!bagId) return null;
    const showAlaInput = tipo.toLowerCase() === 'ala';

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Atualizar Localização</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 cursor-pointer"><X size={22} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select
                            value={tipo}
                            onChange={(e) => {
                                setTipo(e.target.value)
                                setAla('');
                                setBloco('');
                                setIsAlaValid(null);
                            }}
                        >
                            <option value="">Selecione um tipo...</option>
                            {tipos && tipos.map((t) => (
                                <option key={t.id} value={t.numtag}>{t.auxiliar}</option>
                            ))}
                        </select>
                        {errorTipos && <p className="text-xs text-red-600 mt-1">Erro ao carregar tipos.</p>}
                    </div>

                    {showAlaInput && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ala</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="text"
                                    value={ala}
                                    onChange={(e) => {
                                        setAla(e.target.value)
                                        setIsAlaValid(null);
                                        setBloco('');
                                    }}
                                    placeholder="Digite a ala"
                                />
                                <button onClick={handleValidateAla} disabled={isCheckingAla || !ala} className="botao">
                                    {isCheckingAla ? <Loader2 size={16} className="animate-spin" /> : 'Validar'}
                                </button>
                                {isAlaValid === true && <CheckCircle size={20} className="text-green-600" />}
                                {isAlaValid === false && <AlertCircle size={20} className="text-red-600" />}
                            </div>
                            {isAlaValid === false && <p className="text-xs text-red-600 mt-1">{validationMessage}</p>}
                        </div>
                    )}

                    {isAlaValid && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bloco</label>
                            <select
                                value={bloco}
                                onChange={(e) => setBloco(e.target.value)}
                                disabled={isLoadingBlocos}
                            >
                                <option value="">{isLoadingBlocos ? 'Carregando...' : 'Selecione um bloco...'}</option>
                                {blocos && blocos.map(b => (
                                    <option key={b.bloco} value={b.bloco}>{b.descricaoCombo}</option>
                                ))}
                            </select>
                            {errorBlocos && <p className="text-xs text-red-600 mt-1">Erro ao carregar blocos.</p>}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-4 gap-2 bg-gray-50 border-t rounded-b-xl">
                    <button onClick={onClose} className="botao">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (showAlaInput && !isAlaValid)}
                        className="botao"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const KpiCard = ({ title, value, icon, color = 'text-green-700', onClick }: { title: string, value: string | number | null, icon: React.ReactNode, color?: string, onClick?: () => void }) => {
    const content = (
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-gray-100 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <p className="text-xl font-bold text-gray-800">{value || '---'}</p>
            </div>
        </div>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="bg-white p-4 rounded-lg shadow-sm border text-left w-full transition-all cursor-pointer hover:shadow-md hover:border-green-500 hover:bg-green-50/50"
            >
                {content}
            </button>
        )
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">{content}</div>
    )
}

const TimelineItem = ({ item, isLast }: { item: BagTimelineEvent, isLast: boolean }) => {
    const getIcon = () => {
        switch (item.tipo) {
            case 'ENTRADA': return <ArrowRight size={16} className="text-blue-600" />;
            case 'MOVIMENTO': return <Rss size={16} className="text-purple-600" />;
            case 'LOG EMPILHADEIRA': return <Truck size={16} className="text-orange-600" />;
            case 'SAIDA': return <Anchor size={16} className="text-red-600" />;
            default: return <Rss size={16} className="text-gray-500" />;
        }
    };

    return (
        <li className="relative flex gap-4">
            {!isLast && <div className="absolute left-4 top-10 -bottom-4 w-0.5 bg-gray-200"></div>}

            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center z-10 mt-2">
                {getIcon()}
            </div>

            <div className="flex-grow pb-8">
                <p className="text-sm font-medium text-gray-500">{new Date(item.timestamp.replace('Z', '')).toLocaleString('pt-BR')}</p>
                <h4 className="text-md font-semibold text-gray-800">{item.titulo}</h4>
                <p className="text-sm text-gray-600">{item.descricao}</p>
                {item.local && <p className="text-sm text-gray-500 mt-1">Local: {item.local}</p>}
            </div>
        </li>
    );
};

function VidaDoBagContent() {
    const searchParams = useSearchParams();

    const [tagSearch, setTagSearch] = useState('');
    const debouncedTagFilter = useDebounce(tagSearch, 500);

    const [loteSearch, setLoteSearch] = useState('');
    const debouncedLoteFilter = useDebounce(loteSearch, 500);

    const [locationModalBagId, setLocationModalBagId] = useState<number | null>(null);


    const apiUrl = useMemo(() => {
        const idbag = searchParams.get('idbag');
        if (idbag) {
            return `/api/vida-do-bag?idbag=${idbag}`;
        }
        if (debouncedTagFilter && debouncedLoteFilter) {
            return `/api/vida-do-bag?tag=${debouncedTagFilter}&lote=${debouncedLoteFilter}`;
        }
    }, [searchParams, debouncedTagFilter, debouncedLoteFilter]);

    const { data, error, isLoading, mutate } = useSWR<VidaDoBagResponse>(apiUrl, fetcher);

    return (
        <>
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700">Vida do Bag</h2>
                        <p className="text-sm text-gray-500">Acompanhe o histórico completo do bag</p>
                    </div>
                    <Link href="/relatorios/bags-pendentes" className="flex items-center gap-2 text-sm text-green-700 hover:underline">
                        <ArrowLeft size={16} /> Voltar para Pendentes
                    </Link>
                </div>

                {/* So aparece o formulario se nao vier idbag */}
                {!searchParams.get('idbag') && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex gap-4 items-end">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tag do Bag</label>
                                <input
                                    type="text"
                                    value={tagSearch}
                                    onChange={(e) => setTagSearch(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                                <input
                                    type="text"
                                    value={loteSearch}
                                    onChange={(e) => setLoteSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">A busca é ativada quando ambos os campos estão preenchidos.</p>
                    </div>
                )}

                {isLoading && <LoadingSpinner />}

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
                        Erro ao buscar dados. Verifique os parâmetros e tente novamente.
                    </div>
                )}

                {!isLoading && !data && !error && (
                    <div className="bg-white text-center p-12 rounded-lg shadow border">
                        <p className="text-gray-500">Use a busca acima ou acesse via link para carregar os dados de um bag.</p>
                    </div>
                )}

                {data && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <KpiCard title="Tag" value={data.snapshot.tag} icon={<Hash size={20} />} color="text-green-700" />
                            <KpiCard title="Lote" value={data.snapshot.numLote} icon={<Archive size={20} />} color="text-gray-700" />
                            <KpiCard title="Status Atual" value={data.snapshot.status} icon={<MapPin size={20} />} color="text-blue-700" />
                            <KpiCard title="Peso de Entrada" value={data.snapshot.pesoEntrada.toFixed(2)} icon={<Scale size={20} />} color="text-purple-700" />
                            <KpiCard title="Localização" value={data.snapshot.localizacaoAla} icon={<MapPin size={20} />} color="text-orange-700" onClick={() => setLocationModalBagId(data.snapshot.idbag)} />
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Linha do Tempo de Eventos</h3>
                            <ul>
                                {data.timeline.map((item, index) => (
                                    <TimelineItem
                                        key={`${item.timestamp}-${index}`}
                                        item={item}
                                        isLast={index === data.timeline.length - 1}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <LocationUpdateModal
                bagId={locationModalBagId}
                onClose={() => setLocationModalBagId(null)}
                onSave={() => {
                    setLocationModalBagId(null);
                    mutate(); // dispara o mutate do swr
                }}
            />
        </>
    )
}

export default function VidaDoBagPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <VidaDoBagContent />
        </Suspense>
    );
}