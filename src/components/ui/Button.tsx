// src/components/ui/Button.tsx

import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'danger';
  disabled?: boolean; // 1. Adicionamos a nova propriedade 'disabled'
};

export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false }: ButtonProps) {
  // Estilo base do botão
  const baseStyle: React.CSSProperties = {
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'opacity 0.2s', // Adicionamos uma transição suave
  };

  // Definimos os estilos específicos de cada variante
  const variantStyles: Record<'primary' | 'danger', React.CSSProperties> = {
    primary: { backgroundColor: '#3b82f6' },
    danger: { backgroundColor: '#ef4444' },
  };

  // 3. Estilo para o estado desabilitado
  const disabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  // Juntamos os estilos: base + variante + (desabilitado, se aplicável)
  const combinedStyle = { 
    ...baseStyle, 
    ...variantStyles[variant],
    ...(disabled ? disabledStyle : {}) // Adiciona o estilo 'disabled' se a prop for true
  };

  return (
    // 2. Aplicamos a propriedade 'disabled' ao elemento button do HTML
    <button type={type} onClick={onClick} style={combinedStyle} disabled={disabled}>
      {children}
    </button>
  );
}