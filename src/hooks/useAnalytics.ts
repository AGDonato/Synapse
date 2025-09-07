/**
 * Hook para rastreamento de eventos e métricas de usuário
 *
 * @description
 * Fornece interface completa para analytics da aplicação:
 * - Rastreamento automático de navegação entre páginas
 * - Eventos customizados de negócio
 * - Métricas de performance
 * - Rastreamento de erros
 * - Identificação de usuários
 *
 * @example
 * const analytics = useAnalytics();
 * analytics.track('button_clicked', { button: 'save' });
 * analytics.trackBusinessAction('criar', 'demanda', { id: 123 });
 *
 * @module hooks/useAnalytics
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analytics/core';

// ========== TIPOS E INTERFACES ==========
// Definições para propriedades e retorno do hook de analytics

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

interface UseAnalyticsReturn {
  track: (event: string, properties?: AnalyticsProperties) => void;
  trackPageView: (properties?: AnalyticsProperties) => void;
  trackBusinessAction: (action: string, entity: string, properties?: AnalyticsProperties) => void;
  trackError: (error: Error, properties?: AnalyticsProperties) => void;
  trackPerformance: (label: string, duration: number, properties?: AnalyticsProperties) => void;
  identify: (userId: string, properties?: AnalyticsProperties) => void;
  time: (label: string) => void;
  timeEnd: (label: string, properties?: AnalyticsProperties) => void;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const location = useLocation();
  const lastPathRef = useRef<string | undefined>(undefined);

  // Rastreamento automático de navegação - registra toda mudança de rota
  useEffect(() => {
    // Só registra se houve mudança real de página
    if (location.pathname !== lastPathRef.current) {
      // Envia evento de visualização de página com dados da rota
      analytics.page(location.pathname, {
        search: location.search, // Parâmetros de query
        hash: location.hash, // Fragment da URL
        state: location.state, // Estado do router
      });
      lastPathRef.current = location.pathname;
    }
  }, [location]);

  /**
   * Rastreia evento customizado
   * @param event - Nome do evento
   * @param properties - Propriedades adicionais do evento
   */
  const track = useCallback((event: string, properties?: AnalyticsProperties) => {
    analytics.track(event, properties);
  }, []);

  /**
   * Rastreia visualização de página manualmente
   * @param properties - Propriedades adicionais da página
   */
  const trackPageView = useCallback(
    (properties?: AnalyticsProperties) => {
      analytics.page(location.pathname, {
        search: location.search,
        hash: location.hash,
        ...properties,
      });
    },
    [location]
  );

  /**
   * Rastreia ação de negócio (CRUD, fluxos, etc)
   * @param action - Ação realizada (criar, editar, deletar)
   * @param entity - Entidade afetada (demanda, documento)
   * @param properties - Dados adicionais da ação
   */
  const trackBusinessAction = useCallback(
    (action: string, entity: string, properties?: AnalyticsProperties) => {
      analytics.trackBusinessEvent(action, entity, properties);
    },
    []
  );

  /**
   * Rastreia erro da aplicação para monitoramento
   * @param error - Objeto de erro capturado
   * @param properties - Contexto adicional do erro
   */
  const trackError = useCallback((error: Error, properties?: AnalyticsProperties) => {
    analytics.track(
      'error',
      {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...properties,
      },
      'error'
    );
  }, []);

  /**
   * Rastreia métrica de performance
   * @param label - Identificação da métrica
   * @param duration - Duração em milissegundos
   * @param properties - Dados adicionais de contexto
   */
  const trackPerformance = useCallback(
    (label: string, duration: number, properties?: AnalyticsProperties) => {
      analytics.track(
        'performance_metric',
        {
          label,
          duration,
          ...properties,
        },
        'performance'
      );
    },
    []
  );

  /**
   * Identifica usuário para rastreamento personalizado
   * @param userId - ID único do usuário
   * @param properties - Atributos do usuário
   */
  const identify = useCallback((userId: string, properties?: AnalyticsProperties) => {
    analytics.identify(userId, properties);
  }, []);

  /**
   * Inicia cronometragem de uma operação
   * @param label - Identificador único da métrica
   */
  const time = useCallback((label: string) => {
    analytics.time(label);
  }, []);

  /**
   * Finaliza cronometragem e registra tempo decorrido
   * @param label - Identificador da métrica (deve coincidir com time())
   * @param properties - Dados adicionais da métrica
   */
  const timeEnd = useCallback((label: string, properties?: AnalyticsProperties) => {
    analytics.timeEnd(label, properties);
  }, []);

  // Retorna interface pública do hook
  return {
    track, // Evento customizado genérico
    trackPageView, // Visualização de página manual
    trackBusinessAction, // Ações de negócio (CRUD, fluxos)
    trackError, // Erros da aplicação
    trackPerformance, // Métricas de performance
    identify, // Identificação de usuário
    time, // Inicia cronometragem
    timeEnd, // Finaliza cronometragem
  };
};

