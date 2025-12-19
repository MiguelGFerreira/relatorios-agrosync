import { dbQuery } from "@/app/lib/db";
import { DespejoRkfPayload, DespejoRkfReportRecord } from "@/app/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const payload: DespejoRkfPayload = await request.json();
    const { bag, pesoInput } = payload;

    if (!bag || !pesoInput || pesoInput <= 0) {
        return NextResponse.json({ message: 'Dados inválidos para o lançamento.' }, { status: 400 });
    }

    const query = `
        INSERT INTO
            (tipoAtividade, idLote, nrLote, idBag, tagBag, qtdEntradaBag, qtdAjustadoBag, qtdValidado, localOrigemBag, idAtividade, descAtividade, idGs, refGs, dataHoraAtualizacao, obsInventarioBag, statusBag, statusProcesso)
        VALUES
            ('Despejo RKF', ${bag.idLote}, ${bag.numLote}, ${bag.idBag}, ${bag.tag}, ${bag.qtdTotal}, 0.00, ${pesoInput}, ${bag.localizacao}, 1, 'Validar peso e efetuar despejo', ${bag.idOs}, ${bag.codGs}, GETDATE(), 'LANÇAMENTO MANUAL', 'T', 1)
    `;

    try {
        console.log(query);
        await dbQuery(query);
        return NextResponse.json({ message: `Peso ${pesoInput}kg lançado com sucesso para o Bag ${bag.tag}!` }, { status: 201 });
    }
    catch (error) {
        console.error('API Error /despejo-rkf:', error);
        // const dbError = error as any;
        // const errorMessage = dbError?.originalError?.message || 'Erro ao salvar os dados no banco.';
        return NextResponse.json({ message: 'Erro ao salvar os dados no banco.' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const os = searchParams.get('os');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    const whereClauses = ["OS.idcliente = 30"];

    if (os) {
        whereClauses.push(`(idGs = TRY_CAST('${os}' AS int) OR refGs LIKE '%${os}%')`);
    }

    if (dataInicio && (dataInicio === dataFim) || (dataInicio && !dataFim)) {
        whereClauses.push(`EB.dataAtualizacao BETWEEN '${dataInicio}' AND DATEADD(DAY, 1, '${dataInicio}')`);
    } else if (dataInicio && dataFim) {
        whereClauses.push(`EB.dataAtualizacao BETWEEN '${dataInicio}' AND '${dataFim}'`);
    }

    const query = `
        WITH UltimoInventario
        AS (
            SELECT TBI.*
                ,ROW_NUMBER() OVER (
                    PARTITION BY TBI.idBag ORDER BY TBI.dataHoraAtualizacao DESC
                    ) AS rn
            FROM TbInventarioBag TBI
            )
        SELECT EB.id_bag
            ,EB.dataAtualizacao AS despejo
            ,UI.nrLote
            ,UI.tagBag
            ,UI.qtdEntradaBag
            ,UI.qtdValidado
            ,UI.refGs
            ,UI.idGs
            ,UI.dataHoraAtualizacao AS pesagem
            ,UI.statusBag
            ,UI.siloDestino
        FROM Embarque E
        INNER JOIN Itens_OS I ON I.id_origem = E.id
        INNER JOIN OS ON OS.id = I.id_os
        INNER JOIN Embarque_Lotes EL ON EL.idembarque = E.id
        INNER JOIN Embarque_Bag EB ON EB.id_embarquelotes = EL.id
        INNER JOIN UltimoInventario UI ON UI.idBag = EB.id_bag
            AND UI.rn = 1 -- último inventário do bag
        WHERE ${whereClauses.join(' AND ')}
            -- bag só pertence ao embarque se o último inventário for da MESMA GS da OS
            AND (
                UI.idGs = TRY_CAST(OS.codGs AS int)
                OR UI.refGs = OS.codGs
                )
        ORDER BY UI.dataHoraAtualizacao DESC
    `;

    console.log(query);
    
    try {
        const result = await dbQuery(query);
        return NextResponse.json(result as DespejoRkfReportRecord[]);
    }
    catch (error) {
        console.error('API Error /despejo-rkf:', error);
        return NextResponse.json({ message: 'Erro ao buscar dados do relatório' }, { status: 500 });
    }
}