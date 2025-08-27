
// src/components/forms/SearchableSelect.tsx
import React, { useEffect, useRef, useState } from 'react';

// Exportamos o tipo para que outras páginas possam usá-lo
export interface Option {
  id: number | string;
  nome: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: Option | null;
  onChange: (selected: Option | null) => void;
  placeholder?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Efeito para fechar o menu se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estilos
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    fontFamily: 'sans-serif',
  };
  const triggerStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: isFocused ? '1px solid #007bff' : '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    height: '38px',
    boxSizing: 'border-box',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    outline: 'none',
    boxShadow: isFocused ? '0 0 0 3px rgba(0, 123, 255, 0.1)' : 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };
  const optionsContainerStyle: React.CSSProperties = {
    display: isOpen ? 'block' : 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    border: '1px solid #ccc',
    backgroundColor: 'white',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    borderRadius: '4px',
    marginTop: '4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };
  const optionStyle: React.CSSProperties = {
    padding: '10px',
    cursor: 'pointer',
  };
  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    boxSizing: 'border-box',
    border: 'none',
    borderBottom: '1px solid #eee',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontFamily: 'inherit',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={selectRef} style={containerStyle}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
        style={triggerStyle}
      >
        {value ? value.nome : placeholder}
      </div>
      <div style={optionsContainerStyle}>
        <input
          type='text'
          placeholder='Filtrar...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
        {filteredOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => handleSelect(option)}
            style={optionStyle}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#f0f0f0')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = '#fff')
            }
          >
            {option.nome}
          </div>
        ))}
      </div>
    </div>
  );
}
