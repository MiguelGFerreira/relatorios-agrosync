import { dbQuery } from "@/app/lib/db";
import { bagParaDespejo } from "@/app/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const osIdentifier = searchParams.get('os');

    if (!osIdentifier) {
        return NextResponse.json({ message: 'O código da OS é obrigatório' }, { status: 400 });
    }

    const query = `
        SELECT DISTINCT
            L.idlote AS idLote,
            L.numLote,
            B.idbag AS idBag,
            B.qtdtotal AS qtdTotal,
            T.tag,
            T.localizacao,
            OS.id AS idOs,
            OS.codGs
        FROM OS
        INNER JOIN Itens_OS IOS ON OS.id = IOS.id_os
        INNER JOIN Embarque E ON E.id = IOS.id_origem
        INNER JOIN Embarque_Lotes EL ON E.id = EL.idembarque
        INNER JOIN numLote L ON L.idlote = EL.idlote
        INNER JOIN Bag B ON B.idlote = L.idlote
        INNER JOIN Tag T ON B.idtag = T.idtag
        WHERE (UPPER(OS.codGs) = '${osIdentifier.toUpperCase()}' OR CAST(OS.id AS VARCHAR) = '${osIdentifier}')
            AND B.idbag NOT IN (SELECT idBag FROM TbInventarioBag)
        ORDER BY L.numLote, T.tag
    `;

    try {
        const result = await dbQuery(query);
        return NextResponse.json(result as bagParaDespejo[]);
    }
    catch (error) {
        console.error('API Error /bags-por-os:', error);
        return NextResponse.json({ message: 'Erro ao buscar bags da OS' }, { status: 500 });
    }
}