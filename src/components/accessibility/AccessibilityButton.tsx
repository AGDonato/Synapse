// src/components/accessibility/AccessibilityButton.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';
import { AccessibilityPanel } from './AccessibilityPanel';
import { Button } from '../ui';
import styles from './AccessibilityButton.module.css';

export const AccessibilityButton: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { announce } = useAccessibility();

  const handleTogglePanel = () => {
    const newState = !isPanelOpen;
    setIsPanelOpen(newState);
    
    if (newState) {
      announce('Painel de acessibilidade aberto');
    } else {
      announce('Painel de acessibilidade fechado');
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    announce('Painel de acessibilidade fechado');
  };

  return (
    <>
      <Button
        onClick={handleTogglePanel}
        className={styles.accessibilityButton}
        aria-label={isPanelOpen ? 'Fechar configurações de acessibilidade' : 'Abrir configurações de acessibilidade'}
        title="Configurações de Acessibilidade"
        type="button"
      >
        {isPanelOpen ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
        <span className={styles.buttonText}>Acessibilidade</span>
      </Button>

      <AccessibilityPanel 
        isOpen={isPanelOpen} 
        onClose={handleClosePanel} 
      />
    </>
  );
};