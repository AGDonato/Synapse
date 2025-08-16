// src/components/forms/MultiSelectDropdown.tsx
import React, { useState, useEffect, useRef } from 'react';

export type MultiSelectOption = {
  id: number | string;
  nome: string;
};

type MultiSelectDropdownProps = {
  options: MultiSelectOption[];
  selectedValues: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
};

export default function MultiSelectDropdown({
  options,
  selectedValues = [],
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Filtrar...',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleOption = (option: MultiSelectOption) => {
    const isSelected = selectedValues.some(item => item.id === option.id);

    if (isSelected) {
      // Remove da seleção
      const newSelected = selectedValues.filter(item => item.id !== option.id);
      onChange(newSelected);
    } else {
      // Adiciona à seleção
      onChange([...selectedValues, option]);
    }
  };

  const isOptionSelected = (option: MultiSelectOption) => {
    return selectedValues.some(item => item.id === option.id);
  };

  // Função para formatar o texto dos selecionados
  const formatSelectedText = (): string => {
    if (selectedValues.length === 0) {
      return '';
    }

    if (selectedValues.length === 1) {
      return selectedValues[0].nome;
    }

    // Para múltiplos: "item1, item2 e item3"
    const items = selectedValues.map(item => item.nome);
    const lastItem = items.pop();
    return `${items.join(', ')} e ${lastItem}`;
  };

  // Efeito para fechar o menu se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Efeito para resetar selectedIndex quando filteredOptions mudam
  useEffect(() => {
    if (selectedIndex >= filteredOptions.length) {
      setSelectedIndex(filteredOptions.length - 1);
    }
  }, [filteredOptions, selectedIndex]);

  // Estilos inline para consistência com o sistema existente
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const triggerStyle: React.CSSProperties = {
    padding: '8px',
    border: isFocused ? '1px solid #007bff' : '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    height: '36px',
    boxSizing: 'border-box',
    fontSize: '0.825rem',
    lineHeight: '1.5',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    outline: 'none',
    boxShadow: isFocused ? '0 0 0 3px rgba(0, 123, 255, 0.1)' : 'none',
    transition: 'border-color 0.2s ease',
    width: '100%',
  };

  const selectedTextStyle: React.CSSProperties = {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: selectedValues.length > 0 ? '#333' : '#999',
    fontSize: '0.825rem',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  };

  const arrowStyle: React.CSSProperties = {
    marginLeft: '8px',
    fontSize: '12px',
    color: '#666',
    flexShrink: 0,
  };

  const optionsContainerStyle: React.CSSProperties = {
    display: isOpen ? 'block' : 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    border: '1px solid #ccc',
    borderTop: 'none',
    backgroundColor: 'white',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    boxSizing: 'border-box',
    border: 'none',
    borderBottom: '1px solid #eee',
    fontSize: '0.825rem',
    lineHeight: '1.5',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const getOptionStyle = (index: number): React.CSSProperties => ({
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.825rem',
    backgroundColor: selectedIndex === index ? '#e6f3ff' : '#fff',
    transition: 'background-color 0.2s ease',
  });

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(-1);
      }
      return;
    }

    // Navegação dentro do dropdown aberto
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex =
          selectedIndex < filteredOptions.length - 1
            ? selectedIndex + 1
            : selectedIndex;
        setSelectedIndex(nextIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : selectedIndex;
        setSelectedIndex(prevIndex);
        break;
      }
      case ' ': {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleToggleOption(filteredOptions[selectedIndex]);
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        // Retornar foco ao trigger
        setTimeout(() => {
          const trigger = dropdownRef.current?.querySelector(
            '[tabIndex="0"]'
          ) as HTMLElement;
          if (trigger) {
            trigger.focus();
          }
        }, 0);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        // Retornar foco ao trigger
        setTimeout(() => {
          const trigger = dropdownRef.current?.querySelector(
            '[tabIndex="0"]'
          ) as HTMLElement;
          if (trigger) {
            trigger.focus();
          }
        }, 0);
        break;
      }
    }
  };

  return (
    <div ref={dropdownRef} style={containerStyle}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
        style={triggerStyle}
      >
        <span style={selectedTextStyle}>
          {selectedValues.length > 0 ? formatSelectedText() : placeholder}
        </span>
        <span style={arrowStyle}>{isOpen ? '▲' : '▼'}</span>
      </div>

      <div style={optionsContainerStyle}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={searchInputStyle}
          onClick={e => e.stopPropagation()}
        />

        {filteredOptions.map((option, index) => (
          <div
            key={option.id}
            onClick={() => handleToggleOption(option)}
            style={getOptionStyle(index)}
            onMouseEnter={e => {
              setSelectedIndex(index);
              e.currentTarget.style.backgroundColor = '#e6f3ff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor =
                selectedIndex === index ? '#e6f3ff' : '#fff';
            }}
          >
            <input
              type="checkbox"
              checked={isOptionSelected(option)}
              onChange={() => {}} // Controlado pelo onClick do container
              style={checkboxStyle}
              tabIndex={-1}
            />
            <span>{option.nome}</span>
          </div>
        ))}

        {filteredOptions.length === 0 && searchTerm && (
          <div
            style={{
              padding: '8px 12px',
              color: '#999',
              fontSize: '0.825rem',
            }}
          >
            Nenhum resultado encontrado
          </div>
        )}
      </div>
    </div>
  );
}
