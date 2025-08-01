// src/pages/DemandasPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockDemandas, type Demanda } from '../data/mockDemandas';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

// --- Estilos para a página ---
const pageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};
const filterContainerStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
};
const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)', // 4 colunas
  gap: '1rem',
};
const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};
const formInputStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '1.5rem',
  borderCollapse: 'collapse',
};
const thStyle: React.CSSProperties = { /* ... */ };
const tdStyle: React.CSSProperties = { /* ... */ };
const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem'
};
// --- Fim dos Estilos ---

export default function DemandasPage() {
  // 1. Criamos um estado para guardar os valores de todos os filtros
  const [filters, setFilters] = useState({
    referencia: '',
    tipo: '',
    situacao: '',
    // Adicione outros filtros aqui
  });

  // Função para atualizar o estado dos filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h2>Lista de Demandas</h2>
        <Link to="/demandas/nova">
          <Button>Nova Demanda</Button>
        </Link>
      </div>

      {/* 2. Seção de Filtros */}
      <div style={filterContainerStyle}>
        <h3 style={{ marginTop: 0 }}>Filtros</h3>
        <div style={filterGridStyle}>
          <div style={formGroupStyle}>
            <label>Número de Referência</label>
            <input type="text" name="referencia" value={filters.referencia} onChange={handleFilterChange} style={formInputStyle} />
          </div>
          <div style={formGroupStyle}>
            <label>Tipo de Demanda</label>
            <select name="tipo" value={filters.tipo} onChange={handleFilterChange} style={formInputStyle}>
              <option value=""></option>
              <option value="Judicial">Judicial</option>
              <option value="Análise Técnica">Análise Técnica</option>
            </select>
          </div>
           <div style={formGroupStyle}>
            <label>Situação</label>
            <select name="situacao" value={filters.situacao} onChange={handleFilterChange} style={formInputStyle}>
                <option value=""></option>
                <option value="Em andamento">Em Andamento</option>
                <option value="Concluída">Finalizado</option>
                <option value="Pendente">Pendente</option>
            </select>
          </div>
          {/* Outros filtros podem ser adicionados aqui */}
        </div>
      </div>

      {/* 3. Tabela de Dados */}
      <table style={tableStyle}>
        <thead>
          <tr>
            {/* Cabeçalhos da tabela baseados no seu HTML */}
            <th style={thStyle}>Protocolo (SGED)</th>
            <th style={thStyle}>Assunto</th>
            <th style={thStyle}>Órgão (Solicitante)</th>
            <th style={thStyle}>Situação</th>
            <th style={thStyle}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {mockDemandas.map((demanda: Demanda) => (
            <tr key={demanda.id}>
              <td style={tdStyle}>{demanda.protocolo}</td>
              <td style={tdStyle}>{demanda.assunto}</td>
              <td style={tdStyle}>{demanda.orgao}</td>
              <td style={tdStyle}><StatusBadge status={demanda.status} /></td>
              <td style={tdStyle}>
                {/* Link para detalhes */}
                <Link to={`/demandas/${demanda.id}`}>Ver Detalhes</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        
      {/* 4. Controles de Paginação (apenas visual por enquanto) */}
      <div style={paginationStyle}>
        <div>
            <label>Itens por página: </label>
            <select>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
            </select>
        </div>
        <div>
            <Button>Anterior</Button>
            <span style={{ margin: '0 1rem' }}>Página 1 de 1</span>
            <Button>Próxima</Button>
        </div>
      </div>
    </div>
  );
}