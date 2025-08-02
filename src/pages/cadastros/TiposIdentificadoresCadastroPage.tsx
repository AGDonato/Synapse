// src/pages/cadastros/TiposIdentificadoresCadastroPage.tsx
import { useState, useMemo } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockTiposIdentificadores, type TipoIdentificador } from '../../data/mockTiposIdentificadores';

// Estilos
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '12px 15px', border: '1px solid #dee2e6', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', border: '1px solid #dee2e6' };

export default function TiposIdentificadoresCadastroPage() {
  const [itens, setItens] = useState<TipoIdentificador[]>(mockTiposIdentificadores);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{ id: number | null; nome: string }>({ id: null, nome: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Funções de manipulação de estado
  const handleToggleForm = () => {
    if (!isFormVisible) {
      setFormData({ id: null, nome: '' });
    }
    setIsFormVisible(!isFormVisible);
  };

  const handleEditClick = (item: TipoIdentificador) => {
    setFormData({ id: item.id, nome: item.nome });
    setIsFormVisible(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome.trim() === '') return;
    if (formData.id !== null) {
      setItens(itens.map(i => i.id === formData.id ? { ...i, nome: formData.nome.trim() } : i));
    } else {
      setItens([...itens, { id: Date.now(), nome: formData.nome.trim() }]);
    }
    setIsFormVisible(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza?')) {
      setItens(itens.filter(i => i.id !== id));
    }
  };

  // Lógica de filtro
  const filteredItens = useMemo(() => {
    return itens.filter(item =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [itens, searchTerm]);

  // Componente do formulário
  const formComponent = (
    <form onSubmit={handleSave}>
      <h2>{formData.id ? 'Editar Tipo de Identificador' : 'Novo Tipo de Identificador'}</h2>
      <input
        type="text"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        style={{ width: '100%', padding: '8px' }}
        required
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Tipos de Identificadores"
      searchPlaceholder="Buscar por tipo de identificador..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSearch={() => setSearchTerm('')}
      isFormVisible={isFormVisible}
      onToggleForm={handleToggleForm}
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
          {filteredItens.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.id}</td>
              <td style={tdStyle}>{item.nome}</td>
              <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button onClick={() => handleEditClick(item)}>Editar</Button>
                <Button onClick={() => handleDelete(item.id)} variant="danger">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CadastroPageLayout>
  );
}