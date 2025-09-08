// src/components/charts/ProviderFilters.tsx
import React from 'react';
import type { FilterState, ProviderLimitType } from '../../../shared/hooks/useProviderFilters';
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
          justifyContent: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '4px',
            maxWidth: '400px',
          }}
        >
          <button
            onClick={() => onToggleFilter('decisaoJudicial')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              background: filters.decisaoJudicial ? 'white' : 'transparent',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '0.875rem',
              color: filters.decisaoJudicial ? '#374151' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filters.decisaoJudicial
                ? '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                : 'none',
            }}
            onMouseEnter={e => {
              if (!filters.decisaoJudicial) {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.background = '#dbeafe';
              }
            }}
            onMouseLeave={e => {
              if (!filters.decisaoJudicial) {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Decisão Judicial
          </button>
          <button
            onClick={() => onToggleFilter('administrativo')}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              background: filters.administrativo ? 'white' : 'transparent',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '0.875rem',
              color: filters.administrativo ? '#374151' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: filters.administrativo
                ? '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                : 'none',
            }}
            onMouseEnter={e => {
              if (!filters.administrativo) {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.background = '#dbeafe';
              }
            }}
            onMouseLeave={e => {
              if (!filters.administrativo) {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Administrativo
          </button>
        </div>
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: filters.decisaoJudicial ? '#8b5cf6' : '#3b82f6',
              boxShadow: filters.decisaoJudicial
                ? '0 0 4px rgba(139, 92, 246, 0.4)'
                : '0 0 4px rgba(59, 130, 246, 0.4)',
            }}
          />
          <span
            style={{
              fontSize: '0.875rem',
              color: '#374151',
            }}
          >
            {getFilterDescription()}
          </span>
        </div>
        <div
          style={{
            color: '#cbd5e1',
            fontWeight: 'bold',
          }}
        >
          •
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#64748b',
            }}
          />
          <span
            style={{
              fontSize: '0.875rem',
              color: '#374151',
            }}
          >
            {getLimitDescription()}
          </span>
        </div>
        {(filters.decisaoJudicial || filters.administrativo) && (
          <>
            <div
              style={{
                color: '#cbd5e1',
                fontWeight: 'bold',
              }}
            >
              •
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  color: '#f59e0b',
                  fontStyle: 'italic',
                  fontSize: '0.75rem',
                }}
              >
                Inclui pendentes
              </span>
            </div>
          </>
        )}
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
