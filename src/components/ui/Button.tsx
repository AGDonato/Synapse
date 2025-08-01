// src/components/ui/Button.tsx

import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'danger';
};

export default function Button({ children, onClick, type = 'button', variant = 'primary' }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  };

  // A CORREÇÃO ESTÁ AQUI:
  // Definimos o tipo como um Record (registro) que mapeia nossas variantes para estilos CSS.
  const variantStyles: Record<'primary' | 'danger', React.CSSProperties> = {
    primary: { backgroundColor: '#3b82f6' }, // Azul
    danger: { backgroundColor: '#ef4444' },  // Vermelho
  };

  const combinedStyle = { ...baseStyle, ...variantStyles[variant] };

  return (
    <button type={type} onClick={onClick} style={combinedStyle}>
      {children}
    </button>
  );
}