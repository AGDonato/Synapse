// src/components/accessibility/AccessibilityPanel.tsx
import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { Button } from '../ui';
import { Brain, Eye, Keyboard, Mouse, Type, Volume2, X } from 'lucide-react';
import styles from './AccessibilityPanel.module.css';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    showFocusOutlines,
    keyboardOnlyNavigation,
    announceChanges,
    verboseDescriptions,
    increaseClickTargets,
    simplifiedUI,
    reduceDistraction,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleFocusOutlines,
    toggleKeyboardNavigation,
    toggleAnnounceChanges,
    toggleVerboseDescriptions,
    toggleIncreaseClickTargets,
    toggleSimplifiedUI,
    toggleReduceDistraction,
    resetPreferences,
    announce,
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'visual' | 'motor' | 'audio' | 'cognitive'>('visual');

  if (!isOpen) {return null;}

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    announce(`Aba ${tab} selecionada`);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-labelledby="accessibility-panel-title" aria-modal="true">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id="accessibility-panel-title" className={styles.title}>
            <Eye size={24} aria-hidden="true" />
            Configurações de Acessibilidade
          </h2>
          <Button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fechar painel de acessibilidade"
          >
            <X size={20} aria-hidden="true" />
          </Button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'visual' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('visual')}
            aria-pressed={activeTab === 'visual'}
          >
            <Eye size={20} aria-hidden="true" />
            Visual
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'motor' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('motor')}
            aria-pressed={activeTab === 'motor'}
          >
            <Mouse size={20} aria-hidden="true" />
            Motor
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'audio' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('audio')}
            aria-pressed={activeTab === 'audio'}
          >
            <Volume2 size={20} aria-hidden="true" />
            Auditivo
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'cognitive' ? styles.tabActive : ''}`}
            onClick={() => handleTabChange('cognitive')}
            aria-pressed={activeTab === 'cognitive'}
          >
            <Brain size={20} aria-hidden="true" />
            Cognitivo
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'visual' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Configurações Visuais</h3>
              
              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Alto Contraste</span>
                  <span className={styles.settingDescription}>
                    Aumenta o contraste para melhorar a legibilidade
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${highContrast ? styles.toggleOn : ''}`}
                  onClick={toggleHighContrast}
                  aria-pressed={highContrast}
                  aria-describedby="high-contrast-desc"
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Tamanho da Fonte</span>
                  <span className={styles.settingDescription}>
                    Ajusta o tamanho do texto em toda a aplicação
                  </span>
                </label>
                <div className={styles.fontSizeControls}>
                  {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                    <button
                      key={size}
                      className={`${styles.fontSizeButton} ${fontSize === size ? styles.fontSizeActive : ''}`}
                      onClick={() => setFontSize(size)}
                      aria-pressed={fontSize === size}
                    >
                      {size === 'small' && 'A'}
                      {size === 'medium' && 'A'}
                      {size === 'large' && 'A'}
                      {size === 'extra-large' && 'A'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Movimento Reduzido</span>
                  <span className={styles.settingDescription}>
                    Reduz animações e transições que podem causar desconforto
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${reducedMotion ? styles.toggleOn : ''}`}
                  onClick={toggleReducedMotion}
                  aria-pressed={reducedMotion}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Indicadores de Foco</span>
                  <span className={styles.settingDescription}>
                    Mostra bordas visuais em elementos focados
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${showFocusOutlines ? styles.toggleOn : ''}`}
                  onClick={toggleFocusOutlines}
                  aria-pressed={showFocusOutlines}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'motor' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Configurações Motoras</h3>
              
              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Navegação por Teclado</span>
                  <span className={styles.settingDescription}>
                    Otimiza a interface para navegação apenas por teclado
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${keyboardOnlyNavigation ? styles.toggleOn : ''}`}
                  onClick={toggleKeyboardNavigation}
                  aria-pressed={keyboardOnlyNavigation}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Áreas de Clique Aumentadas</span>
                  <span className={styles.settingDescription}>
                    Aumenta o tamanho dos botões e links para facilitar o clique
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${increaseClickTargets ? styles.toggleOn : ''}`}
                  onClick={toggleIncreaseClickTargets}
                  aria-pressed={increaseClickTargets}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Configurações Auditivas</h3>
              
              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Anunciar Mudanças</span>
                  <span className={styles.settingDescription}>
                    Anuncia mudanças de estado para leitores de tela
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${announceChanges ? styles.toggleOn : ''}`}
                  onClick={toggleAnnounceChanges}
                  aria-pressed={announceChanges}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Descrições Detalhadas</span>
                  <span className={styles.settingDescription}>
                    Fornece descrições mais detalhadas para leitores de tela
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${verboseDescriptions ? styles.toggleOn : ''}`}
                  onClick={toggleVerboseDescriptions}
                  aria-pressed={verboseDescriptions}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cognitive' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Configurações Cognitivas</h3>
              
              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Interface Simplificada</span>
                  <span className={styles.settingDescription}>
                    Remove elementos desnecessários da interface
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${simplifiedUI ? styles.toggleOn : ''}`}
                  onClick={toggleSimplifiedUI}
                  aria-pressed={simplifiedUI}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  <span className={styles.settingName}>Reduzir Distrações</span>
                  <span className={styles.settingDescription}>
                    Remove animações e efeitos que podem distrair
                  </span>
                </label>
                <button
                  className={`${styles.toggle} ${reduceDistraction ? styles.toggleOn : ''}`}
                  onClick={toggleReduceDistraction}
                  aria-pressed={reduceDistraction}
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button
            onClick={resetPreferences}
            className={styles.resetButton}
            variant="outline"
          >
            Redefinir Configurações
          </Button>
          <Button
            onClick={onClose}
            className={styles.applyButton}
          >
            Aplicar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
};