import { dbQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

interface BagTimeLineEvent {
    timestamp: string;
    tipo: 'ENTRADA' | 'MOVIMENTO' | 'LOG EMPILHADEIRA' | 'SAIDA';
    titulo: string;
    descricao: string;
    local: string | null;
}

interface LogEventos {
    dateTimeRegLocalEmp: string;
    descEmp: string;
    usuarioEmp: string;
    tipoEventoEmp: string;
    descLocal: string;
}

interface MovimentosBag {
    horaReg: string;
    descricaoLocal: string;
    tipoAtividade: string;
    idOS: number;
    qtdBaixaOS: number;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const idbag = searchParams.get('idbag');
    const tag = searchParams.get('tag');
    const lote = searchParams.get('lote');

    let bagId: number;

    try {
        if (!idbag) {
            if (!tag || !lote) {
                return NextResponse.json({ message: 'Parâmetros insuficientes. Forneça idbag ou (tag e lote).' }, { status: 400 });
            }
            // tem tag e lote mas nao tem idbag, vou procurar o idbag
            const idQuery = `
                SELECT Bag.idbag FROM Bag
                INNER JOIN Tag ON Tag.idtag = Bag.idtag
                INNER JOIN numLote ON numLote.idlote = Bag.idlote
                WHERE Tag.tag = '${tag}' AND numLote.numLote = '${lote}'
            `
            const idResult = await dbQuery(idQuery);
            if (!idResult || idResult.length === 0) {
                return NextResponse.json({ message: 'Bag não encontrado para a tag e lote fornecidos.' }, { status: 404 });
            }
            bagId = idResult[0].idbag;
        } else {
            bagId = parseInt(idbag);
        }

        // agora tenho o idbag, vou buscar o timeline

        // Query 1: Dados principais
        const snapshotQuery = `
            SELECT 
                B.qtdtotal AS pesoEntrada, 
                CASE B.status WHEN 'S' THEN 'Baixado' WHEN 'A' THEN 'Armazenado' WHEN 'T' THEN 'Transito' ELSE 'Carregado' END AS status, 
                CAST(B.obs AS DATE) AS diaEntrada,
                T.tag,
                NL.numLote,
                E.auxiliar AS localizacaoAla
            FROM Bag B
            INNER JOIN Tag T ON T.idtag = B.idtag
            INNER JOIN numLote NL ON NL.idlote = B.idlote
            LEFT JOIN localizacao L ON L.idbag = B.idbag
            LEFT JOIN endereco E ON E.id = L.idend
            WHERE B.idbag = ${bagId}
        `;

        // Query 2: Log de eventos da empilhadeira
        const logEventosQuery = `
            SELECT dateTimeRegLocalEmp, descEmp, usuarioEmp, tipoEventoEmp, descLocal 
            FROM TbLogEventosEmp 
            WHERE IdBagEmp = ${bagId}
        `;

        // Query 3: Movimentos do bag
        const movimentosQuery = `
            SELECT horaReg, descricaoLocal, tipoAtividade, idOS, qtdBaixaOS 
            FROM tbMovimentosEmp 
            WHERE idBag = ${bagId}
        `;

        // Query 4: Dados de Saída
        const saidaQuery = `
            SELECT qtd_kg, dataAtualizacao 
            FROM Embarque_Bag 
            WHERE id_bag = ${bagId}
        `;

        const [snapshorResult, logEventosResult, movimentosResult, saidaResult] = await Promise.all([
            dbQuery(snapshotQuery),
            dbQuery(logEventosQuery),
            dbQuery(movimentosQuery),
            dbQuery(saidaQuery)
        ]);

        if (!snapshorResult || snapshorResult.length === 0) {
            return NextResponse.json({ message: 'Bag não encontrada.' }, { status: 404 });
        }

        const snapshot = snapshorResult[0];
        const saida = saidaResult.length > 0 ? saidaResult[0] : null;

        // montar a timeline unificada
        const timeline: BagTimeLineEvent[] = [];

        timeline.push({
            timestamp: snapshot.diaEntrada,
            tipo: 'ENTRADA',
            titulo: 'Entrada no Sistema',
            descricao: `Bag registrado com ${snapshot.pesoEntrada.toFixed(2)} kg.`,
            local: null
        });

        // eventos de log da empilhadeira
        logEventosResult.forEach((log: LogEventos) => {
            timeline.push({
                timestamp: log.dateTimeRegLocalEmp,
                tipo: 'LOG EMPILHADEIRA',
                titulo: `Evento: ${log.tipoEventoEmp}`,
                descricao: `Empilhadeira: ${log.descEmp} | Operador: ${log.usuarioEmp}`,
                local: log.descLocal
            });
        });

        // eventos de movimentacao
        movimentosResult.forEach((mov: MovimentosBag) => {
            timeline.push({
                timestamp: mov.horaReg,
                tipo: 'MOVIMENTO',
                titulo: mov.tipoAtividade,
                descricao: `Local: ${mov.descricaoLocal} | OS: ${mov.idOS} | Qtde Baixada: ${mov.qtdBaixaOS ? mov.qtdBaixaOS.toFixed(2) + ' kg' : 'N/A'}`,
                local: mov.descricaoLocal
            });
        });

        // eventos de saida
        if (saida) {
            timeline.push({
                timestamp: saida.dataAtualizacao,
                tipo: 'SAIDA',
                titulo: 'Saída (Embarque)',
                descricao: `Bag embarcado com ${saida.qtd_kg.toFixed(2)} kg.`,
                local: null
            });
        }

        // ordenar a timeline
        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // montando a resposta final
        const response = {
            snapshot: {
                idbag: bagId,
                tag: snapshot.tag,
                numLote: snapshot.numLote,
                status: snapshot.status,
                pesoEntrada: snapshot.pesoEntrada,
                diaEntrada: snapshot.diaEntrada,
                localizacaoAla: snapshot.localizacaoAla
            },
            saida: saida ? {
                dataSaida: saida.dataAtualizacao,
                pesoSaida: saida.tdq_kg
            } : null,
            timeline: timeline
        };

        return NextResponse.json(response);

    }
    catch (error) {
        console.error('API Error /vida-do-bag:', error);
        return NextResponse.json({ message: 'Erro ao processar a solicitação' }, { status: 500 });
    }
}