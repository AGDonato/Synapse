// src/pages/cadastros/AssuntosCadastroPage.tsx
import { useState } from 'react';
import Button from '../../components/ui/Button';
import { mockAssuntos, type Assunto } from '../../data/mockAssuntos';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';

// Estilos para a tabela
const tableStyle: React.CSSProperties = {
  width: '100%',
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

export default function AssuntosCadastroPage() {
  const [assuntos, setAssuntos] = useState<Assunto[]>(mockAssuntos);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{ id: number | null; nome: string }>({ id: null, nome: '' });

  const handleNovoClick = () => {
    setFormData({ id: null, nome: '' });
    setIsFormVisible(true);
  };

  const handleEditClick = (assunto: Assunto) => {
    setFormData({ id: assunto.id, nome: assunto.nome });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome.trim() === '') return alert('O nome do assunto é obrigatório.');

    if (formData.id !== null) { // Editando
      setAssuntos(assuntos.map(a => a.id === formData.id ? { ...a, nome: formData.nome.trim() } : a));
    } else { // Criando
      const novoAssunto: Assunto = { id: Date.now(), nome: formData.nome.trim() };
      setAssuntos([...assuntos, novoAssunto]);
    }
    setIsFormVisible(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza?')) {
      setAssuntos(assuntos.filter(a => a.id !== id));
    }
  };

  const formComponent = (
    <form onSubmit={handleSave}>
      <h3>{formData.id ? 'Editar Assunto' : 'Cadastrar Novo Assunto'}</h3>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Assunto</label>
        <input
          type="text"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          required
        />
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button type="submit">Salvar</Button>
        <Button onClick={handleCancel} variant="danger">Cancelar</Button>
      </div>
    </form>
  );

  return (
    <CadastroPageLayout
      title="Gerenciar Assuntos"
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
          {assuntos.map((assunto) => (
            <tr key={assunto.id}>
              <td style={tdStyle}>{assunto.id}</td>
              <td style={tdStyle}>{assunto.nome}</td>
              <td style={{ ...tdStyle, display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button onClick={() => handleEditClick(assunto)}>Editar</Button>
                <Button onClick={() => handleDelete(assunto.id)} variant="danger">Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CadastroPageLayout>
  );
}