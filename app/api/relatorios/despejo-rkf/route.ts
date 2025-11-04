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

    const whereClauses = ["1=1"];

    if (os) {
        whereClauses.push(`(idGs = '${os}' OR refGs LIKE '%${os}%')`);
    }

    if (dataInicio && !dataFim) {
        whereClauses.push(`CAST(dataHoraAtualizacao AS DATE) = '${dataInicio}'`);
    } else if (dataInicio && dataFim) {
        whereClauses.push(`dataHoraAtualizacao BETWEEN '${dataInicio}' AND '${dataFim}'`);
    }

    const query = `
        SELECT nrLote, 
            tagBag, 
            qtdEntradaBag, 
            qtdValidado, 
            refGs, 
            dataHoraAtualizacao, 
            statusBag, 
            siloDestino 
        FROM TbInventarioBag
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY dataHoraAtualizacao DESC
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