// src/pages/cadastros/ProvedoresCadastroPage.tsx
import { useState, useMemo } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockProvedores, type Provedor } from '../../data/mockProvedores';

// Estilos
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '12px 15px', border: '1px solid #dee2e6', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', border: '1px solid #dee2e6' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' };

export default function ProvedoresCadastroPage() {
  const [provedores, setProvedores] = useState<Provedor[]>(mockProvedores);
  const [formData, setFormData] = useState<{ id: number | null; nomeFantasia: string; razaoSocial: string; enderecamento: string }>({
    id: null, nomeFantasia: '', razaoSocial: '', enderecamento: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleToggleForm = () => {
    if (!isFormVisible) {
      setFormData({ id: null, nomeFantasia: '', razaoSocial: '', enderecamento: '' });
    }
    setIsFormVisible(!isFormVisible);
  };

  const handleEditClick = (item: Provedor) => {
    setFormData({
      id: item.id,
      nomeFantasia: item.nomeFantasia,
      razaoSocial: item.razaoSocial,
      enderecamento: item.enderecamento,
    });
    setIsFormVisible(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nomeFantasia.trim() === '' || formData.razaoSocial.trim() === '') {
        alert('Nome Fantasia e Razão Social são obrigatórios.');
        return;
    }

    if (formData.id !== null) {
      setProvedores(provedores.map(p => p.id === formData.id ? { ...formData, id: p.id } : p));
    } else {
      setProvedores([...provedores, { ...formData, id: Date.now() }]);
    }
    setIsFormVisible(false);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza?')) {
      setProvedores(provedores.filter(p => p.id !== id));
    }
  };

  const filteredProvedores = useMemo(() => {
    return provedores.filter(p =>
      p.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [provedores, searchTerm]);

  const formComponent = (
    <form onSubmit={handleSave}>
      <h2>{formData.id ? 'Editar Provedor' : 'Cadastrar Novo Provedor'}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" name="nomeFantasia" placeholder="Nome Fantasia" value={formData.nomeFantasia} onChange={(e) => setFormData(prev => ({...prev, nomeFantasia: e.target.value}))} style={inputStyle} required />
        <input type="text" name="razaoSocial" placeholder="Razão Social" value={formData.razaoSocial} onChange={(e) => setFormData(prev => ({...prev, razaoSocial: e.target.value}))} style={inputStyle} required />
        <textarea name="enderecamento" placeholder="Endereçamento" value={formData.enderecamento} onChange={(e) => setFormData(prev => ({...prev, enderecamento: e.target.value}))} style={{...inputStyle, height: '80px'}} required></textarea>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Provedores"
      searchPlaceholder="Buscar por nome fantasia ou razão social..."
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
            <th style={thStyle}>Nome Fantasia</th>
            <th style={thStyle}>Razão Social</th>
            <th style={{...thStyle, textAlign: 'center'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredProvedores.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.nomeFantasia}</td>
              <td className="truncate-text" title={item.razaoSocial} style={tdStyle}>{item.razaoSocial}</td>
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