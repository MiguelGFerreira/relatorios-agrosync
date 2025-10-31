import { dbQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ala = searchParams.get('ala');

    if (!ala) {
        return NextResponse.json({ error: 'Ala não fornecida' }, { status: 400 });
    }

    try {
        const query = `SELECT DISTINCT auxiliar FROM endereco WHERE auxiliar = '${ala}'`;
        const result = await dbQuery(query);
        
        return NextResponse.json({ isValid: result.length > 0 });
    }
    catch (error) {
        console.error('API Error /localizacao/valida-ala:', error);
        return NextResponse.json({ error: 'Erro ao validar ala' }, { status: 500 });
    }
}