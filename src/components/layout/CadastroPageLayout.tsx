// src/components/layout/CadastroPageLayout.tsx
import React from 'react';
import Button from '../ui/Button';

type CadastroPageLayoutProps = {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  searchPlaceholder: string;
  isFormVisible: boolean;
  onToggleForm: () => void;
  formComponent: React.ReactNode;
  children: React.ReactNode;
};

// Estilos
const pageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const searchSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  margin: '1.5rem 0',
};
const formSectionStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  textAlign: 'center',
};
const formToggleStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1.5rem',
  marginTop: '1rem',
  textAlign: 'left',
};
const tableSectionStyle: React.CSSProperties = { marginTop: '1.5rem' };

export default function CadastroPageLayout({
  title,
  searchTerm,
  onSearchChange,
  onClearSearch,
  searchPlaceholder,
  isFormVisible,
  onToggleForm,
  formComponent,
  children,
}: CadastroPageLayoutProps) {
  return (
    <div>
      <div style={pageHeaderStyle}>
        <h2>{title}</h2>
      </div>

      <div style={searchSectionStyle}>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={{ width: '100%', padding: '8px' }}
        />
        <Button onClick={onClearSearch}>Limpar Filtro</Button>
      </div>

      <div style={formSectionStyle}>
        <Button
          onClick={onToggleForm}
          variant={isFormVisible ? 'error' : 'primary'}
        >
          {isFormVisible ? 'Cancelar' : 'Novo Cadastro'}
        </Button>

        {isFormVisible && <div style={formToggleStyle}>{formComponent}</div>}
      </div>

      {/* A CORREÇÃO ESTÁ AQUI: Usamos a constante em vez do estilo inline */}
      <div style={tableSectionStyle}>{children}</div>
    </div>
  );
}
