// src/pages/cadastros/AutoridadesCadastroPage.tsx
import { useState } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockAutoridades, type Autoridade } from '../../data/mockAutoridades';

// Estilos
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '12px 15px', border: '1px solid #dee2e6', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', border: '1px solid #dee2e6' };

export default function AutoridadesCadastroPage() {
  const [autoridades, setAutoridades] = useState<Autoridade[]>(mockAutoridades);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{ id: number | null; nome: string; cargo: string }>({ id: null, nome: '', cargo: '' });

  const handleNovoClick = () => {
    setFormData({ id: null, nome: '', cargo: '' });
    setIsFormVisible(true);
  };
  const handleEditClick = (aut: Autoridade) => {
    setFormData({ id: aut.id, nome: aut.nome, cargo: aut.cargo });
    setIsFormVisible(true);
  };
  const handleCancel = () => { setIsFormVisible(false); };
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

  const formComponent = (
    <form onSubmit={handleSave}>
      <h3>{formData.id ? 'Editar Autoridade' : 'Nova Autoridade'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Nome</label>
          <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} style={{width: '100%', padding: '8px'}}/>
        </div>
        <div>
          <label>Cargo</label>
          <input type="text" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} style={{width: '100%', padding: '8px'}}/>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
        <Button onClick={handleCancel} variant="danger">Cancelar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Autoridades"
      isFormVisible={isFormVisible}
      onNovoClick={handleNovoClick}
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
          {autoridades.map((autoridade) => (
            <tr key={autoridade.id}>
              <td style={tdStyle}>{autoridade.id}</td>
              <td style={tdStyle}>{autoridade.nome}</td>
              <td style={tdStyle}>{autoridade.cargo}</td>
              <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button onClick={() => handleEditClick(autoridade)}>Editar</Button>
                <Button onClick={() => handleDelete(autoridade.id)} variant="danger">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CadastroPageLayout>
  );
}