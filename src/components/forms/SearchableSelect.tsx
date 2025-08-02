// src/components/forms/SearchableSelect.tsx
import React, { useState, useEffect, useRef } from 'react';

// Exportamos o tipo para que outras páginas possam usá-lo
export type Option = {
  id: number | string;
  nome: string;
};

type SearchableSelectProps = {
  options: Option[];
  value: Option | null;
  onChange: (selected: Option | null) => void;
  placeholder?: string;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#fff',
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
    zIndex: 10,
    borderRadius: '4px',
    marginTop: '4px',
  };
  const optionStyle: React.CSSProperties = {
    padding: '10px',
    cursor: 'pointer',
  };
  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
    border: 'none',
    borderBottom: '1px solid #eee',
  };

  return (
    <div ref={selectRef} style={containerStyle}>
      <div onClick={() => setIsOpen(!isOpen)} style={triggerStyle}>
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
