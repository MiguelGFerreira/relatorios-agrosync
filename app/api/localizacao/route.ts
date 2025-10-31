import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { idbag, tipo, ala, bloco } = await request.json();

    if (!idbag) {
        return NextResponse.json({ error: 'ID do bag não fornecido' }, { status: 400 });
    }

    try {
        console.log('Atualizando localização do bag:', { idbag, tipo, ala, bloco });
        return NextResponse.json({ message: 'Localização do bag atualizada com sucesso' });
    }
    catch (error) {
        console.error('API Error /localizacao:', error);
        return NextResponse.json({ error: 'Erro ao atualizar localização do bag' }, { status: 500 });
    }
}