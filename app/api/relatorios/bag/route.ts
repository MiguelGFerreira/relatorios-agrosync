import { dbQuery } from "@/app/lib/db";
import { Bag } from "@/app/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const idbag = searchParams.get('idbag');

    const whereClauses = [];

    if (idbag) {
        whereClauses.push(`Bag.idbag = '${idbag}'`);
    } else {
        return NextResponse.json({ message: 'Parâmetro idbag é obrigatório' }, { status: 400 });
    }

    const query = `
        SELECT Bag.idbag
            ,Tag.tag
            ,numLote.numLote
            ,Bag.status
            ,OS.id
        FROM Bag
        INNER JOIN Tag ON Tag.idtag = Bag.idtag
        INNER JOIN numLote ON numLote.idlote = Bag.idlote
        LEFT JOIN Embarque_Lotes EL ON EL.idlote = numLote.idlote
        LEFT JOIN Embarque ON Embarque.id = EL.idembarque
        LEFT JOIN Itens_OS ON Itens_OS.id_origem = Embarque.id
        LEFT JOIN OS ON OS.id = Itens_OS.id_os
        WHERE ${whereClauses.join(' AND ')}
    `;

    console.log(query);
    
    try {
        const result = await dbQuery(query);
        return NextResponse.json(result as Bag[]);
    }
    catch (error) {
        console.error('API Error /bag:', error);
        return NextResponse.json({ message: 'Erro ao buscar dados do relatório' }, { status: 500 });
    }
}