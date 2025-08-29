import { useState, useCallback } from 'react';
import { type RegraOrgao, mockRegrasOrgaos } from '../../../data/mockRegrasOrgaos';
import { type RegraAutoridade, mockRegrasAutoridades } from '../../../data/mockRegrasAutoridades';
import { toggleDocumentoAssunto, updateSecaoConfig } from '../../../data/documentoRegras';
import { mockAssuntos } from '../../../data/mockAssuntos';

export const useRegrasLogic = () => {
  // Estados originais (valores salvos)
  const [originalRegrasOrgaos] = useState<RegraOrgao[]>(mockRegrasOrgaos);
  const [originalRegrasAutoridades] = useState<RegraAutoridade[]>(mockRegrasAutoridades);

  // Estados atuais (com modificações)
  const [regrasOrgaos, setRegrasOrgaos] = useState<RegraOrgao[]>(mockRegrasOrgaos);
  const [regrasAutoridades, setRegrasAutoridades] =
    useState<RegraAutoridade[]>(mockRegrasAutoridades);

  // Estados de controle dirty
  const [isDirtyOrgaos, setIsDirtyOrgaos] = useState(false);
  const [isDirtyAutoridades, setIsDirtyAutoridades] = useState(false);
  const [isDirtyAssuntos, setIsDirtyAssuntos] = useState(false);
  const [isDirtyDocumento, setIsDirtyDocumento] = useState(false);

  const [selectedAssuntoId, setSelectedAssuntoId] = useState<number | null>(null);

  // Verificação de mudanças
  const checkIfDirtyOrgaos = useCallback(
    (newRegras: RegraOrgao[]) => {
      const isDifferent = JSON.stringify(newRegras) !== JSON.stringify(originalRegrasOrgaos);
      setIsDirtyOrgaos(isDifferent);
      return isDifferent;
    },
    [originalRegrasOrgaos]
  );

  const checkIfDirtyAutoridades = useCallback(
    (newRegras: RegraAutoridade[]) => {
      const isDifferent = JSON.stringify(newRegras) !== JSON.stringify(originalRegrasAutoridades);
      setIsDirtyAutoridades(isDifferent);
      return isDifferent;
    },
    [originalRegrasAutoridades]
  );

  // Funções para a seção de Órgãos
  const handleRuleChangeOrgaos = useCallback(
    (orgaoId: number, ruleName: 'isSolicitante' | 'isOrgaoJudicial', value: boolean) => {
      const regraExistente = regrasOrgaos.find(r => r.orgaoId === orgaoId);
      let newRegras: RegraOrgao[];

      if (regraExistente) {
        newRegras = regrasOrgaos.map(r =>
          r.orgaoId === orgaoId ? { ...r, [ruleName]: value } : r
        );
      } else {
        const novaRegra: RegraOrgao = {
          orgaoId,
          isSolicitante: ruleName === 'isSolicitante' ? value : false,
          isOrgaoJudicial: ruleName === 'isOrgaoJudicial' ? value : false,
        };
        newRegras = [...regrasOrgaos, novaRegra];
      }

      setRegrasOrgaos(newRegras);
      checkIfDirtyOrgaos(newRegras);
    },
    [regrasOrgaos, checkIfDirtyOrgaos]
  );

  const handleSaveChangesOrgaos = useCallback(() => {
    setIsDirtyOrgaos(false);
  }, []);

  // Funções para a seção de Autoridades
  const handleRuleChangeAutoridades = useCallback(
    (autoridadeId: number, value: boolean) => {
      const regraExistente = regrasAutoridades.find(r => r.autoridadeId === autoridadeId);
      let newRegras: RegraAutoridade[];

      if (regraExistente) {
        newRegras = regrasAutoridades.map(r =>
          r.autoridadeId === autoridadeId ? { ...r, isAutoridadeJudicial: value } : r
        );
      } else {
        const novaRegra: RegraAutoridade = {
          autoridadeId,
          isAutoridadeJudicial: value,
        };
        newRegras = [...regrasAutoridades, novaRegra];
      }

      setRegrasAutoridades(newRegras);
      checkIfDirtyAutoridades(newRegras);
    },
    [regrasAutoridades, checkIfDirtyAutoridades]
  );

  const handleSaveChangesAutoridades = useCallback(() => {
    setIsDirtyAutoridades(false);
  }, []);

  // Funções para a seção de Assuntos
  const handleAssuntoSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedAssuntoId(id || null);
  }, []);

  const handleAssuntoDocChange = useCallback(
    (tipoDocumentoNome: string) => {
      if (!selectedAssuntoId) return;

      const assuntoSelecionado = mockAssuntos.find(a => a.id === selectedAssuntoId);
      if (!assuntoSelecionado) return;

      toggleDocumentoAssunto(assuntoSelecionado.nome, tipoDocumentoNome);
      setIsDirtyAssuntos(true);
    },
    [selectedAssuntoId]
  );

  const handleSaveChangesAssuntos = useCallback(() => {
    setIsDirtyAssuntos(false);
  }, []);

  // Handlers para Regras de Documento
  const handleVisibilityChange = useCallback(
    (key: string, section: 'section2' | 'section3' | 'section4', checked: boolean) => {
      updateSecaoConfig(key, { [section]: checked });
      setIsDirtyDocumento(true);
    },
    []
  );

  const handleSaveChangesDocumento = useCallback(() => {
    setIsDirtyDocumento(false);
  }, []);

  return {
    // Estados
    regrasOrgaos,
    regrasAutoridades,
    selectedAssuntoId,
    isDirtyOrgaos,
    isDirtyAutoridades,
    isDirtyAssuntos,
    isDirtyDocumento,

    // Handlers
    handleRuleChangeOrgaos,
    handleSaveChangesOrgaos,
    handleRuleChangeAutoridades,
    handleSaveChangesAutoridades,
    handleAssuntoSelect,
    handleAssuntoDocChange,
    handleSaveChangesAssuntos,
    handleVisibilityChange,
    handleSaveChangesDocumento,
  };
};
