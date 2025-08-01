// src/pages/cadastros/ProvedoresCadastroPage.tsx
import { useState } from 'react';
import Button from '../../components/ui/Button';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockProvedores, type Provedor } from '../../data/mockProvedores';

// Estilos
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8f9fa', padding: '12px 15px', border: '1px solid #dee2e6', textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 15px', border: '1px solid #dee2e6' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', boxSizing: 'border-box' };

export default function ProvedoresCadastroPage() {
  const [provedores, setProvedores] = useState<Provedor[]>(mockProvedores);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{ id: number | null; nomeFantasia: string; razaoSocial: string; enderecamento: string }>({
    id: null,
    nomeFantasia: '',
    razaoSocial: '',
    enderecamento: '',
  });

  const handleNovoClick = () => {
    setFormData({ id: null, nomeFantasia: '', razaoSocial: '', enderecamento: '' });
    setIsFormVisible(true);
  };
  const handleEditClick = (item: Provedor) => {
    setFormData({ id: item.id, nomeFantasia: item.nomeFantasia, razaoSocial: item.razaoSocial, enderecamento: item.enderecamento });
    setIsFormVisible(true);
  };
  const handleCancel = () => { setIsFormVisible(false); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nomeFantasia.trim() === '' || formData.razaoSocial.trim() === '') return;
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

  const formComponent = (
    <form onSubmit={handleSave}>
      <h3>{formData.id ? 'Editar Provedor' : 'Novo Provedor'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" name="nomeFantasia" placeholder="Nome Fantasia" value={formData.nomeFantasia} onChange={handleChange} style={inputStyle} required />
        <input type="text" name="razaoSocial" placeholder="Razão Social" value={formData.razaoSocial} onChange={handleChange} style={inputStyle} required />
        <textarea name="enderecamento" placeholder="Endereçamento" value={formData.enderecamento} onChange={handleChange} style={{...inputStyle, height: '80px'}} required></textarea>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button type="submit">Salvar</Button>
        <Button onClick={handleCancel} variant="danger">Cancelar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Provedores"
      isFormVisible={isFormVisible}
      onNovoClick={handleNovoClick}
      formComponent={formComponent}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nome Fantasia</th>
            <th style={thStyle}>Razão Social</th>
            <th style={{...thStyle, textAlign: 'center'}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {provedores.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{item.id}</td>
              <td style={tdStyle}>{item.nomeFantasia}</td>
              <td style={tdStyle}>{item.razaoSocial}</td>
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