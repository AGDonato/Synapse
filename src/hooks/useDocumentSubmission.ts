// src/hooks/useDocumentSubmission.ts

import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { MultiSelectOption } from '../components/forms/MultiSelectDropdown';
import { useDocumentos } from '../contexts/DocumentosContext';
import { useDemandas } from './useDemandas';

// Tipos
interface SearchableField {
  id: number;
  nome: string;
}

interface DestinatarioField extends SearchableField {
  razaoSocial?: string;
}

type EnderecamentoField = SearchableField;
type AnalistaField = SearchableField;
type AutoridadeField = SearchableField;
type OrgaoField = SearchableField;

interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

interface FormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: DestinatarioField | null;
  destinatarios: MultiSelectOption[];
  enderecamento: EnderecamentoField | null;
  numeroDocumento: string;
  anoDocumento: string;
  analista: AnalistaField | null;
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  pesquisas: PesquisaItem[];
}

interface RetificacaoItem {
  id: string;
  autoridade: AutoridadeField | null;
  orgaoJudicial: OrgaoField | null;
  dataAssinatura: string;
  retificada: boolean;
}

type ToastType = 'error' | 'success' | 'warning';

interface UseDocumentSubmissionProps {
  formData: FormData;
  retificacoes: RetificacaoItem[];
  validateForm: () => boolean;
  onShowToast: (message: string, type: ToastType) => void;
  isEditMode?: boolean;
  documentId?: string | null;
  demandaId?: string;
  demandaIdFromQuery?: string;
}

interface UseDocumentSubmissionReturn {
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

// Função auxiliar para formatar destinatários
const formatDestinatarios = (
  tipoDocumento: string,
  destinatario: DestinatarioField | null,
  destinatarios: MultiSelectOption[]
): string => {
  if (tipoDocumento === 'Ofício Circular') {
    return destinatarios.map(dest => dest.nome).join(', ');
  } else {
    return destinatario?.nome || '';
  }
};

export const useDocumentSubmission = ({
  formData,
  retificacoes,
  validateForm,
  onShowToast,
  isEditMode = false,
  documentId = null,
  demandaId,
  demandaIdFromQuery,
}: UseDocumentSubmissionProps): UseDocumentSubmissionReturn => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addDocumento, updateDocumento, getDocumento } = useDocumentos();
  const { demandas } = useDemandas();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validar formulário completo
      if (!validateForm()) {
        return;
      }

      try {
        // Preparar dados do documento
        const currentDemandaId = parseInt(
          demandaId || demandaIdFromQuery || '1'
        );
        const demandaAssociada = demandas.find(d => d.id === currentDemandaId);

        const documentoData = {
          // ID será gerado automaticamente pelo contexto se for novo
          demandaId: currentDemandaId,
          sged: demandaAssociada?.sged || 'N/A',
          tipoDocumento: formData.tipoDocumento,
          assunto: formData.assunto,
          assuntoOutros: formData.assuntoOutros,
          // Para Ofício Circular, usar formato especial; senão usar campo normal
          destinatario:
            formData.tipoDocumento === 'Ofício Circular' &&
            formData.destinatarios.length > 0
              ? formatDestinatarios(
                  formData.tipoDocumento,
                  formData.destinatario,
                  formData.destinatarios
                )
              : formData.destinatario?.nome || '',
          enderecamento: formData.enderecamento?.nome || '',
          numeroDocumento: formData.numeroDocumento,
          anoDocumento: formData.anoDocumento,
          analista: formData.analista?.nome || '',
          autoridade: formData.autoridade?.nome || '',
          orgaoJudicial: formData.orgaoJudicial?.nome || '',
          dataAssinatura: formData.dataAssinatura,
          retificada: formData.retificada,
          retificacoes: retificacoes.map(ret => ({
            id: ret.id,
            autoridade: ret.autoridade?.nome || '',
            orgaoJudicial: ret.orgaoJudicial?.nome || '',
            dataAssinatura: ret.dataAssinatura,
            retificada: ret.retificada,
          })),
          tipoMidia: formData.tipoMidia,
          tamanhoMidia: formData.tamanhoMidia,
          hashMidia: formData.hashMidia,
          senhaMidia: formData.senhaMidia,
          pesquisas: formData.pesquisas,
          numeroAtena: '',
          codigoRastreio: '',
          naopossuiRastreio: false,
          dataEnvio: null,
          dataResposta: null,
          dataFinalizacao: null,
          apresentouDefeito: false,
          respondido: false,
          // Para Ofício Circular, criar/atualizar dados individuais por destinatário
          destinatariosData:
            formData.tipoDocumento === 'Ofício Circular' &&
            formData.destinatarios.length > 0
              ? formData.destinatarios.map(dest => {
                  // Em modo de edição, preservar dados existentes se o destinatário já existia
                  const documentoAtual =
                    isEditMode && documentId
                      ? getDocumento(parseInt(documentId))
                      : null;
                  const dadosExistentes = documentoAtual?.destinatariosData
                    ? documentoAtual.destinatariosData.find(
                        d => d.nome === dest.nome
                      )
                    : null;

                  return {
                    nome: dest.nome,
                    dataEnvio: dadosExistentes?.dataEnvio || null,
                    dataResposta: dadosExistentes?.dataResposta || null,
                    codigoRastreio: dadosExistentes?.codigoRastreio || '',
                    naopossuiRastreio:
                      dadosExistentes?.naopossuiRastreio || false,
                    respondido: dadosExistentes?.respondido || false,
                  };
                })
              : undefined,
        };

        let documentoId_final: number;

        if (isEditMode && documentId) {
          // Atualizar documento existente
          updateDocumento(parseInt(documentId), documentoData);
          documentoId_final = parseInt(documentId);
        } else {
          // Criar novo documento
          const novoDocumento = addDocumento(documentoData);
          documentoId_final = novoDocumento.id;
        }

        const message = isEditMode
          ? 'Documento atualizado com sucesso!'
          : 'Documento criado com sucesso!';
        onShowToast(message, 'success');

        // Navegar para a página de detalhe do documento após salvar
        setTimeout(() => {
          // Preservar parâmetros de retorno se existirem
          const returnTo = searchParams.get('returnTo');
          const demandaIdParam = searchParams.get('demandaId');
          let queryString = '';

          if (returnTo && demandaIdParam) {
            queryString = `?returnTo=${returnTo}&demandaId=${demandaIdParam}`;
          }

          navigate(`/documentos/${documentoId_final}${queryString}`);
        }, 1500); // Aguarda 1.5s para mostrar a mensagem de sucesso
      } catch (error) {
        console.error('Erro ao salvar documento:', error);
        onShowToast('Erro ao salvar o documento. Tente novamente.', 'error');
      }
    },
    [
      formData,
      retificacoes,
      validateForm,
      onShowToast,
      isEditMode,
      documentId,
      demandaId,
      demandaIdFromQuery,
      demandas,
      addDocumento,
      updateDocumento,
      getDocumento,
      searchParams,
      navigate,
    ]
  );

  return {
    handleSubmit,
    isSubmitting: false, // Pode ser implementado com useState se necessário
  };
};
