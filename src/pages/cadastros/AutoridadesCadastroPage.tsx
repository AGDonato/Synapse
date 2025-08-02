// src/pages/cadastros/AutoridadesCadastroPage.tsx
import { useState, useMemo } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockAutoridades, type Autoridade } from '../../data/mockAutoridades';

// Estilos
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '12px 15px', border: '1px solid #dee2e6', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', border: '1px solid #dee2e6' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' };

export default function AutoridadesCadastroPage() {
  const [autoridades, setAutoridades] = useState<Autoridade[]>(mockAutoridades);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{ id: number | null; nome: string; cargo: string }>({ id: null, nome: '', cargo: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleForm = () => {
    if (!isFormVisible) {
      setFormData({ id: null, nome: '', cargo: '' });
    }
    setIsFormVisible(!isFormVisible);
  };

  const handleEditClick = (item: Autoridade) => {
    setFormData({ id: item.id, nome: item.nome, cargo: item.cargo });
    setIsFormVisible(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome.trim() === '' || formData.cargo.trim() === '') return;

    if (formData.id !== null) {
      setAutoridades(autoridades.map(a => a.id === formData.id ? { ...a, nome: formData.nome.trim(), cargo: formData.cargo.trim() } : a));
    } else {
      setAutoridades([...autoridades, { id: Date.now(), nome: formData.nome.trim(), cargo: formData.cargo.trim() }]);
    }
    setIsFormVisible(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza?')) {
      setAutoridades(autoridades.filter(a => a.id !== id));
    }
  };

  const filteredItens = useMemo(() => {
    return autoridades.filter(item =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [autoridades, searchTerm]);

  const formComponent = (
    <form onSubmit={handleSave}>
      <h2>{formData.id ? 'Editar Autoridade' : 'Nova Autoridade'}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Nome</label>
          <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} required/>
        </div>
        <div>
          <label>Cargo</label>
          <input type="text" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} style={inputStyle} required/>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Autoridades"
      searchPlaceholder="Buscar por nome ou cargo..."
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
            <th style={thStyle}>Cargo</th>
            <th style={{...thStyle, textAlign: 'center'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredItens.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.id}</td>
              <td style={tdStyle}>{item.nome}</td>
              <td style={tdStyle}>{item.cargo}</td>
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