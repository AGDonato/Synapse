// src/pages/configuracoes/RegrasPage.tsx
import { useState, useCallback, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { MdSearchOff } from 'react-icons/md';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { theme } from '../../styles/theme';
import styles from './RegrasPage.module.css';

// Importando todos os dados que vamos precisar
import { mockOrgaos } from '../../data/mockOrgaos';
import { mockRegrasOrgaos, type RegraOrgao } from '../../data/mockRegrasOrgaos';
import { mockAutoridades } from '../../data/mockAutoridades';
import {
  mockRegrasAutoridades,
  type RegraAutoridade,
} from '../../data/mockRegrasAutoridades';
import { mockAssuntos } from '../../data/mockAssuntos';
import { mockTiposDocumentos } from '../../data/mockTiposDocumentos';

// Importando regras de documento
import {
  documentoAssuntoConfig,
  getAllSecaoConfigs,
  updateSecaoConfig,
  toggleDocumentoAssunto,
  isAssuntoAssociadoAoDocumento,
  initializeDocumentoConfigs,
  validateSystemConsistency,
} from '../../data/documentoRegras';

// Funções para gerar estilos dinâmicos
const getSectionHeaderStyle = (
  isOpen: boolean,
  isHovered: boolean = false
): React.CSSProperties => ({
  padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
  backgroundColor: isOpen
    ? theme.colors.background.secondary
    : isHovered
      ? theme.colors.background.muted
      : 'transparent',
  borderBottom: isOpen ? `1px solid ${theme.colors.border}` : 'none',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: theme.fontSize.lg,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.text.primary,
  transition: 'all 0.2s ease',
  userSelect: 'none',
});

const dynamicStyles = {
  sectionHeader: (isOpen: boolean, isHovered: boolean = false) =>
    ({
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      backgroundColor: isOpen
        ? theme.colors.background.secondary
        : isHovered
          ? theme.colors.background.muted
          : 'transparent',
      borderBottom: isOpen ? `1px solid ${theme.colors.border}` : 'none',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text.primary,
      transition: 'all 0.2s ease',
      userSelect: 'none',
    }) as React.CSSProperties,

  tabButton: (isActive: boolean) =>
    ({
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      border: 'none',
      borderBottom: `3px solid ${isActive ? theme.colors.primary : 'transparent'}`,
      backgroundColor: isActive
        ? theme.colors.background.secondary
        : 'transparent',
      cursor: 'pointer',
      fontWeight: isActive
        ? theme.fontWeight.semibold
        : theme.fontWeight.normal,
      fontSize: theme.fontSize.sm,
      color: isActive ? theme.colors.primary : theme.colors.text.secondary,
      transition: 'all 0.2s ease',
      borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
    }) as React.CSSProperties,

  pageDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    margin: 0,
    lineHeight: '1.4',
  } as React.CSSProperties,

  subSectionTitle: {
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  } as React.CSSProperties,
};

