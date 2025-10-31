import { dbQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const query = 'exec SP_Emp_Opcoes_Armazenamento_Manual';
        const result = await dbQuery(query);
        return NextResponse.json(result);
    }
    catch (error) {
        console.error('API Error /localizacao/tipos:', error);
        return NextResponse.json({ error: 'Erro ao buscar tipos de armazenamento' }, { status: 500 });
    }
}