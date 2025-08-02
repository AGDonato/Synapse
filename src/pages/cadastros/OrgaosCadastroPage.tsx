// src/pages/cadastros/OrgaosCadastroPage.tsx
import { useState, useMemo } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockOrgaos, type Orgao } from '../../data/mockOrgaos';

// Estilos
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '12px 15px', border: '1px solid #dee2e6', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', border: '1px solid #dee2e6' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' };

export default function OrgaosCadastroPage() {
  const [orgaos, setOrgaos] = useState<Orgao[]>(mockOrgaos);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null,
    abreviacao: '',
    nomeCompleto: '',
    enderecamento: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleForm = () => {
    if (!isFormVisible) {
      setFormData({ id: null, abreviacao: '', nomeCompleto: '', enderecamento: '' });
    }
    setIsFormVisible(!isFormVisible);
  };

  const handleEditClick = (item: Orgao) => {
    setFormData({
      id: item.id,
      abreviacao: item.abreviacao,
      nomeCompleto: item.nomeCompleto,
      enderecamento: item.enderecamento
    });
    setIsFormVisible(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nomeCompleto.trim() === '' || formData.abreviacao.trim() === '') {
      alert('Abreviação e Nome Completo são obrigatórios.');
      return;
    }
    if (formData.id !== null) {
      setOrgaos(orgaos.map(o => o.id === formData.id ? { ...formData, id: o.id } : o));
    } else {
      setOrgaos([...orgaos, { ...formData, id: Date.now() }]);
    }
    setIsFormVisible(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este órgão?')) {
      setOrgaos(orgaos.filter(o => o.id !== id));
    }
  };

  const filteredItens = useMemo(() => {
    return orgaos.filter(item =>
      item.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.abreviacao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orgaos, searchTerm]);

  const formComponent = (
    <form onSubmit={handleSave}>
      <h2>{formData.id ? 'Editar Órgão' : 'Cadastrar Novo Órgão'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label>Abreviação *</label>
          <input type="text" name="abreviacao" value={formData.abreviacao} onChange={(e) => setFormData(prev => ({ ...prev, abreviacao: e.target.value }))} style={inputStyle} required />
        </div>
        <div>
          <label>Nome Completo *</label>
          <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))} style={inputStyle} required />
        </div>
      </div>
      <div style={{marginTop: '1rem'}}>
        <label>Endereçamento *</label>
        <textarea name="enderecamento" value={formData.enderecamento} onChange={(e) => setFormData(prev => ({ ...prev, enderecamento: e.target.value }))} style={{...inputStyle, height: '80px'}} required></textarea>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Órgãos"
      searchPlaceholder="Buscar por abreviação ou nome..."
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
            <th style={thStyle}>Abreviação</th>
            <th style={thStyle}>Nome Completo</th>
            <th style={{...thStyle, textAlign: 'center'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredItens.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.abreviacao}</td>
              <td className="truncate-text" title={item.nomeCompleto} style={tdStyle}>{item.nomeCompleto}</td>
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