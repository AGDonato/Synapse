
// src/components/charts/ProviderLimitButtons.tsx
import React from 'react';
import type { ProviderLimitType } from '../../hooks/useProviderFilters';

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
        gap: '0.5rem',
        justifyContent: 'center',
        marginBottom: '1rem',
      }}
    >
      <span
        style={{
          fontSize: '0.875rem',
          color: '#64748b',
          alignSelf: 'center',
          marginRight: '0.5rem',
        }}
      >
        Mostrar:
      </span>
      {limits.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onLimitChange(value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '2px solid #e2e8f0',
            backgroundColor: currentLimit === value ? '#f1f5f9' : 'white',
            color: currentLimit === value ? '#1e293b' : '#64748b',
            fontWeight: currentLimit === value ? '600' : '500',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '3rem',
          }}
          onMouseEnter={e => {
            if (currentLimit !== value) {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          onMouseLeave={e => {
            if (currentLimit !== value) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default ProviderLimitButtons;
