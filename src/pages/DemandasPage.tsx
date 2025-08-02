// src/pages/DemandasPage.tsx
import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemandas } from '../contexts/DemandasContext';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { mockTiposDemandas } from '../data/mockTiposDemandas';
import { mockDistribuidores } from '../data/mockDistribuidores';
import { type Demanda } from '../data/mockDemandas';

import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

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
  marginBottom: '1.5rem',
};
const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
};
const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};
const formInputStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  width: '100%',
  boxSizing: 'border-box'
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};
const thStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '12px 15px',
  border: '1px solid #dee2e6',
  textAlign: 'left',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 15px',
  borderBottom: '1px solid #dee2e6',
};
const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem'
};
const trHoverStyle: React.CSSProperties = {
  cursor: 'pointer',
};

const initialFilterState = {
  referencia: '',
  tipoDemanda: '',
  solicitante: '',
  situacao: '',
  analista: '',
  documentos: '',
  periodoInicial: [null, null] as [Date | null, Date | null],
  periodoFinal: [null, null] as [Date | null, Date | null],
};

export default function DemandasPage() {
  const { demandas } = useDemandas();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setFilters(initialFilterState);
    setCurrentPage(1);
  };
  
  const filteredDemandas = useMemo(() => {
    const [dtIniDe, dtIniAte] = filters.periodoInicial;
    const [dtFimDe, dtFimAte] = filters.periodoFinal;

    return demandas.filter(demanda => {
      const termoBuscaReferencia = filters.referencia.toLowerCase();

      if (filters.situacao && demanda.status !== filters.situacao) return false;
      if (filters.tipoDemanda && demanda.tipoDemanda !== filters.tipoDemanda) return false;
      if (filters.analista && demanda.analista !== filters.analista) return false;
      if (filters.solicitante && demanda.orgao !== filters.solicitante) return false;
      if (filters.referencia && 
          !demanda.sged.toLowerCase().includes(termoBuscaReferencia) &&
          !demanda.autosAdministrativos.toLowerCase().includes(termoBuscaReferencia)) {
        return false;
      }
      
      const [anoIni, mesIni, diaIni] = demanda.dataInicial.split('-').map(Number);
      const dataInicialDemanda = new Date(anoIni, mesIni - 1, diaIni);
      if (dtIniDe) {
        const inicioPeriodo = new Date(dtIniDe);
        inicioPeriodo.setHours(0, 0, 0, 0);
        if (dataInicialDemanda < inicioPeriodo) return false;
      }
      if (dtIniAte) {
        const fimPeriodo = new Date(dtIniAte);
        fimPeriodo.setHours(23, 59, 59, 999);
        if (dataInicialDemanda > fimPeriodo) return false;
      }
      
      if (demanda.dataFinal) {
        const [anoFim, mesFim, diaFim] = demanda.dataFinal.split('-').map(Number);
        const dataFinalDemanda = new Date(anoFim, mesFim - 1, diaFim);
        if (dtFimDe) {
          const inicioPeriodoFim = new Date(dtFimDe);
          inicioPeriodoFim.setHours(0, 0, 0, 0);
          if (dataFinalDemanda < inicioPeriodoFim) return false;
        }
        if (dtFimAte) {
          const fimPeriodoFim = new Date(dtFimAte);
          fimPeriodoFim.setHours(23, 59, 59, 999);
          if (dataFinalDemanda > fimPeriodoFim) return false;
        }
      } else {
        if (dtFimDe || dtFimAte) return false;
      }
      return true;
    });
  }, [demandas, filters]);

  const solicitantesUnicos = useMemo(() => {
    const todosOsSolicitantes = demandas.map(d => d.orgao);
    return [...new Set(todosOsSolicitantes)].map(s => ({ id: s, nome: s }));
  }, [demandas]);

  const totalPages = Math.ceil(filteredDemandas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDemandas.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleRowClick = (demandaId: number) => { navigate(`/demandas/${demandaId}`); };

  return (
    <div>
      <div style={pageHeaderStyle}>
        <h2>Lista de Demandas</h2>
        <Link to="/demandas/nova"><Button>Nova Demanda</Button></Link>
      </div>
      <div style={filterContainerStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Filtros</h3>
        <div style={filterGridStyle}>
          <div style={formGroupStyle}><label>Número de Referência</label><input type="text" name="referencia" value={filters.referencia} onChange={handleFilterChange} style={formInputStyle} /></div>
          <div style={formGroupStyle}><label>Tipo de Demanda</label><select name="tipoDemanda" value={filters.tipoDemanda} onChange={handleFilterChange} style={formInputStyle}><option value=""></option>{mockTiposDemandas.map(t => (<option key={t.id} value={t.nome}>{t.nome}</option>))}</select></div>
          <div style={formGroupStyle}><label>Solicitante</label><select name="solicitante" value={filters.solicitante} onChange={handleFilterChange} style={formInputStyle}><option value=""></option>{solicitantesUnicos.map(s => (<option key={s.id} value={s.nome}>{s.nome}</option>))}</select></div>
          <div style={formGroupStyle}><label>Situação</label><select name="situacao" value={filters.situacao} onChange={handleFilterChange} style={formInputStyle}><option value=""></option><option value="Pendente">Pendente</option><option value="Em andamento">Em Andamento</option><option value="Concluída">Concluída</option></select></div>
          <div style={formGroupStyle}><label>Analista</label><select name="analista" value={filters.analista} onChange={handleFilterChange} style={formInputStyle}><option value=""></option>{mockDistribuidores.map(a => (<option key={a.id} value={a.nome}>{a.nome}</option>))}</select></div>
          <div style={formGroupStyle}><label>Documentos</label><input type="text" name="documentos" value={filters.documentos} onChange={handleFilterChange} style={formInputStyle} /></div>
          <div style={formGroupStyle}>
            <label>Período - Data Inicial</label>
            <DatePicker selectsRange={true} startDate={filters.periodoInicial[0]} endDate={filters.periodoInicial[1]} onChange={(update: [Date | null, Date | null]) => {setFilters(prev => ({ ...prev, periodoInicial: update }));}} isClearable={true} dateFormat="dd/MM/yyyy" placeholderText="Selecione o período" className="form-input" locale="pt-BR" />
          </div>
          <div style={formGroupStyle}>
            <label>Período - Data Final</label>
            <DatePicker selectsRange={true} startDate={filters.periodoFinal[0]} endDate={filters.periodoFinal[1]} onChange={(update: [Date | null, Date | null]) => {setFilters(prev => ({ ...prev, periodoFinal: update }));}} isClearable={true} dateFormat="dd/MM/yyyy" placeholderText="Selecione o período" className="form-input" locale="pt-BR" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button onClick={handleClearFilters} variant="danger">Limpar Filtros</Button>
        </div>
        <style>{`.form-input { padding: 8px; border-radius: 4px; border: 1px solid #ccc; width: 100%; box-sizing: border-box; }`}</style>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>SGED</th>
            <th style={thStyle}>Tipo de Demanda</th>
            <th style={thStyle}>Autos Administrativos</th>
            <th style={thStyle}>Orgão</th>
            <th style={thStyle}>Analista</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Data Inicial</th>
            <th style={thStyle}>Data Final</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((demanda: Demanda) => (
            <tr key={demanda.id} onClick={() => handleRowClick(demanda.id)} style={trHoverStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}>
              <td style={tdStyle}>{demanda.sged}</td>
              <td style={tdStyle}>{demanda.tipoDemanda}</td>
              <td style={tdStyle}>{demanda.autosAdministrativos}</td>
              <td style={tdStyle}>{demanda.orgao}</td>
              <td style={tdStyle}>{demanda.analista}</td>
              <td style={tdStyle}><StatusBadge status={demanda.status} /></td>
              <td style={tdStyle}>{demanda.dataInicial}</td>
              <td style={tdStyle}>{demanda.dataFinal || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={paginationStyle}>
        <div>
          <label>Itens por página: </label>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div>
          <Button onClick={handlePrevPage} disabled={currentPage === 1}>Anterior</Button>
          <span style={{ margin: '0 1rem' }}>Página {currentPage} de {totalPages || 1}</span>
          <Button onClick={handleNextPage} disabled={currentPage >= totalPages}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}