import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IoClose, IoDocument, IoFolder, IoPersonOutline, IoSearch } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useDemandas } from '../../../hooks/queries/useDemandas';
import { useDocumentos } from '../../../hooks/queries/useDocumentos';
import { useDebounce } from '../../../pages/HomePage/hooks/useDebounce';
import styles from './GlobalSearch.module.css';

interface SearchResult {
  id: string;
  type: 'demanda' | 'documento' | 'analista';
  title: string;
  subtitle: string;
  description?: string;
  icon: React.ReactElement;
  onClick: () => void;
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = 'Buscar demandas, documentos...',
  className,
}) => {
  const navigate = useNavigate();
  const { demandas } = useDemandas();
  const { documentos } = useDocumentos();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  // Gerar resultados de busca
  const searchResults = useMemo((): SearchResult[] => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {return [];}

    const term = debouncedSearchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // Buscar demandas
    demandas.forEach((demanda) => {
      const matches = [
        demanda.sged.toLowerCase().includes(term),
        demanda.analista.toLowerCase().includes(term),
        (demanda.autosAdministrativos || '').toLowerCase().includes(term),
        (demanda.autosJudiciais || '').toLowerCase().includes(term),
        (demanda.pic || '').toLowerCase().includes(term),
      ];

      if (matches.some(Boolean)) {
        results.push({
          id: `demanda-${demanda.id}`,
          type: 'demanda',
          title: `SGED: ${demanda.sged}`,
          subtitle: `Analista: ${demanda.analista}`,
          description: `Status: ${demanda.status}`,
          icon: <IoFolder className={styles.resultIcon} />,
          onClick: () => {
            navigate(`/demandas/${demanda.id}`);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    // Buscar documentos
    documentos.forEach((documento) => {
      const demandaRelacionada = demandas.find(d => d.id === documento.demandaId);
      const matches = [
        (documento.numeroDocumento || '').toLowerCase().includes(term),
        documento.tipoDocumento.toLowerCase().includes(term),
        (documento.destinatario || '').toLowerCase().includes(term),
        (documento.codigoRastreio || '').toLowerCase().includes(term),
        (documento.numeroAtena || '').toLowerCase().includes(term),
        (demandaRelacionada?.sged || '').toLowerCase().includes(term),
      ];

      if (matches.some(Boolean)) {
        results.push({
          id: `documento-${documento.id}`,
          type: 'documento',
          title: `Doc: ${documento.numeroDocumento || 'S/N'}`,
          subtitle: documento.tipoDocumento,
          description: `SGED: ${demandaRelacionada?.sged || 'N/A'} • Destinatário: ${documento.destinatario || 'N/A'}`,
          icon: <IoDocument className={styles.resultIcon} />,
          onClick: () => {
            navigate(`/documentos/${documento.id}`);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    // Buscar analistas únicos
    const analistas = Array.from(new Set(demandas.map(d => d.analista)));
    analistas.forEach((analista) => {
      if (analista.toLowerCase().includes(term)) {
        const demandasDoAnalista = demandas.filter(d => d.analista === analista);
        results.push({
          id: `analista-${analista}`,
          type: 'analista',
          title: analista,
          subtitle: 'Analista',
          description: `${demandasDoAnalista.length} demanda(s)`,
          icon: <IoPersonOutline className={styles.resultIcon} />,
          onClick: () => {
            // Navegar para página de demandas com filtro do analista
            navigate(`/demandas?analista=${encodeURIComponent(analista)}`);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    return results.slice(0, 8); // Limitar a 8 resultados
  }, [debouncedSearchTerm, demandas, documentos, navigate]);

  // Manipular teclas
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {return;}

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          searchResults[selectedIndex].onClick();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, searchResults, selectedIndex]);

  // Resetar selectedIndex quando os resultados mudam
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Abrir/fechar dropdown
  useEffect(() => {
    setIsOpen(searchResults.length > 0 && debouncedSearchTerm.length >= 2);
  }, [searchResults, debouncedSearchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className={`${styles.searchContainer} ${className || ''}`}>
      <div className={styles.searchInputContainer}>
        <IoSearch className={styles.searchIcon} size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.searchInput}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className={styles.clearButton}
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={styles.searchResults}>
          <div className={styles.resultsHeader}>
            <span>Resultados da busca</span>
            <span className={styles.resultCount}>{searchResults.length} resultado(s)</span>
          </div>
          
          <ul className={styles.resultsList}>
            {searchResults.map((result, index) => (
              <li
                key={result.id}
                className={`${styles.resultItem} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={result.onClick}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={styles.resultIcon}>
                  {result.icon}
                </div>
                <div className={styles.resultContent}>
                  <div className={styles.resultTitle}>{result.title}</div>
                  <div className={styles.resultSubtitle}>{result.subtitle}</div>
                  {result.description && (
                    <div className={styles.resultDescription}>
                      {result.description}
                    </div>
                  )}
                </div>
                <div className={styles.resultType}>
                  {result.type}
                </div>
              </li>
            ))}
          </ul>
          
          <div className={styles.searchTips}>
            <span>Use ↑↓ para navegar, Enter para selecionar, Esc para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};