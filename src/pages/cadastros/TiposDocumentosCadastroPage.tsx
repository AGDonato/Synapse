// src/pages/cadastros/TiposDocumentosCadastroPage.tsx
import { useState } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockTiposDocumentos, type TipoDocumento } from '../../data/mockTiposDocumentos';

// Estilos
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};
const thStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '12px 15px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 15px',
  border: '1px solid #dee2e6',
};

export default function TiposDocumentosCadastroPage() {
  const [tipos, setTipos] = useState<TipoDocumento[]>(mockTiposDocumentos);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{ id: number | null; nome: string }>({ id: null, nome: '' });

  // Funções CRUD (exatamente o mesmo padrão da página de Assuntos)
  const handleNovoClick = () => {
    setFormData({ id: null, nome: '' });
    setIsFormVisible(true);
  };
  const handleEditClick = (tipo: TipoDocumento) => {
    setFormData({ id: tipo.id, nome: tipo.nome });
    setIsFormVisible(true);
  };
  const handleCancel = () => { setIsFormVisible(false); };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome.trim() === '') return;
    if (formData.id !== null) {
      setTipos(tipos.map(t => t.id === formData.id ? { ...t, nome: formData.nome.trim() } : t));
    } else {
      setTipos([...tipos, { id: Date.now(), nome: formData.nome.trim() }]);
    }
    setIsFormVisible(false);
  };
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza?')) {
      setTipos(tipos.filter(t => t.id !== id));
    }
  };

  const formComponent = (
    <form onSubmit={handleSave}>
      <h3>{formData.id ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}</h3>
      <input
        type="text"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        style={{ width: '100%', padding: '8px' }}
        required
      />
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
        <Button onClick={handleCancel} variant="danger">Cancelar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Tipos de Documentos"
      isFormVisible={isFormVisible}
      onNovoClick={handleNovoClick}
      formComponent={formComponent}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nome</th>
            <th style={{...thStyle, textAlign: 'center'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((tipo) => (
            <tr key={tipo.id}>
              <td style={tdStyle}>{tipo.id}</td>
              <td style={tdStyle}>{tipo.nome}</td>
              <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button onClick={() => handleEditClick(tipo)}>Editar</Button>
                <Button onClick={() => handleDelete(tipo.id)} variant="danger">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CadastroPageLayout>
  );
}
