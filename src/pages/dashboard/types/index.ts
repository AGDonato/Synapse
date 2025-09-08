// Types for HomePage components
export interface Estatistica {
  id: string;
  titulo: string;
  valor: number | string;
  subtitulo?: string;
  icon: React.ReactElement;
  cor:
    | 'azul'
    | 'verde'
    | 'amarelo'
    | 'vermelho'
    | 'roxo'
    | 'laranja'
    | 'cinza-escuro'
    | 'azul-escuro';
  tendencia?: {
    valor: number;
    direcao: 'alta' | 'baixa' | 'estavel';
  };
}

export interface SubCard {
  id: string;
  titulo: string;
  valor: number;
  cor: string;
  icon: React.ReactElement;
}

export interface FiltroTabelas {
  analista: string[];
  referencia: string;
  documentos: string;
}

export interface FiltrosEstatisticas {
  anos: string[];
  analista: string[];
  demandas: {
    status: string[];
    tipoDemanda: string[];
    orgao: string[];
  };
  documentos: {
    tipoDocumento: string[];
    assunto: string[];
    statusDocumento: string[];
  };
}

export interface FiltrosDocumentos {
  anos: string[];
}

export interface HomePageContadores {
  documentos: number;
  demandas: number;
}
