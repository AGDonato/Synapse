// src/components/charts/ProviderLimitButtons.tsx
import React from 'react';
import type { ProviderLimitType } from '../../../shared/hooks/useProviderFilters';

interface ProviderLimitButtonsProps {
  currentLimit: ProviderLimitType;
  onLimitChange: (limit: ProviderLimitType) => void;
}

const ProviderLimitButtons: React.FC<ProviderLimitButtonsProps> = ({
  currentLimit,
  onLimitChange,
}) => {
  const limits: { value: ProviderLimitType; label: string }[] = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 'all', label: 'Todos' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1rem',
      }}
    >
      <span
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          fontWeight: '500',
        }}
      >
        Mostrar:
      </span>
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          padding: '4px',
          minWidth: '200px',
        }}
      >
        {limits.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onLimitChange(value)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              border: 'none',
              background: currentLimit === value ? 'white' : 'transparent',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '0.875rem',
              color: currentLimit === value ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '50px',
              boxShadow:
                currentLimit === value
                  ? '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                  : 'none',
            }}
            onMouseEnter={e => {
              if (currentLimit !== value) {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.background = '#dbeafe';
              }
            }}
            onMouseLeave={e => {
              if (currentLimit !== value) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProviderLimitButtons;