// ========== COMPONENTE DE ORDEM SUPERIOR ==========
// HOC para rastreamento automático de componentes React
export function withAnalytics(
  Component: React.ComponentType<Record<string, unknown>>,
  componentName?: string // Nome personalizado para o componente
) {
  const WrappedComponent: React.FC<Record<string, unknown>> = props => {
    const { track, time, timeEnd } = useAnalytics();
    const mountTimeRef = useRef<number | undefined>(undefined);

    useEffect(() => {
      // Resolve nome do componente (prioridade: customizado > displayName > name)
      const name = componentName ?? Component.displayName ?? Component.name ?? 'UnknownComponent';

      // Registra montagem do componente
      mountTimeRef.current = Date.now();
      time(`component_render_${name}`);
      track('component_mount', { componentName: name });

      // Cleanup: registra desmontagem e tempo de vida
      return () => {
        if (mountTimeRef.current) {
          const duration = Date.now() - mountTimeRef.current;
          timeEnd(`component_render_${name}`, { componentName: name });
          track('component_unmount', {
            componentName: name,
            mountDuration: duration, // Tempo total que ficou montado
          });
        }
      };
    }, [track, time, timeEnd]);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withAnalytics(${Component.displayName ?? Component.name})`;
  return WrappedComponent;
}

// ========== HOOK ESPECIALIZADO PARA NEGÓCIO ==========
// Métodos pré-configurados para eventos comuns da aplicação
export const useBusinessAnalytics = () => {
  const { trackBusinessAction, track } = useAnalytics();

  return {
    // ===== GESTÃO DE DOCUMENTOS =====
    // Rastreia criação de novo documento
    trackDocumentCreated: (documentType: string, properties?: AnalyticsProperties) =>
      trackBusinessAction('create', 'document', { documentType, ...properties }),

    // Rastreia visualização de documento existente
    trackDocumentViewed: (documentId: string, properties?: AnalyticsProperties) =>
      trackBusinessAction('view', 'document', { documentId, ...properties }),

    // Rastreia edição de documento
    trackDocumentEdited: (documentId: string, properties?: AnalyticsProperties) =>
      trackBusinessAction('edit', 'document', { documentId, ...properties }),

    // ===== GESTÃO DE DEMANDAS =====
    // Rastreia criação de nova demanda
    trackDemandCreated: (demandType: string, properties?: AnalyticsProperties) =>
      trackBusinessAction('create', 'demand', { demandType, ...properties }),

    // Rastreia mudança de status de demanda
    trackDemandStatusChanged: (demandId: string, oldStatus: string, newStatus: string) =>
      trackBusinessAction('status_change', 'demand', { demandId, oldStatus, newStatus }),

    // ===== BUSCA E FILTRAGEM =====
    // Rastreia busca realizada pelo usuário
    trackSearch: (query: string, resultCount: number, context?: string) =>
      track('search', { query, resultCount, context }),

    // Rastreia aplicação de filtros
    trackFilterApplied: (filters: AnalyticsProperties, context?: string) =>
      track('filter_applied', { ...filters, context }),

    // ===== INTERAÇÕES COM FORMULÁRIOS =====
    // Rastreia início de preenchimento de formulário
    trackFormStarted: (formName: string) => track('form_started', { formName }),

    // Rastreia conclusão de formulário com tempo
    trackFormCompleted: (formName: string, duration: number) =>
      track('form_completed', { formName, duration }),

    // Rastreia abandono de formulário (ponto onde parou)
    trackFormAbandoned: (formName: string, step: string) =>
      track('form_abandoned', { formName, step }),

    // ===== USO DE FUNCIONALIDADES =====
    // Rastreia uso de funcionalidade específica
    trackFeatureUsed: (feature: string, properties?: AnalyticsProperties) =>
      track('feature_used', { feature, ...properties }),
  };
};
