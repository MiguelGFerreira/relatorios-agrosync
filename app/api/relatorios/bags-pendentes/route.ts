import { dbQuery } from "@/app/lib/db";
import { BagPendente } from "@/app/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dia = searchParams.get('dia');

    if (!dia) {
        return NextResponse.json({ message: 'A data é obrigatória' }, { status: 400 });
    }

    const query = `
        DECLARE @dt DATE = '${dia}';

        WITH CTE_USUARIO AS (
            SELECT idEmp
                ,STRING_AGG(usuarioEmp, ' / ') WITHIN GROUP (ORDER BY usuarioEmp) AS usuarios
            FROM (
                SELECT DISTINCT idEmp
                    ,usuarioEmp
                FROM TbLogEventosEmp
                WHERE dateTimeRegLocalEmp >= @dt
                    AND dateTimeRegLocalEmp < DATEADD(DAY, 1, @dt)
                    AND usuarioEmp NOT LIKE 'Usuario%'
                    AND usuarioEmp <> ''
                ) AS dinstinctUsuario
            GROUP BY idEmp
        )
        ,CTE_BAGSNARUA AS (
            SELECT idbag
            FROM localizacao
            WHERE idend IN (3094, 3095, 3096)
        )
        ,MOV_RANK AS (
            SELECT tbMovimentosEmp.*
                ,ROW_NUMBER() OVER (
                    PARTITION BY idBag ORDER BY horaReg DESC
                        ,IdMovGeral DESC
                    ) AS rn
            FROM tbMovimentosEmp
            WHERE horaReg >= @dt
                AND horaReg < DATEADD(DAY, 1, @dt)
                AND idTag IS NOT NULL
        )
        SELECT DISTINCT MOV_RANK.horaReg
            ,MOV_RANK.idBag
            ,tagBag
            ,Bag.status
            ,Empilhadeira.tag_emp
            ,CTE_USUARIO.usuarios AS usuarioEmp
        FROM MOV_RANK
        INNER JOIN Bag ON MOV_RANK.idBag = Bag.idbag
        INNER JOIN Empilhadeira ON Empilhadeira.idemp = MOV_RANK.idEmp
        INNER JOIN CTE_USUARIO ON CTE_USUARIO.idEmp = Empilhadeira.idemp
        LEFT JOIN CTE_BAGSNARUA ON CTE_BAGSNARUA.idbag = Bag.idbag
        WHERE MOV_RANK.rn = 1
            AND (
                Bag.STATUS = 'T'
                OR (
                    Bag.STATUS = 'A'
                    AND CTE_BAGSNARUA.idbag IS NOT NULL
                    )
                )
        ORDER BY horaReg DESC
    `;

    console.log(query);
    
    try {
        const result = await dbQuery(query);
        return NextResponse.json(result as BagPendente[]);
    }
    catch (error) {
        console.error('API Error /bags-pendentes:', error);
        return NextResponse.json({ message: 'Erro ao buscar dados do relatório' }, { status: 500 });
    }
}