import { dbQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { idbag, tipo, ala, bloco, idUsuario } = await request.json();

    if (!idUsuario) {
        return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    if (!idbag) {
        return NextResponse.json({ error: 'ID do bag não fornecido' }, { status: 400 });
    }

    const query = `
        DECLARE @IDBAG INT, @IDLOTE INT, @NUMLOTE VARCHAR(20), @IDTAG INT, @TAGBAG VARCHAR(8), @OUTPUT INT
        DECLARE @TAGALA VARCHAR(8) = (SELECT numtag FROM endereco WHERE auxiliar = '${ala}' AND bloco = '${bloco}')
        DECLARE @DATAHORA VARCHAR(20) = (SELECT FORMAT(GETDATE(),'yyyy-MM-dd HH:mm:ss') AS datetime)

        SELECT @IDBAG = Bag.idbag, @IDLOTE = numLote.idlote, @NUMLOTE = numLote.numLote, @IDTAG = Tag.idtag, @TAGBAG = Tag.tag
        FROM Bag
        INNER JOIN numLote ON Bag.idlote = numLote.idlote
        INNER JOIN Tag ON Bag.idtag = Tag.idtag
        WHERE Bag.idbag = ${idbag}

        EXEC SP_EMP_atualizarDadosMovimentos_V3 0
            ,1
            ,0
            ,@IDBAG
            ,@IDLOTE
            ,@NUMLOTE
            ,@IDTAG
            ,@TAGBAG
            ,'A'
            ,@DATAHORA
            ,@TAGALA
            ,'2'
            ,2
            ,0
            ,''
            ,0
            ,0
            ,1
            ,${idUsuario}
            ,0
            ,'20'
            ,'20'
            ,@retIdmov = @OUTPUT OUTPUT

        SELECT @OUTPUT AS Resultado;
    `;

    console.log("Query:", query);

    try {
        const result = await dbQuery(query);

        if (!request || result.length === 0) {
            return NextResponse.json({ error: 'Falha ao atualizar localização do bag' }, { status: 500 });
        }

        const output = result[0].Resultado;

        if (output === 1) {
            return NextResponse.json({ message: 'Localização do bag atualizada com sucesso' }, { status: 200 });            
        }

        return NextResponse.json({ error: 'Atualização não confirmada pelo banco.' }, { status: 400 });
    }
    catch (error) {
        console.error('API Error /localizacao:', error);
        return NextResponse.json({ error: 'Erro ao atualizar localização do bag' }, { status: 500 });
    }
}