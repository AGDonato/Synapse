import { useState } from 'react';

export const useUIState = () => {
  // Estados de UI (seções expansíveis)
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);

  // Estados para abas internas
  const [cadastrosActiveTab, setCadastrosActiveTab] = useState<'autoridades' | 'orgaos'>(
    'autoridades'
  );
  const [documentosActiveTab, setDocumentosActiveTab] = useState<'assunto-tipo' | 'visibilidade'>(
    'assunto-tipo'
  );

  // Estados para hover effects
  const [hoveredSectionHeader, setHoveredSectionHeader] = useState<string | null>(null);

  const [searchTermOrgaos, setSearchTermOrgaos] = useState('');
  const [searchTermAutoridades, setSearchTermAutoridades] = useState('');

  // Handlers para seções expansíveis
  const handleToggleCadastros = () => setIsCadastrosOpen(!isCadastrosOpen);
  const handleToggleDocumentos = () => setIsDocumentosOpen(!isDocumentosOpen);

  return {
    // Estados de UI
    isCadastrosOpen,
    isDocumentosOpen,
    cadastrosActiveTab,
    documentosActiveTab,
    hoveredSectionHeader,
    searchTermOrgaos,
    searchTermAutoridades,

    // Setters
    setCadastrosActiveTab,
    setDocumentosActiveTab,
    setHoveredSectionHeader,
    setSearchTermOrgaos,
    setSearchTermAutoridades,

    // Handlers
    handleToggleCadastros,
    handleToggleDocumentos,
  };
};