export default function RegrasPage() {
  // --- Estados originais (valores salvos) ---
  const [originalRegrasOrgaos] = useState<RegraOrgao[]>(mockRegrasOrgaos);
  const [originalRegrasAutoridades] = useState<RegraAutoridade[]>(
    mockRegrasAutoridades
  );

  // --- Estados atuais (com modificações) ---
  const [regrasOrgaos, setRegrasOrgaos] =
    useState<RegraOrgao[]>(mockRegrasOrgaos);
  const [regrasAutoridades, setRegrasAutoridades] = useState<RegraAutoridade[]>(
    mockRegrasAutoridades
  );
  // --- Estados de UI (seções expansíveis) ---
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);

  // --- Estados para abas internas ---
  const [cadastrosActiveTab, setCadastrosActiveTab] = useState<
    'autoridades' | 'orgaos'
  >('autoridades');
  const [documentosActiveTab, setDocumentosActiveTab] = useState<
    'assunto-tipo' | 'visibilidade'
  >('assunto-tipo');

  // --- Estados para hover effects ---
  const [hoveredSectionHeader, setHoveredSectionHeader] = useState<
    string | null
  >(null);

  const [searchTermOrgaos, setSearchTermOrgaos] = useState('');
  const [searchTermAutoridades, setSearchTermAutoridades] = useState('');
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<number | null>(
    null
  );

  // --- Estados de controle dirty ---
  const [isDirtyOrgaos, setIsDirtyOrgaos] = useState(false);
  const [isDirtyAutoridades, setIsDirtyAutoridades] = useState(false);
  const [isDirtyAssuntos, setIsDirtyAssuntos] = useState(false);
  const [isDirtyDocumento, setIsDirtyDocumento] = useState(false);

  // --- Funções de sincronização (apenas logs internos) ---
  const updateSyncInfo = useCallback(() => {
    const info = validateSystemConsistency();

    // Logs para debugging (invisível ao usuário)
    if (
      info.assuntosOrfaos.length > 0 ||
      info.secoesOrfas.length > 0 ||
      info.secoesFaltantes.length > 0 ||
      info.semAssuntoFaltantes.length > 0
    ) {
      console.log('[RegrasPage] Estado da sincronização:', {
        assuntosOrfaos: info.assuntosOrfaos.length,
        secoesOrfas: info.secoesOrfas.length,
        secoesFaltantes: info.secoesFaltantes.length,
        semAssuntoFaltantes: info.semAssuntoFaltantes.length,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // --- Inicialização ---
  useEffect(() => {
    // Inicializar configurações para garantir que todos os tipos do cadastro tenham regras
    initializeDocumentoConfigs();
    // Atualizar informações de sincronização
    updateSyncInfo();
  }, [updateSyncInfo]);

  // --- Verificação de mudanças ---
  const checkIfDirtyOrgaos = useCallback(
    (newRegras: RegraOrgao[]) => {
      const isDifferent =
        JSON.stringify(newRegras) !== JSON.stringify(originalRegrasOrgaos);
      setIsDirtyOrgaos(isDifferent);
      return isDifferent;
    },
    [originalRegrasOrgaos]
  );

  const checkIfDirtyAutoridades = useCallback(
    (newRegras: RegraAutoridade[]) => {
      const isDifferent =
        JSON.stringify(newRegras) !== JSON.stringify(originalRegrasAutoridades);
      setIsDirtyAutoridades(isDifferent);
      return isDifferent;
    },
    [originalRegrasAutoridades]
  );

  // --- Handlers para seções expansíveis ---
  const handleToggleCadastros = () => {
    setIsCadastrosOpen(!isCadastrosOpen);
  };

  const handleToggleDocumentos = () => {
    setIsDocumentosOpen(!isDocumentosOpen);
  };

  // --- Funções de reset (mantidas para possível uso futuro) ---

  // --- Funções para a seção de Órgãos ---
  const handleRuleChangeOrgaos = (
    orgaoId: number,
    ruleName: 'isSolicitante' | 'isOrgaoJudicial',
    value: boolean
  ) => {
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
  };
  const handleSaveChangesOrgaos = () => {
    console.log('Regras de Órgãos salvas:', regrasOrgaos);
    alert('Alterações de Órgãos salvas no console!');
    // Aqui você atualizaria o estado original após salvar
    // setOriginalRegrasOrgaos([...regrasOrgaos]);
    setIsDirtyOrgaos(false);
  };
  const filteredOrgaos = mockOrgaos.filter(o =>
    o.nomeCompleto.toLowerCase().includes(searchTermOrgaos.toLowerCase())
  );

  // --- Funções para a seção de Autoridades ---
  const handleRuleChangeAutoridades = (
    autoridadeId: number,
    value: boolean
  ) => {
    const regraExistente = regrasAutoridades.find(
      r => r.autoridadeId === autoridadeId
    );
    let newRegras: RegraAutoridade[];

    if (regraExistente) {
      newRegras = regrasAutoridades.map(r =>
        r.autoridadeId === autoridadeId
          ? { ...r, isAutoridadeJudicial: value }
          : r
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
  };
  const handleSaveChangesAutoridades = () => {
    console.log('Regras de Autoridades salvas:', regrasAutoridades);
    alert('Alterações de Autoridades salvas no console!');
    setIsDirtyAutoridades(false);
  };
  const filteredAutoridades = mockAutoridades.filter(aut =>
    aut.nome.toLowerCase().includes(searchTermAutoridades.toLowerCase())
  );

  // --- Funções para a seção de Assuntos ---
  const handleAssuntoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedAssuntoId(id || null);
  };
  const handleAssuntoDocChange = (tipoDocumentoNome: string) => {
    if (!selectedAssuntoId) return;

    // Encontrar o assunto selecionado
    const assuntoSelecionado = mockAssuntos.find(
      a => a.id === selectedAssuntoId
    );
    if (!assuntoSelecionado) return;

    // Fazer o toggle da associação
    toggleDocumentoAssunto(assuntoSelecionado.nome, tipoDocumentoNome);
    setIsDirtyAssuntos(true);

    // Atualizar informações de sincronização após mudança
    updateSyncInfo();
  };
  const handleSaveChangesAssuntos = () => {
    console.log(
      'Regras de Assuntos/Documentos salvas:',
      documentoAssuntoConfig
    );
    alert('Alterações de Assuntos/Documentos salvas no console!');
    setIsDirtyAssuntos(false);
  };

  // --- Handlers para Regras de Documento ---

  const handleVisibilityChange = (
    key: string,
    section: 'section2' | 'section3' | 'section4',
    checked: boolean
  ) => {
    updateSecaoConfig(key, { [section]: checked });
    setIsDirtyDocumento(true);
  };

  const handleSaveChangesDocumento = () => {
    console.log('Salvar alterações nas regras de documento');
    setIsDirtyDocumento(false);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Regras do Sistema</h2>
        <p className={styles.pageDescription}>
          Nesta área, gerenciaremos as propriedades e os relacionamentos entre
          os cadastros.
        </p>
      </div>

      {/* --- SEÇÃO CADASTROS --- */}
      <div className={styles.sectionCard}>
        <div
          style={getSectionHeaderStyle(
            isCadastrosOpen,
            hoveredSectionHeader === 'cadastros'
          )}
          onClick={handleToggleCadastros}
          onMouseEnter={() => setHoveredSectionHeader('cadastros')}
          onMouseLeave={() => setHoveredSectionHeader(null)}
        >
          <span>Cadastros</span>
          <span>
            {isCadastrosOpen ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </span>
        </div>
        {isCadastrosOpen && (
          <div className={styles.sectionContent}>
            {/* Abas internas para Cadastros */}
            <div className={styles.tabsContainer}>
              <button
                onClick={() => setCadastrosActiveTab('autoridades')}
                className={`${styles.tabButton} ${cadastrosActiveTab === 'autoridades' ? styles.active : ''}`}
              >
                Autoridades
              </button>
              <button
                onClick={() => setCadastrosActiveTab('orgaos')}
                className={`${styles.tabButton} ${cadastrosActiveTab === 'orgaos' ? styles.active : ''}`}
              >
                Órgãos
              </button>
            </div>

            {/* Conteúdo da aba Autoridades */}
            {cadastrosActiveTab === 'autoridades' && (
              <div className={styles.tabContent}>
                <h4 className={styles.subSectionTitle}>
                  Regras para Autoridades
                </h4>

                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Pesquisar autoridades..."
                    value={searchTermAutoridades}
                    onChange={e => setSearchTermAutoridades(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button
                    onClick={() => setSearchTermAutoridades('')}
                    disabled={!searchTermAutoridades.trim()}
                    className={styles.searchClearButton}
                  >
                    <MdSearchOff size={20} />
                  </button>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '70%' }}
                        >
                          Autoridade
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ textAlign: 'center', width: '30%' }}
                        >
                          Autoridade Judicial
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAutoridades.map(autoridade => {
                        const regraAtual = regrasAutoridades.find(
                          r => r.autoridadeId === autoridade.id
                        );
                        return (
                          <tr key={autoridade.id}>
                            <td
                              className={styles.tableCell}
                              style={{ width: '70%' }}
                            >
                              {autoridade.nome} ({autoridade.cargo})
                            </td>
                            <td
                              className={styles.tableCell}
                              style={{ textAlign: 'center', width: '30%' }}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  regraAtual?.isAutoridadeJudicial || false
                                }
                                onChange={e =>
                                  handleRuleChangeAutoridades(
                                    autoridade.id,
                                    e.target.checked
                                  )
                                }
                                className={styles.checkboxInput}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.buttonContainer}>
                  <Button
                    onClick={handleSaveChangesAutoridades}
                    disabled={!isDirtyAutoridades}
                    variant="primary"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            {/* Conteúdo da aba Órgãos */}
            {cadastrosActiveTab === 'orgaos' && (
              <div className={styles.tabContent}>
                <h4 className={styles.subSectionTitle}>Regras para Órgãos</h4>

                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Pesquisar órgãos..."
                    value={searchTermOrgaos}
                    onChange={e => setSearchTermOrgaos(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button
                    onClick={() => setSearchTermOrgaos('')}
                    disabled={!searchTermOrgaos.trim()}
                    className={styles.searchClearButton}
                  >
                    <MdSearchOff size={20} />
                  </button>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '60%' }}
                        >
                          Órgão
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ textAlign: 'center', width: '20%' }}
                        >
                          Solicitante
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ textAlign: 'center', width: '20%' }}
                        >
                          Órgão Judicial
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrgaos.map(orgao => {
                        const regraAtual = regrasOrgaos.find(
                          r => r.orgaoId === orgao.id
                        );
                        return (
                          <tr key={orgao.id}>
                            <td
                              className={styles.tableCell}
                              style={{ width: '60%' }}
                            >
                              {orgao.nomeCompleto}
                            </td>
                            <td
                              className={styles.tableCell}
                              style={{ textAlign: 'center', width: '20%' }}
                            >
                              <input
                                type="checkbox"
                                checked={regraAtual?.isSolicitante || false}
                                onChange={e =>
                                  handleRuleChangeOrgaos(
                                    orgao.id,
                                    'isSolicitante',
                                    e.target.checked
                                  )
                                }
                                className={styles.checkboxInput}
                              />
                            </td>
                            <td
                              className={styles.tableCell}
                              style={{ textAlign: 'center', width: '20%' }}
                            >
                              <input
                                type="checkbox"
                                checked={regraAtual?.isOrgaoJudicial || false}
                                onChange={e =>
                                  handleRuleChangeOrgaos(
                                    orgao.id,
                                    'isOrgaoJudicial',
                                    e.target.checked
                                  )
                                }
                                className={styles.checkboxInput}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.buttonContainer}>
                  <Button
                    onClick={handleSaveChangesOrgaos}
                    disabled={!isDirtyOrgaos}
                    variant="primary"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- SEÇÃO DOCUMENTOS --- */}
      <div className={styles.sectionCard}>
        <div
          style={dynamicStyles.sectionHeader(
            isDocumentosOpen,
            hoveredSectionHeader === 'documentos'
          )}
          onClick={handleToggleDocumentos}
          onMouseEnter={() => setHoveredSectionHeader('documentos')}
          onMouseLeave={() => setHoveredSectionHeader(null)}
        >
          <span>Documentos</span>
          <span>
            {isDocumentosOpen ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </span>
        </div>
        {isDocumentosOpen && (
          <div className={styles.sectionContent}>
            {/* Abas internas para Documentos */}
            <div className={styles.tabsContainer}>
              <button
                onClick={() => setDocumentosActiveTab('assunto-tipo')}
                style={dynamicStyles.tabButton(
                  documentosActiveTab === 'assunto-tipo'
                )}
              >
                Assunto → Tipo de Documento
              </button>
              <button
                onClick={() => setDocumentosActiveTab('visibilidade')}
                style={dynamicStyles.tabButton(
                  documentosActiveTab === 'visibilidade'
                )}
              >
                Visibilidade
              </button>
            </div>

            {/* Conteúdo da aba Assunto → Tipo de Documento */}
            {documentosActiveTab === 'assunto-tipo' && (
              <div className={styles.tabContent}>
                <h4 className={styles.subSectionTitle}>
                  Regras de Assunto x Tipo de Documento
                </h4>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Selecione um Assunto para configurar:
                  </label>
                  <select
                    onChange={handleAssuntoSelect}
                    className={styles.select}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Escolha um assunto...
                    </option>
                    {mockAssuntos.map(assunto => (
                      <option key={assunto.id} value={assunto.id}>
                        {assunto.nome}
                      </option>
                    ))}
                  </select>

                  {selectedAssuntoId && (
                    <div style={{ marginTop: theme.spacing.lg }}>
                      <h5
                        style={{
                          ...dynamicStyles.subSectionTitle,
                          fontSize: theme.fontSize.sm,
                          marginBottom: theme.spacing.md,
                        }}
                      >
                        Tipos de Documentos relacionados:
                      </h5>
                      <div className={styles.checkboxContainer}>
                        {mockTiposDocumentos.map(tipoDoc => {
                          const assuntoSelecionado = mockAssuntos.find(
                            a => a.id === selectedAssuntoId
                          );
                          const isChecked = assuntoSelecionado
                            ? isAssuntoAssociadoAoDocumento(
                                assuntoSelecionado.nome,
                                tipoDoc.nome
                              )
                            : false;
                          return (
                            <label
                              key={tipoDoc.id}
                              className={styles.checkboxLabel}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  handleAssuntoDocChange(tipoDoc.nome)
                                }
                                className={styles.checkboxInput}
                              />
                              <span>{tipoDoc.nome}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.buttonContainer}>
                  <Button
                    onClick={handleSaveChangesAssuntos}
                    disabled={!isDirtyAssuntos}
                    variant="primary"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            {/* Conteúdo da aba Visibilidade */}
            {documentosActiveTab === 'visibilidade' && (
              <div className={styles.tabContent}>
                <h4 className={styles.subSectionTitle}>
                  Configurar Visibilidade de Seções
                </h4>
                <p
                  style={{
                    ...dynamicStyles.pageDescription,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  Defina quais seções devem aparecer para cada combinação
                  Documento → Assunto
                </p>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '25%' }}
                        >
                          Tipo de Documento
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '35%' }}
                        >
                          Assunto
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '13%', textAlign: 'center' }}
                        >
                          Seção 2
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '13%', textAlign: 'center' }}
                        >
                          Seção 3
                        </th>
                        <th
                          className={styles.tableHeader}
                          style={{ width: '14%', textAlign: 'center' }}
                        >
                          Seção 4
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllSecaoConfigs().map(config => (
                        <tr key={config.key}>
                          <td
                            className={styles.tableCell}
                            style={{
                              width: '25%',
                              fontWeight: theme.fontWeight.semibold,
                            }}
                          >
                            {config.tipoDocumento}
                          </td>
                          <td
                            className={styles.tableCell}
                            style={{ width: '35%' }}
                          >
                            {config.assunto || 'SEM_ASSUNTO'}
                          </td>
                          <td
                            className={styles.tableCell}
                            style={{ width: '13%', textAlign: 'center' }}
                          >
                            <input
                              type="checkbox"
                              checked={config.visibility.section2}
                              onChange={e =>
                                handleVisibilityChange(
                                  config.key,
                                  'section2',
                                  e.target.checked
                                )
                              }
                              className={styles.checkboxInput}
                            />
                          </td>
                          <td
                            className={styles.tableCell}
                            style={{ width: '13%', textAlign: 'center' }}
                          >
                            <input
                              type="checkbox"
                              checked={config.visibility.section3}
                              onChange={e =>
                                handleVisibilityChange(
                                  config.key,
                                  'section3',
                                  e.target.checked
                                )
                              }
                              className={styles.checkboxInput}
                            />
                          </td>
                          <td
                            className={styles.tableCell}
                            style={{ width: '14%', textAlign: 'center' }}
                          >
                            <input
                              type="checkbox"
                              checked={config.visibility.section4}
                              onChange={e =>
                                handleVisibilityChange(
                                  config.key,
                                  'section4',
                                  e.target.checked
                                )
                              }
                              className={styles.checkboxInput}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.buttonContainer}>
                  <Button
                    onClick={handleSaveChangesDocumento}
                    disabled={!isDirtyDocumento}
                    variant="primary"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
