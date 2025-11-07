export interface bagParaDespejo {
    idLote: number;
    numLote: string;
    idBag: number;
    qtdTotal: number;
    tag: number;
    localizacao: number;
    idOs: number;
    codGs: number;
}

// payload que o cliente vai enviar pra api
export interface DespejoRkfPayload {
    bag: bagParaDespejo;
    pesoInput: number;
}

export interface DespejoRkfReportRecord {
    id_bag: number;
    despejo: string;
    nrLote: string;
    tagBag: number;
    qtdEntradaBag: number;
    qtdValidado: number;
    refGs: string;
    pesagem: string;
    statusBag: string;
    siloDestino: string;
}

export interface BagWeightRecord {
    nrLote: string;
    tagBag: number;
    qtdEntradaBag: number;
    qtdValidado: number;
    refGs: string;
    dataHoraAtualizacao: string;
    statusBag: string;
    siloDestino: string;
}

export interface Bag {
    idbag: number;
    tag: string;
    numLote: string;
    status: string;
    os: number;
}

export interface BagPendente {
    horaReg: string;
    idBag: number;
    tagBag: string;
    status: string;
    tag_emp: string;
    usuarioEmp: string;
}