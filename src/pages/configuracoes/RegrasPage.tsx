// src/pages/configuracoes/RegrasPage.tsx
import { useState } from 'react';
import Button from '../../components/ui/Button';

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
import {
  mockRegrasAssuntoDocumento,
  type RegraAssuntoDocumento,
} from '../../data/mockRegrasAssuntoDocumento';

// Estilos
const containerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  marginTop: '2rem',
};
const sectionHeaderStyle: React.CSSProperties = {
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const tableContainerStyle: React.CSSProperties = {
  maxHeight: '400px',
  overflowY: 'auto',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  marginTop: '1rem',
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};
const thStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '12px 15px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
};
const tdStyle: React.CSSProperties = {
  padding: '12px 15px',
  borderBottom: '1px solid #dee2e6',
};
const centerCellStyle: React.CSSProperties = {
  textAlign: 'center',
};

export default function RegrasPage() {
  // --- Estados para a seção de Órgãos ---
  const [regrasOrgaos, setRegrasOrgaos] =
    useState<RegraOrgao[]>(mockRegrasOrgaos);
  const [isOrgaosSectionOpen, setIsOrgaosSectionOpen] = useState(false);
  const [searchTermOrgaos, setSearchTermOrgaos] = useState('');

  // --- Estados para a seção de Autoridades ---
  const [regrasAutoridades, setRegrasAutoridades] = useState<RegraAutoridade[]>(
    mockRegrasAutoridades
  );
  const [isAutoridadesSectionOpen, setIsAutoridadesSectionOpen] =
    useState(false);
  const [searchTermAutoridades, setSearchTermAutoridades] = useState('');

  // --- Estados para a seção de Assuntos ---
  const [isAssuntosSectionOpen, setIsAssuntosSectionOpen] = useState(false);
  const [regrasAssuntoDoc, setRegrasAssuntoDoc] = useState<
    RegraAssuntoDocumento[]
  >(mockRegrasAssuntoDocumento);
  const [selectedAssuntoId, setSelectedAssuntoId] = useState<number | null>(
    null
  );

  // --- Funções para a seção de Órgãos ---
  const handleRuleChangeOrgaos = (
    orgaoId: number,
    ruleName: 'isSolicitante' | 'isOrgaoJudicial',
    value: boolean
  ) => {
    const regraExistente = regrasOrgaos.find((r) => r.orgaoId === orgaoId);
    if (regraExistente) {
      setRegrasOrgaos(
        regrasOrgaos.map((r) =>
          r.orgaoId === orgaoId ? { ...r, [ruleName]: value } : r
        )
      );
    } else {
      const novaRegra: RegraOrgao = {
        orgaoId,
        isSolicitante: ruleName === 'isSolicitante' ? value : false,
        isOrgaoJudicial: ruleName === 'isOrgaoJudicial' ? value : false,
      };
      setRegrasOrgaos([...regrasOrgaos, novaRegra]);
    }
  };
  const handleSaveChangesOrgaos = () => {
    console.log('Regras de Órgãos salvas:', regrasOrgaos);
    alert('Alterações salvas no console!');
  };
  const filteredOrgaos = mockOrgaos.filter((o) =>
    o.nomeCompleto.toLowerCase().includes(searchTermOrgaos.toLowerCase())
  );

  // --- Funções para a seção de Autoridades ---
  const handleRuleChangeAutoridades = (
    autoridadeId: number,
    value: boolean
  ) => {
    const regraExistente = regrasAutoridades.find(
      (r) => r.autoridadeId === autoridadeId
    );
    if (regraExistente) {
      setRegrasAutoridades(
        regrasAutoridades.map((r) =>
          r.autoridadeId === autoridadeId
            ? { ...r, isAutoridadeJudicial: value }
            : r
        )
      );
    } else {
      const novaRegra: RegraAutoridade = {
        autoridadeId,
        isAutoridadeJudicial: value,
      };
      setRegrasAutoridades([...regrasAutoridades, novaRegra]);
    }
  };
  const handleSaveChangesAutoridades = () => {
    console.log('Regras de Autoridades salvas:', regrasAutoridades);
    alert('Alterações salvas no console!');
  };
  const filteredAutoridades = mockAutoridades.filter((aut) =>
    aut.nome.toLowerCase().includes(searchTermAutoridades.toLowerCase())
  );

  // --- Funções para a seção de Assuntos ---
  const handleAssuntoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedAssuntoId(id || null);
  };
  const handleAssuntoDocChange = (tipoDocumentoId: number) => {
    if (!selectedAssuntoId) return;
    const aRegraExiste = regrasAssuntoDoc.some(
      (r) =>
        r.assuntoId === selectedAssuntoId &&
        r.tipoDocumentoId === tipoDocumentoId
    );
    setRegrasAssuntoDoc(
      aRegraExiste
        ? regrasAssuntoDoc.filter(
            (r) =>
              !(
                r.assuntoId === selectedAssuntoId &&
                r.tipoDocumentoId === tipoDocumentoId
              )
          )
        : [
            ...regrasAssuntoDoc,
            { assuntoId: selectedAssuntoId, tipoDocumentoId },
          ]
    );
  };
  const handleSaveChangesAssuntos = () => {
    console.log('Regras de Assuntos/Documentos salvas:', regrasAssuntoDoc);
    alert('Alterações salvas no console!');
  };

  return (
    <div>
      <h2>Regras do Sistema</h2>
      <p>
        Nesta área, gerenciaremos as propriedades e os relacionamentos entre os
        cadastros.
      </p>

      {/* --- SEÇÃO DE REGRAS PARA ÓRGÃOS --- */}
      <div style={containerStyle}>
        <div
          style={sectionHeaderStyle}
          onClick={() => setIsOrgaosSectionOpen(!isOrgaosSectionOpen)}
        >
          <h3>Regras para Órgãos</h3>
          <span>{isOrgaosSectionOpen ? '▲' : '▼'}</span>
        </div>
        {isOrgaosSectionOpen && (
          <div>
            {/* MUDANÇA AQUI: Input de pesquisa e botão de limpar agrupados */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                marginTop: '1rem',
              }}
            >
              <input
                type='text'
                placeholder='Pesquisar órgãos...'
                value={searchTermOrgaos}
                onChange={(e) => setSearchTermOrgaos(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              />
              <Button onClick={() => setSearchTermOrgaos('')} variant='error'>
                Limpar
              </Button>
            </div>

            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Órgão</th>
                    <th style={{ ...thStyle, ...centerCellStyle }}>
                      Solicitante
                    </th>
                    <th style={{ ...thStyle, ...centerCellStyle }}>
                      Órgão Judicial
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrgaos.map((orgao) => {
                    const regraAtual = regrasOrgaos.find(
                      (r) => r.orgaoId === orgao.id
                    );
                    return (
                      <tr key={orgao.id}>
                        <td style={tdStyle}>{orgao.nomeCompleto}</td>
                        <td style={{ ...tdStyle, ...centerCellStyle }}>
                          <input
                            type='checkbox'
                            checked={regraAtual?.isSolicitante || false}
                            onChange={(e) =>
                              handleRuleChangeOrgaos(
                                orgao.id,
                                'isSolicitante',
                                e.target.checked
                              )
                            }
                          />
                        </td>
                        <td style={{ ...tdStyle, ...centerCellStyle }}>
                          <input
                            type='checkbox'
                            checked={regraAtual?.isOrgaoJudicial || false}
                            onChange={(e) =>
                              handleRuleChangeOrgaos(
                                orgao.id,
                                'isOrgaoJudicial',
                                e.target.checked
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <Button onClick={handleSaveChangesOrgaos}>Salvar</Button>
            </div>
          </div>
        )}
      </div>

      {/* --- SEÇÃO DE REGRAS PARA AUTORIDADES --- */}
      <div style={containerStyle}>
        <div
          style={sectionHeaderStyle}
          onClick={() => setIsAutoridadesSectionOpen(!isAutoridadesSectionOpen)}
        >
          <h3>Regras para Autoridades</h3>
          <span>{isAutoridadesSectionOpen ? '▲' : '▼'}</span>
        </div>
        {isAutoridadesSectionOpen && (
          <div>
            {/* MUDANÇA AQUI: Input de pesquisa e botão de limpar agrupados */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                marginTop: '1rem',
              }}
            >
              <input
                type='text'
                placeholder='Pesquisar autoridades...'
                value={searchTermAutoridades}
                onChange={(e) => setSearchTermAutoridades(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              />
              <Button
                onClick={() => setSearchTermAutoridades('')}
                variant='error'
              >
                Limpar
              </Button>
            </div>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Autoridade</th>
                    <th style={{ ...thStyle, ...centerCellStyle }}>
                      Autoridade Judicial
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAutoridades.map((autoridade) => {
                    const regraAtual = regrasAutoridades.find(
                      (r) => r.autoridadeId === autoridade.id
                    );
                    return (
                      <tr key={autoridade.id}>
                        <td style={tdStyle}>
                          {autoridade.nome} ({autoridade.cargo})
                        </td>
                        <td style={{ ...tdStyle, ...centerCellStyle }}>
                          <input
                            type='checkbox'
                            checked={regraAtual?.isAutoridadeJudicial || false}
                            onChange={(e) =>
                              handleRuleChangeAutoridades(
                                autoridade.id,
                                e.target.checked
                              )
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <Button onClick={handleSaveChangesAutoridades}>Salvar</Button>
            </div>
          </div>
        )}
      </div>

      {/* --- SEÇÃO DE REGRAS PARA ASSUNTOS E DOCUMENTOS --- */}
      <div style={containerStyle}>
        <div
          style={sectionHeaderStyle}
          onClick={() => setIsAssuntosSectionOpen(!isAssuntosSectionOpen)}
        >
          <h3>Regras de Assunto x Documento</h3>
          <span>{isAssuntosSectionOpen ? '▲' : '▼'}</span>
        </div>
        {isAssuntosSectionOpen && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontWeight: 'bold' }}>
              Selecione um Assunto para configurar:
            </label>
            <select
              onChange={handleAssuntoSelect}
              style={{ width: '100%', padding: '8px', marginTop: '0.5rem' }}
              defaultValue=''
            >
              <option value='' disabled>
                Escolha um assunto...
              </option>
              {mockAssuntos.map((assunto) => (
                <option key={assunto.id} value={assunto.id}>
                  {assunto.nome}
                </option>
              ))}
            </select>
            {selectedAssuntoId && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4>Tipos de Documentos relacionados:</h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {mockTiposDocumentos.map((tipoDoc) => {
                    const isChecked = regrasAssuntoDoc.some(
                      (r) =>
                        r.assuntoId === selectedAssuntoId &&
                        r.tipoDocumentoId === tipoDoc.id
                    );
                    return (
                      <label key={tipoDoc.id}>
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={() => handleAssuntoDocChange(tipoDoc.id)}
                        />{' '}
                        {tipoDoc.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <Button onClick={handleSaveChangesAssuntos}>Salvar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
