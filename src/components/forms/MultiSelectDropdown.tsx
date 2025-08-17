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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsContainerRef = useRef<HTMLDivElement>(null);

  // Função para verificar se uma opção está selecionada
  const isOptionSelected = (option: MultiSelectOption) => {
    return selectedValues.some(item => item.id === option.id);
  };

  // Função para normalizar texto removendo acentos
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const filteredOptions = options.filter(option =>
    normalizeText(option.nome).includes(normalizeText(searchTerm))
  );

  // Separar opções selecionadas e disponíveis
  const selectedFilteredOptions = filteredOptions.filter(option =>
    isOptionSelected(option)
  );

  const availableFilteredOptions = filteredOptions.filter(
    option => !isOptionSelected(option)
  );

  // Combinar as listas para navegação (selecionados primeiro)
  const allFilteredOptions = [
    ...selectedFilteredOptions,
    ...availableFilteredOptions,
  ];

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

  // Função para formatar o texto dos selecionados
  const formatSelectedText = (): string => {
    if (selectedValues.length === 0) {
      return '';
    }

    if (selectedValues.length === 1) {
      return selectedValues[0].nome;
    }

    if (selectedValues.length === 2) {
      return `${selectedValues[0].nome} e ${selectedValues[1].nome}`;
    }

    if (selectedValues.length === 3) {
      return `${selectedValues[0].nome}, ${selectedValues[1].nome} e ${selectedValues[2].nome}`;
    }

    // Para mais de 3 selecionados: mostrar os 2 primeiros e contador
    return `${selectedValues[0].nome}, ${selectedValues[1].nome} e mais ${selectedValues.length - 2}`;
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
    if (selectedIndex >= allFilteredOptions.length) {
      setSelectedIndex(allFilteredOptions.length - 1);
    }
  }, [allFilteredOptions, selectedIndex]);

  // Efeito para resetar scroll ao abrir o dropdown
  useEffect(() => {
    if (isOpen && optionsContainerRef.current) {
      // Resetar scroll para o topo quando abrir
      optionsContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Efeito para fazer scroll automático para o item selecionado
  useEffect(() => {
    if (selectedIndex >= 0 && isOpen && optionsContainerRef.current) {
      const container = optionsContainerRef.current;
      // Calcular o índice real considerando headers e input
      let childIndex = 1; // Começa em 1 porque o input é o primeiro filho

      // Se tem selecionados, adicionar 1 para o header "Selecionados"
      if (selectedFilteredOptions.length > 0) {
        childIndex += 1;

        // Se o índice está na seção de selecionados
        if (selectedIndex < selectedFilteredOptions.length) {
          childIndex += selectedIndex;
        } else {
          // Está na seção de disponíveis
          childIndex += selectedFilteredOptions.length;
          // Adicionar 1 para o header "Disponíveis"
          if (availableFilteredOptions.length > 0) {
            childIndex += 1;
            childIndex += selectedIndex - selectedFilteredOptions.length;
          }
        }
      } else if (availableFilteredOptions.length > 0) {
        // Só tem disponíveis
        childIndex += 1; // Header "Disponíveis"
        childIndex += selectedIndex;
      }

      const selectedItem = container.children[childIndex] as HTMLElement;
      if (selectedItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const itemTop = selectedItem.offsetTop;
        const itemBottom = itemTop + selectedItem.offsetHeight;

        if (itemTop < containerTop) {
          container.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.clientHeight;
        }
      }
    }
  }, [
    selectedIndex,
    isOpen,
    selectedFilteredOptions.length,
    availableFilteredOptions.length,
  ]);

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
    backgroundColor: '#f5f5f5',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const searchInputStyle: React.CSSProperties = {
    width: 'calc(100% - 8px)',
    padding: '8px 12px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    borderRadius: '4px',
    margin: '4px',
    backgroundColor: 'white',
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
    accentColor: '#007bff',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(-1);
        // Focar no input de pesquisa após abrir o dropdown
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 0);
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
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          // Se está abrindo, focar no input de pesquisa
          if (newIsOpen) {
            setTimeout(() => {
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }, 0);
          }
        }}
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

      <div
        ref={optionsContainerRef}
        style={optionsContainerStyle}
        tabIndex={-1}
        onKeyDown={e => {
          // Navegação dentro da lista de opções
          switch (e.key) {
            case 'ArrowDown': {
              e.preventDefault();
              const nextIndex =
                selectedIndex < allFilteredOptions.length - 1
                  ? selectedIndex + 1
                  : selectedIndex;
              setSelectedIndex(nextIndex);
              break;
            }
            case 'ArrowUp': {
              e.preventDefault();
              const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : -1;
              setSelectedIndex(prevIndex);
              // Se voltar para -1, retornar foco ao input
              if (prevIndex === -1 && searchInputRef.current) {
                searchInputRef.current.focus();
              }
              break;
            }
            case ' ': {
              e.preventDefault();
              if (
                selectedIndex >= 0 &&
                selectedIndex < allFilteredOptions.length
              ) {
                handleToggleOption(allFilteredOptions[selectedIndex]);
              }
              break;
            }
            case 'Enter': {
              e.preventDefault();
              // Voltar foco para o input de pesquisa
              if (searchInputRef.current) {
                searchInputRef.current.focus();
                setSelectedIndex(-1);
              }
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
        }}
      >
        <input
          ref={searchInputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => {
            // Navegação do input de pesquisa
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
              e.preventDefault();
              e.stopPropagation();
              // Mover para o primeiro item da lista
              if (allFilteredOptions.length > 0) {
                setSelectedIndex(0);
                // Focar no container de opções para receber eventos de teclado
                setTimeout(() => {
                  if (optionsContainerRef.current) {
                    optionsContainerRef.current.focus();
                  }
                }, 0);
              }
            } else if (e.key === 'Escape') {
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
            } else if (e.key === 'Tab') {
              // Ao pressionar Tab, fechar o dropdown
              setIsOpen(false);
              setSelectedIndex(-1);
              // Deixar o Tab seguir seu comportamento normal
            }
          }}
          style={searchInputStyle}
          onClick={e => e.stopPropagation()}
        />

        {/* Seção de Selecionados */}
        {selectedFilteredOptions.length > 0 && (
          <>
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #ddd',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
              }}
            >
              Selecionados ({selectedValues.length})
            </div>
            {selectedFilteredOptions.map((option, index) => (
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
                  checked={true}
                  onChange={() => {}} // Controlado pelo onClick do container
                  style={checkboxStyle}
                  tabIndex={-1}
                />
                <span>{option.nome}</span>
              </div>
            ))}
          </>
        )}

        {/* Seção de Disponíveis */}
        {availableFilteredOptions.length > 0 && (
          <>
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #ddd',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
              }}
            >
              Disponíveis
            </div>
            {availableFilteredOptions.map((option, index) => {
              const actualIndex = selectedFilteredOptions.length + index;
              return (
                <div
                  key={option.id}
                  onClick={() => handleToggleOption(option)}
                  style={getOptionStyle(actualIndex)}
                  onMouseEnter={e => {
                    setSelectedIndex(actualIndex);
                    e.currentTarget.style.backgroundColor = '#e6f3ff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      selectedIndex === actualIndex ? '#e6f3ff' : '#fff';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => {}} // Controlado pelo onClick do container
                    style={checkboxStyle}
                    tabIndex={-1}
                  />
                  <span>{option.nome}</span>
                </div>
              );
            })}
          </>
        )}

        {allFilteredOptions.length === 0 && searchTerm && (
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
