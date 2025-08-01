// src/pages/CadastrosPage.tsx
import { Link } from 'react-router-dom';

// Estilo para os cards de link
const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1.5rem',
  marginBottom: '1rem',
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  backgroundColor: '#fff',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

export default function CadastrosPage() {
  return (
    <div>
      <h2>Central de Cadastros</h2>
      <p>Selecione uma das opções abaixo para gerenciar.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <Link to="/cadastros/assuntos" style={cardStyle}>
          <strong>Gerenciar Assuntos</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova os assuntos das demandas.</p>
        </Link>
        
        <Link to="/cadastros/orgaos" style={cardStyle}>
          <strong>Gerenciar Órgãos</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova os órgãos solicitantes.</p>
        </Link>

        <Link to="/cadastros/autoridades" style={cardStyle}>
          <strong>Gerenciar Autoridades</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova autoridades.</p>
        </Link>

        <Link to="/cadastros/tipos-documentos" style={cardStyle}>
          <strong>Gerenciar Tipos de Documentos</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova os tipos de documentos.</p>
        </Link>

        <Link to="/cadastros/distribuidores" style={cardStyle}>
          <strong>Gerenciar Distribuidores</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova distribuidores.</p>
        </Link>

        <Link to="/cadastros/provedores" style={cardStyle}>
          <strong>Gerenciar Provedores</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova provedores de serviço.</p>
        </Link>

        <Link to="/cadastros/tipos-demandas" style={cardStyle}>
          <strong>Gerenciar Tipos de Demandas</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova os tipos de demandas.</p>
        </Link>

        <Link to="/cadastros/tipos-identificadores" style={cardStyle}>
          <strong>Gerenciar Tipos de Identificadores</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova os tipos de identificadores.</p>
        </Link>

        <Link to="/cadastros/tipos-midias" style={cardStyle}>
          <strong>Gerenciar Tipos de Mídias</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>Adicione, edite ou remova os tipos de mídias.</p>
        </Link>
      </div>
    </div>
  );
}