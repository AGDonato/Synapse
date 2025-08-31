// src/components/charts/ProviderFilters.tsx
import React from 'react';
import type { FilterState, ProviderLimitType } from '../../hooks/useProviderFilters';
import ProviderLimitButtons from './ProviderLimitButtons';

interface ProviderFiltersProps {
  filters: FilterState;
  onToggleFilter: (filterType: keyof FilterState) => void;
  providerLimit: ProviderLimitType;
  onLimitChange: (limit: ProviderLimitType) => void;
}

const ProviderFilters: React.FC<ProviderFiltersProps> = ({
  filters,
  onToggleFilter,
  providerLimit,
  onLimitChange,
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Subject Filter Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '0.75rem',
        }}
      >
        <button
          onClick={() => onToggleFilter('decisaoJudicial')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '2px solid #3b82f6',
            backgroundColor: filters.decisaoJudicial ? '#3b82f6' : 'white',
            color: filters.decisaoJudicial ? 'white' : '#3b82f6',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={e => {
            if (!filters.decisaoJudicial) {
              e.currentTarget.style.backgroundColor = '#dbeafe';
            }
          }}
          onMouseLeave={e => {
            if (!filters.decisaoJudicial) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: filters.decisaoJudicial ? 'white' : '#3b82f6',
            }}
          />
          Decisão Judicial
        </button>

        <button
          onClick={() => onToggleFilter('administrativo')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '2px solid #8b5cf6',
            backgroundColor: filters.administrativo ? '#8b5cf6' : 'white',
            color: filters.administrativo ? 'white' : '#8b5cf6',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={e => {
            if (!filters.administrativo) {
              e.currentTarget.style.backgroundColor = '#f3e8ff';
            }
          }}
          onMouseLeave={e => {
            if (!filters.administrativo) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: filters.administrativo ? 'white' : '#8b5cf6',
            }}
          />
          Administrativo
        </button>
      </div>

      {/* Provider Limit Buttons */}
      <ProviderLimitButtons currentLimit={providerLimit} onLimitChange={onLimitChange} />

      {/* Filter Description */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            lineHeight: '1.4',
          }}
        >
          <strong>Filtros Ativos:</strong> {getFilterDescription()} • <strong>Limite:</strong>{' '}
          {getLimitDescription()}
          {(filters.decisaoJudicial || filters.administrativo) && (
            <span
              style={{
                display: 'block',
                marginTop: '0.25rem',
                fontSize: '0.75rem',
                fontStyle: 'italic',
              }}
            >
              (Inclui documentos pendentes de resposta)
            </span>
          )}
        </div>
      </div>
    </div>
  );

  function getFilterDescription(): string {
    if (filters.decisaoJudicial) {
      return 'Decisão Judicial';
    }
    return 'Administrativo';
  }

  function getLimitDescription(): string {
    if (providerLimit === 'all') {
      return 'Todos os provedores';
    }
    return `Top ${providerLimit} provedores mais demandados`;
  }
};

export default ProviderFilters;
