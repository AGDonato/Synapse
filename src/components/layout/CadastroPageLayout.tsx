// src/components/layout/CadastroPageLayout.tsx
import React from 'react';
import Button from '../ui/Button';

// 1. CORREÇÃO: Adicionamos as novas props que o componente espera receber
type CadastroPageLayoutProps = {
  title: string;
  isFormVisible: boolean;
  onNovoClick: () => void;
  formComponent: React.ReactNode;
  children: React.ReactNode;
};

export default function CadastroPageLayout({
  title,
  isFormVisible,
  onNovoClick,
  formComponent,
  children,
}: CadastroPageLayoutProps) {
  
  // 2. CORREÇÃO: As constantes de estilo não usadas foram removidas daqui.

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{title}</h2>
        {!isFormVisible && (
          <Button onClick={onNovoClick}>Novo Cadastro</Button>
        )}
      </div>

      {isFormVisible && (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginTop: '1.5rem' }}>
           {formComponent}
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {children}
      </div>
    </div>
  );
}