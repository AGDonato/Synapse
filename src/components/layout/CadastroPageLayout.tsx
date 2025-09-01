// src/components/layout/CadastroPageLayout.tsx
import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { MdSearchOff } from 'react-icons/md';

interface CadastroPageLayoutProps {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  searchPlaceholder: string;
  isFormVisible: boolean;
  onToggleForm: () => void;
  formComponent: React.ReactNode;
  children: React.ReactNode;
}

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
  background: '#f8f9fa',
  border: '1px solid #dee2e6',
  borderRadius: '8px',
  padding: '1.5rem',
  marginTop: '1rem',
  textAlign: 'left',
};
const tableSectionStyle: React.CSSProperties = {
  marginTop: '1.5rem',
  maxHeight: '600px', // Limite de altura (aproximadamente 15-20 linhas de tabela)
  overflowY: 'auto', // Barra de rolagem vertical quando necessário
  borderRadius: '8px', // Bordas arredondadas
  border: '1px solid #e2e8f0', // Borda sutil
  backgroundColor: '#ffffff', // Fundo branco
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Sombra sutil
  // Melhorar a aparência da barra de rolagem
  scrollbarWidth: 'thin', // Firefox
  scrollbarColor: '#cbd5e0 #f7fafc', // Firefox
};

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchHovered, setIsSearchHovered] = useState(false);
  const [isClearFocused, setIsClearFocused] = useState(false);

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    outline: 'none',
    borderColor: isSearchFocused ? '#007bff' : isSearchHovered ? '#007bff' : '#ccc',
    boxShadow: isSearchFocused ? '0 0 0 2px rgba(0, 123, 255, 0.25)' : 'none',
  };

  // Previne foco indesejado com teclas especiais
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Se nenhum elemento tem foco ou é o body
      if (!document.activeElement || document.activeElement === document.body) {
        // Previne comportamento padrão para Escape e setas quando não há foco
        if (
          event.key === 'Escape' ||
          event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight'
        ) {
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div tabIndex={-1} style={{ outline: 'none' }}>
      <div style={pageHeaderStyle}>
        <h2>{title}</h2>
      </div>

      <div style={searchSectionStyle}>
        <input
          type='text'
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={searchInputStyle}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => setIsSearchHovered(false)}
        />
        <button
          onClick={onClearSearch}
          disabled={!searchTerm.trim()}
          style={{
            padding: '8px',
            border: '1px solid transparent',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            cursor: searchTerm.trim() ? 'pointer' : 'not-allowed',
            color: searchTerm.trim() ? '#666' : '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            outline: 'none',
            boxShadow:
              isClearFocused && searchTerm.trim() ? '0 0 0 3px rgba(0, 123, 255, 0.1)' : 'none',
          }}
          onFocus={() => setIsClearFocused(true)}
          onBlur={() => setIsClearFocused(false)}
        >
          <MdSearchOff size={20} />
        </button>
      </div>

      <div style={formSectionStyle}>
        <Button onClick={onToggleForm} variant={isFormVisible ? 'danger' : 'primary'}>
          {isFormVisible ? 'Cancelar' : '+ Novo Cadastro'}
        </Button>

        {isFormVisible && <div style={formToggleStyle}>{formComponent}</div>}
      </div>

      {/* Container da tabela com scroll limitado */}
      <div style={tableSectionStyle} className='table-scroll-container'>
        {children}
      </div>
    </div>
  );
}
