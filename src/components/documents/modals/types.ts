import type { DocumentoDemanda } from '../../../data/mockDocumentos';

export type ModalType =
  | 'finalizacao'
  | 'midia'
  | 'oficio'
  | 'oficio_circular'
  | 'oficio_circular_outros'
  | 'comunicacao_nao_cumprimento'
  | 'oficio_outros'
  | 'oficio_midia'
  | 'oficio_relatorio_tecnico'
  | 'oficio_relatorio_inteligencia'
  | 'oficio_relatorio_midia'
  | 'oficio_autos_circunstanciados'
  | 'default';

export interface DestinatarioData {
  nome: string;
  dataEnvio: string;
  dataEnvioFormatted?: string;
  dataResposta: string;
  dataRespostaFormatted?: string;
  codigoRastreio: string;
  naopossuiRastreio: boolean;
}

export interface TempModalStates {
  // Estados comuns
  numeroAtena: string;

  // Estados de finalização
  dataFinalizacao: string;
  dataFinalizacaoFormatted: string;

  // Estados de mídia
  apresentouDefeito: boolean;

  // Estados de ofício
  dataEnvio: string;
  dataEnvioFormatted: string;
  dataResposta: string;
  dataRespostaFormatted: string;
  codigoRastreio: string;
  naopossuiRastreio: boolean;

  // Estados de seleção
  selectedMidias: string[];
  selectedRelatoriosTecnicos: string[];
  selectedRelatoriosInteligencia: string[];
  selectedAutosCircunstanciados: string[];
  selectedDecisoes: string[];

  // Estados de ofício circular
  destinatariosData: DestinatarioData[];
}

export interface DocumentUpdateModalProps {
  documento: DocumentoDemanda | null;
  documentosDemanda: DocumentoDemanda[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updateData: Partial<DocumentoDemanda>) => void;
  onError?: (errorMessage: string) => void;
  getDocumento: (id: number) => DocumentoDemanda | undefined;
}

export interface ModalContentProps {
  tempStates: TempModalStates;
  setTempStates: React.Dispatch<React.SetStateAction<TempModalStates>>;
  documento: DocumentoDemanda;
  documentosDemanda: DocumentoDemanda[];
  getDocumento: (id: number) => DocumentoDemanda | undefined;
}
