import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { IoClose, IoDocument, IoFolder, IoSearch } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useDemandas } from '../../../hooks/queries/useDemandas';
import { useDocumentos } from '../../../hooks/queries/useDocumentos';
import { useDebounce } from '../../../pages/HomePage/hooks/useDebounce';
import { getDocumentStatus, getStatusColor } from '../../../utils/documentStatusUtils';
import { getDemandaStatusColor, calculateDemandaStatus } from '../../../utils/statusUtils';
import styles from './GlobalSearch.module.css';

interface SearchResult {
  id: string;
  type: 'demanda' | 'documento';
  title: string;
  subtitle: string;
  description?: string;
  icon: React.ReactElement;
  onClick: () => void;
  badgeText: string;
  badgeColor: string;
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
  const searchRef = useRef<HTMLDivElement>(null);

  // Gerar resultados de busca
  const searchResults = useMemo((): SearchResult[] => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      return [];
    }

    const term = debouncedSearchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // Buscar demandas
    demandas.forEach(demanda => {
      const matches = [
        demanda.sged.toLowerCase().includes(term),
        (demanda.autosAdministrativos || '').toLowerCase().includes(term),
        (demanda.pic || '').toLowerCase().includes(term),
        (demanda.autosJudiciais || '').toLowerCase().includes(term),
        (demanda.autosExtrajudiciais || '').toLowerCase().includes(term),
      ];

      if (matches.some(Boolean)) {
        const status = calculateDemandaStatus(demanda, documentos);
        const statusColor = getDemandaStatusColor(status);

        results.push({
          id: `demanda-${demanda.id}`,
          type: 'demanda',
          title: `SGED: ${demanda.sged}`,
          subtitle: demanda.tipoDemanda,
          description: `Analista: ${demanda.analista}`,
          icon: <IoFolder className={styles.resultIcon} />,
          badgeText: status,
          badgeColor: statusColor,
          onClick: () => {
            navigate(`/demandas/${demanda.id}`);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    // Buscar documentos
    documentos.forEach(documento => {
      const matches = [
        (documento.numeroDocumento || '').toLowerCase().includes(term),
        (documento.numeroAtena || '').toLowerCase().includes(term),
        (documento.codigoRastreio || '').toLowerCase().includes(term),
        (documento.hashMidia || '').toLowerCase().includes(term),
      ];

      // Buscar também nos identificadores das pesquisas
      const pesquisaMatches =
        documento.pesquisas?.some(pesquisa =>
          (pesquisa.identificador || '').toLowerCase().includes(term)
        ) || false;

      matches.push(pesquisaMatches);

      if (matches.some(Boolean)) {
        const status = getDocumentStatus(documento);
        const statusColor = getStatusColor(status);

        // Determinar o assunto correto
        const assuntoDisplay =
          documento.assunto === 'Outros' ? documento.assuntoOutros || 'Outros' : documento.assunto;

        results.push({
          id: `documento-${documento.id}`,
          type: 'documento',
          title: `Doc: ${documento.numeroDocumento || 'S/N'}`,
          subtitle: documento.tipoDocumento,
          description: assuntoDisplay,
          icon: <IoDocument className={styles.resultIcon} />,
          badgeText: status,
          badgeColor: statusColor,
          onClick: () => {
            navigate(`/documentos/${documento.id}`);
            setIsOpen(false);
            setSearchTerm('');
          },
        });
      }
    });

    return results; // Mostrar todos os resultados
  }, [debouncedSearchTerm, demandas, documentos, navigate]);

  // Manipular teclas
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
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
    },
    [isOpen, searchResults, selectedIndex]
  );

  // Resetar selectedIndex quando os resultados mudam
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Abrir/fechar dropdown
  useEffect(() => {
    setIsOpen(searchResults.length > 0 && debouncedSearchTerm.length >= 2);
  }, [searchResults, debouncedSearchTerm]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className={`${styles.searchContainer} ${className || ''}`} ref={searchRef}>
      <div className={styles.searchInputContainer}>
        <IoSearch className={styles.searchIcon} size={20} />
        <input
          type='text'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.searchInput}
          autoComplete='off'
        />
        {searchTerm && (
          <button type='button' onClick={clearSearch} className={styles.clearButton}>
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
                className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
                onClick={result.onClick}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={styles.resultIcon}>{result.icon}</div>
                <div className={styles.resultContent}>
                  <div className={styles.resultTitle}>{result.title}</div>
                  <div className={styles.resultSubtitle}>{result.subtitle}</div>
                  {result.description && (
                    <div className={styles.resultDescription}>{result.description}</div>
                  )}
                </div>
                <div className={styles.resultType} style={{ backgroundColor: result.badgeColor }}>
                  {result.badgeText}
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
