import { dbQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { idbag, tipo, ala, bloco, idUsuario } = await request.json();

    console.log("Received data:", { idbag, tipo, ala, bloco, idUsuario });

    if (!idUsuario) {
        return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    if (!idbag) {
        return NextResponse.json({ error: 'ID do bag não fornecido' }, { status: 400 });
    }

    let queryTagAla = '';

    if (tipo === 'ALA') {
        queryTagAla = `(SELECT numtag FROM endereco WHERE auxiliar = '${ala}' AND bloco = '${bloco}')`;
    } else {
        queryTagAla = `(SELECT numtag FROM endereco WHERE numtag = '${tipo}')`;
    }

    const query = `
        DECLARE @IDBAG INT, @IDLOTE INT, @NUMLOTE VARCHAR(20), @IDTAG INT, @TAGBAG VARCHAR(8), @OUTPUT_T INT, @OUTPUT_A INT;
        DECLARE @TAGALA VARCHAR(8) = ${queryTagAla};
        DECLARE @DATAHORA VARCHAR(20) = (SELECT FORMAT(GETDATE(),'yyyy-MM-dd HH:mm:ss') AS datetime);

        SELECT @IDBAG = Bag.idbag, @IDLOTE = numLote.idlote, @NUMLOTE = numLote.numLote, @IDTAG = Tag.idtag, @TAGBAG = Tag.tag
        FROM Bag
        INNER JOIN numLote ON Bag.idlote = numLote.idlote
        INNER JOIN Tag ON Bag.idtag = Tag.idtag
        WHERE Bag.idbag = ${idbag}

        -- Nao posso executar a procedure para armazenar o bag se ele ja estiver armazenado
        EXEC SP_EMP_atualizarDadosMovimentos_V3
            0, 1, 0,
            @IDBAG, @IDLOTE, @NUMLOTE, @IDTAG, @TAGBAG,
            'T', @DATAHORA, '',
            '1', 2, 0, '',
            0, 0, 1,
            ${idUsuario}, 0, '20', '20',
            @retIdmov = @OUTPUT_T OUTPUT;

        -- so vou executar o 'A' se o 'T' tiver retornado 1
        IF (@OUTPUT_T = 1)
        BEGIN
        EXEC SP_EMP_atualizarDadosMovimentos_V3
            0, 1, 0,
            @IDBAG, @IDLOTE, @NUMLOTE, @IDTAG, @TAGBAG,
            'A', @DATAHORA, @TAGALA,
            '2', 2, 0, '',
            0, 0, 1,
            ${idUsuario}, 0, '20', '20',
            @retIdmov = @OUTPUT_A OUTPUT;
        END
        ELSE
        BEGIN
        -- sinaliza que não executou o 'A' definindo um valor identificável
        SET @OUTPUT_A = -1;
        END

        -- retorna os dois outputs para o node
        SELECT @OUTPUT_T AS ResultadoT, @OUTPUT_A AS ResultadoA;
    `;

    console.log("Query:", query);

    try {
        const result = await dbQuery(query);

        if (!result || result.length === 0) {
            return NextResponse.json({ error: 'Falha ao atualizar localização do bag' }, { status: 500 });
        }

        const outputT = result[0].ResultadoT;
        const outputA = result[0].ResultadoA;

        console.log("Outputs from DB:", { outputT, outputA });

        if (outputT === 1 && outputA === 1) {
            return NextResponse.json({ message: 'Localização do bag atualizada com sucesso' }, { status: 200 });            
        }

        if (outputT !== 1) {
            return NextResponse.json({ message: 'Atualização de movimentação (T) não confirmada pelo banco.' }, { status: 400 });
        }

        return NextResponse.json({ message: 'Execução de movimentação (T) OK, mas execução de armazenamento (A) falhou.' }, { status: 400 });
    }
    catch (error) {
        console.error('API Error /localizacao:', error);
        return NextResponse.json({ message: 'Erro ao atualizar localização do bag' }, { status: 500 });
    }
}