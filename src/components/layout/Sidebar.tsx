// src/components/layout/Sidebar.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Estilos para os componentes do menu
const sidebarStyle: React.CSSProperties = {
  width: '260px',
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  height: 'calc(100vh - 61px)', // Altura da tela menos a altura do header
  borderRight: '1px solid #e2e8f0',
  overflowY: 'auto', // Adiciona scroll se o menu for muito grande
};

const navListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 15px',
  textDecoration: 'none',
  color: '#344054',
  borderRadius: '6px',
  marginBottom: '4px',
  fontWeight: 500,
  fontSize: '14px',
};

const sectionLabelStyle: React.CSSProperties = {
  ...linkStyle,
  cursor: 'pointer',
  justifyContent: 'space-between',
  fontWeight: 'bold',
};

const subMenuContainerStyle: React.CSSProperties = {
  paddingLeft: '20px',
  borderLeft: '1px solid #e2e8f0',
  marginLeft: '15px',
  marginTop: '4px',
};


export default function Sidebar() {
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <aside style={sidebarStyle}>
      <nav>
        <ul style={navListStyle}>
          <li><Link to="/" style={linkStyle}>HOME</Link></li>
          <li><Link to="/demandas" style={linkStyle}>DEMANDAS</Link></li>
          <li><Link to="/oficios" style={linkStyle}>DOCUMENTOS</Link></li>

          {/* Seção de Relatórios */}
          <li
            style={sectionLabelStyle} 
            onClick={() => setRelatoriosOpen(!relatoriosOpen)}
          >
            <span>RELATÓRIOS</span>
            <span>{relatoriosOpen ? '−' : '+'}</span>
          </li>
          {relatoriosOpen && (
            <div style={subMenuContainerStyle}>
              <Link to="/relatorios/anual" style={linkStyle}>Anual</Link>
              <Link to="/relatorios/corregedoria" style={linkStyle}>Corregedoria</Link>
            </div>
          )}

          {/* Seção de Cadastros */}
          <li 
            style={sectionLabelStyle} 
            onClick={() => setCadastrosOpen(!cadastrosOpen)}
          >
            <span>CADASTROS</span>
            <span>{cadastrosOpen ? '−' : '+'}</span>
          </li>
          {cadastrosOpen && (
            <div style={subMenuContainerStyle}>
              <Link to="/cadastros/assuntos" style={linkStyle}>Assuntos</Link>
              <Link to="/cadastros/autoridades" style={linkStyle}>Autoridades</Link>
              <Link to="/cadastros/orgaos" style={linkStyle}>Órgãos</Link>
              <Link to="/cadastros/tipos-documentos" style={linkStyle}>Tipos de Documentos</Link>
              <Link to="/cadastros/distribuidores" style={linkStyle}>Distribuidores</Link>
              <Link to="/cadastros/provedores" style={linkStyle}>Provedores</Link>
              <Link to="/cadastros/tipos-demandas" style={linkStyle}>Tipos de Demandas</Link>
              <Link to="/cadastros/tipos-identificadores" style={linkStyle}>Tipos de Identificadores</Link>
              <Link to="/cadastros/tipos-midias" style={linkStyle}>Tipos de Mídias</Link>
            </div>
          )}

          {/* Seção de Configurações */}
          <li style={sectionLabelStyle} onClick={() => setConfigOpen(!configOpen)}>
            <span>CONFIGURAÇÕES</span>
            <span>{configOpen ? '−' : '+'}</span>
          </li>
          {configOpen && (
            <div style={subMenuContainerStyle}>
              <Link to="/configuracoes/regras" style={linkStyle}>Regras</Link>
              <Link to="/configuracoes/sistema" style={linkStyle}>Sistema</Link>
            </div>
          )}
        </ul>
      </nav>
    </aside>
  );
}