import { dbQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ala = searchParams.get('ala');

    if (!ala) {
        return NextResponse.json({ error: 'Ala não fornecida.' }, { status: 400 });
    }

    try {
        const query = `exec sp_emp_retorna_detalhes_blocos_ala '${ala}'`;
        const result = await dbQuery(query);
        return NextResponse.json(result);
    }
    catch (error) {
        console.error('API Error /localizacao/blocos:', error);
        return NextResponse.json({ error: 'Erro ao buscar blocos da ala' }, { status: 500 });
    }
}