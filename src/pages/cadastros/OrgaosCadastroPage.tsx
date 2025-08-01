// src/pages/cadastros/OrgaosCadastroPage.tsx
import { useState } from 'react';
import Button from '../../components/ui/Button';
import { mockOrgaos, type Orgao } from '../../data/mockOrgaos';

// Estilos (reutilizados para consistência)
const tableStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '1.5rem',
  borderCollapse: 'collapse',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
const formStyle: React.CSSProperties = { 
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '1.5rem',
  marginTop: '1.5rem',
  backgroundColor: '#f9f9f9'
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  boxSizing: 'border-box'
};

export default function OrgaosCadastroPage() {
  const [orgaos, setOrgaos] = useState<Orgao[]>(mockOrgaos);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // O estado do formulário agora tem 'nome' e 'sigla'
  const [formData, setFormData] = useState<{ id: number | null; nome: string; sigla: string }>({
    id: null,
    nome: '',
    sigla: '',
  });

  const handleNovoClick = () => {
    setFormData({ id: null, nome: '', sigla: '' });
    setIsFormVisible(true);
  };

  const handleEditClick = (orgao: Orgao) => {
    setFormData({ id: orgao.id, nome: orgao.nome, sigla: orgao.sigla });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
  };
  
  // Função para lidar com a mudança em qualquer campo do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome.trim() === '' || formData.sigla.trim() === '') {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (formData.id !== null) { // Editando
      setOrgaos(orgaos.map(o => o.id === formData.id ? { ...o, nome: formData.nome.trim(), sigla: formData.sigla.trim() } : o));
    } else { // Criando
      const novoOrgao: Orgao = {
        id: Date.now(),
        nome: formData.nome.trim(),
        sigla: formData.sigla.trim(),
      };
      setOrgaos([...orgaos, novoOrgao]);
    }
    
    setIsFormVisible(false);
  };

  const handleDelete = (idParaDeletar: number) => {
    if (window.confirm('Tem certeza que deseja excluir este órgão?')) {
      setOrgaos(orgaos.filter(o => o.id !== idParaDeletar));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Gerenciar Órgãos</h2>
        {!isFormVisible && <Button onClick={handleNovoClick}>Novo Órgão</Button>}
      </div>

      {isFormVisible && (
        <div style={formStyle}>
          <h3>{formData.id ? 'Editar Órgão' : 'Cadastrar Novo Órgão'}</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="nome">Nome</label>
                <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="sigla">Sigla</label>
                <input type="text" id="sigla" name="sigla" value={formData.sigla} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="submit">Salvar</Button>
              <Button onClick={handleCancel} variant="danger">Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>Sigla</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orgaos.map((orgao) => (
            <tr key={orgao.id}>
              <td style={tdStyle}>{orgao.id}</td>
              <td style={tdStyle}>{orgao.nome}</td>
              <td style={tdStyle}>{orgao.sigla}</td>
              <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem' }}>
                <Button onClick={() => handleEditClick(orgao)}>Editar</Button>
                <Button onClick={() => handleDelete(orgao.id)} variant="danger">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}