import type { Demanda } from '../../../types/entities';

export type DemandModalType =
  | 'final_date'
  | 'reopen_demand'
  | 'status_update'
  | 'default';

export interface TempDemandStates {
  // Estados de data final
  dataFinal: string;
  dataFinalFormatted: string;

  // Estados de reabertura
  isReaberto: boolean;
  dataReabertura: string;
  dataReaberturaFormatted: string;
  novaDataFinal: string;
  novaDataFinalFormatted: string;

  // Estados de status
  status: string;

  // Estados de observações (futuro)
  observacoes: string;
}

export interface DemandUpdateModalProps {
  demanda: Demanda | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updateData: Partial<Demanda>) => void;
  onError?: (message: string) => void;
}

export interface ModalContentProps {
  tempStates: TempDemandStates;
  setTempStates: React.Dispatch<React.SetStateAction<TempDemandStates>>;
  demanda: Demanda;
}
