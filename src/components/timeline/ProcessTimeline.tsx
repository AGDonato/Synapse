import React, { useMemo } from 'react';
import Icon from '../ui/Icon';
import { useDemandasData } from '../../hooks/queries/useDemandas';
import { useDocumentosData } from '../../hooks/queries/useDocumentos';
// Types já são inferidos pelos hooks, removendo imports não usados
import styles from './ProcessTimeline.module.css';

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type:
    | 'demand-created'
    | 'document-sent'
    | 'document-received'
    | 'demand-completed'
    | 'deadline-alert';
  status: 'completed' | 'pending' | 'overdue' | 'alert';
  demandaId?: number;
  documentId?: number;
  icon: React.ReactElement;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface ProcessTimelineProps {
  maxEvents?: number;
  daysToShow?: number;
  showOnlyRecent?: boolean;
}

/**
 * Timeline de Processos para Órgão Público
 *
 * Visualiza cronologicamente os eventos importantes das demandas,
 * incluindo criação, tramitação, prazos e finalizações.
 * Adequado para acompanhamento gerencial e transparência processual.
 */
export default function ProcessTimeline({
  maxEvents = 20,
  daysToShow = 30,
  showOnlyRecent = true,
}: ProcessTimelineProps) {
  const { data: demandas = [] } = useDemandasData();
  const { data: documentos = [] } = useDocumentosData();

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const currentDate = new Date();
    const cutoffDate = new Date(
      currentDate.getTime() - daysToShow * 24 * 60 * 60 * 1000
    );

    // Processar demandas
    demandas.forEach(demanda => {
      const dataInicial = new Date(
        demanda.dataInicial.split('/').reverse().join('-')
      );

      if (showOnlyRecent && dataInicial < cutoffDate) {return;}

      // Evento de criação da demanda
      events.push({
        id: `demand-created-${demanda.id}`,
        date: dataInicial,
        title: `Nova Demanda: ${demanda.sged}`,
        description: `Demanda "${demanda.descricao.substring(0, 80)}..." foi criada`,
        type: 'demand-created',
        status: 'completed',
        demandaId: demanda.id,
        icon: <Icon name="folder" size={20} />,
        urgency: 'medium',
      });

      // Evento de finalização (se houver)
      if (demanda.dataFinal) {
        const dataFinal = new Date(
          demanda.dataFinal.split('/').reverse().join('-')
        );

        if (!showOnlyRecent || dataFinal >= cutoffDate) {
          events.push({
            id: `demand-completed-${demanda.id}`,
            date: dataFinal,
            title: `Demanda Finalizada: ${demanda.sged}`,
            description: `Demanda foi concluída com sucesso`,
            type: 'demand-completed',
            status: 'completed',
            demandaId: demanda.id,
            icon: <Icon name="check-circle" size={20} />,
            urgency: 'low',
          });
        }
      } else {
        // Verificar se há alerta de prazo (demandas não finalizadas há mais de 60 dias)
        const daysSinceCreation = Math.ceil(
          (currentDate.getTime() - dataInicial.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation > 60) {
          events.push({
            id: `deadline-alert-${demanda.id}`,
            date: currentDate,
            title: `Alerta de Prazo: ${demanda.sged}`,
            description: `Demanda em aberto há ${daysSinceCreation} dias`,
            type: 'deadline-alert',
            status: daysSinceCreation > 90 ? 'overdue' : 'alert',
            demandaId: demanda.id,
            icon: <Icon name="alert-triangle" size={20} />,
            urgency: daysSinceCreation > 90 ? 'critical' : 'high',
          });
        }
      }
    });

    // Processar documentos
    documentos.forEach(documento => {
      // Evento de envio
      if (documento.dataEnvio) {
        const dataEnvio = new Date(
          documento.dataEnvio.split('/').reverse().join('-')
        );

        if (!showOnlyRecent || dataEnvio >= cutoffDate) {
          const demanda = demandas.find(d => d.id === documento.demandaId);

          events.push({
            id: `document-sent-${documento.id}`,
            date: dataEnvio,
            title: `Documento Enviado: ${documento.numeroDocumento}`,
            description: `${documento.tipoDocumento} enviado para ${documento.destinatario || 'destinatário'} ${demanda ? `(${demanda.sged})` : ''}`,
            type: 'document-sent',
            status: 'completed',
            documentId: documento.id,
            demandaId: documento.demandaId,
            icon: <Icon name="send" size={20} />,
            urgency: 'medium',
          });
        }
      }

      // Evento de resposta
      if (documento.dataResposta) {
        const dataResposta = new Date(
          documento.dataResposta.split('/').reverse().join('-')
        );

        if (!showOnlyRecent || dataResposta >= cutoffDate) {
          const demanda = demandas.find(d => d.id === documento.demandaId);

          events.push({
            id: `document-received-${documento.id}`,
            date: dataResposta,
            title: `Resposta Recebida: ${documento.numeroDocumento}`,
            description: `Resposta de ${documento.destinatario || 'destinatário'} foi registrada ${demanda ? `(${demanda.sged})` : ''}`,
            type: 'document-received',
            status: 'completed',
            documentId: documento.id,
            demandaId: documento.demandaId,
            icon: <Icon name="mail" size={20} />,
            urgency: 'low',
          });
        }
      }
    });

    // Ordenar por data (mais recente primeiro) e limitar quantidade
    return events
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, maxEvents);
  }, [demandas, documentos, maxEvents, daysToShow, showOnlyRecent]);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {return 'Hoje';}
    if (diffDays === 1) {return 'Ontem';}
    if (diffDays <= 7) {return `${diffDays} dias atrás`;}
    if (diffDays <= 30) {return `${Math.ceil(diffDays / 7)} semanas atrás`;}

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEventStyles = (event: TimelineEvent) => {
    const baseStyles = {
      urgency: {
        low: { color: 'var(--color-gray-600)', bg: 'var(--color-gray-100)' },
        medium: {
          color: 'var(--color-primary-600)',
          bg: 'var(--color-primary-100)',
        },
        high: {
          color: 'var(--color-warning-600)',
          bg: 'var(--color-warning-100)',
        },
        critical: {
          color: 'var(--color-error-600)',
          bg: 'var(--color-error-100)',
        },
      },
      status: {
        completed: { border: 'var(--color-success-300)' },
        pending: { border: 'var(--color-warning-300)' },
        overdue: { border: 'var(--color-error-300)' },
        alert: { border: 'var(--color-warning-300)' },
      },
    };

    return {
      color: baseStyles.urgency[event.urgency].color,
      backgroundColor: baseStyles.urgency[event.urgency].bg,
      borderColor: baseStyles.status[event.status].border,
    };
  };

  if (timelineEvents.length === 0) {
    return (
      <div className={styles.emptyTimeline}>
        <div className={styles.emptyIcon}>
          <Icon name="clock" size={48} />
        </div>
        <h3>Nenhum evento recente</h3>
        <p>Não há atividades registradas no período selecionado.</p>
      </div>
    );
  }

  return (
    <div className={styles.processTimeline}>
      <div className={styles.timelineHeader}>
        <div className={styles.headerContent}>
          <Icon name="activity" size={24} />
          <div>
            <h3>Timeline de Processos</h3>
            <p>
              Últimos {daysToShow} dias • {timelineEvents.length} eventos
            </p>
          </div>
        </div>
        <div className={styles.timelineStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {timelineEvents.filter(e => e.urgency === 'critical').length}
            </span>
            <span className={styles.statLabel}>Críticos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {timelineEvents.filter(e => e.type === 'demand-completed').length}
            </span>
            <span className={styles.statLabel}>Finalizadas</span>
          </div>
        </div>
      </div>

      <div className={styles.timelineContent}>
        {timelineEvents.map((event, index) => (
          <div key={event.id} className={styles.timelineItem}>
            <div
              className={styles.timelineMarker}
              style={{ backgroundColor: getEventStyles(event).color }}
            >
              {event.icon}
            </div>

            <div
              className={styles.timelineEvent}
              style={{
                borderLeftColor: getEventStyles(event).borderColor,
                backgroundColor: getEventStyles(event).backgroundColor,
              }}
            >
              <div className={styles.eventHeader}>
                <h4 className={styles.eventTitle}>{event.title}</h4>
                <span className={styles.eventDate}>
                  {formatDate(event.date)}
                </span>
              </div>

              <p className={styles.eventDescription}>{event.description}</p>

              <div className={styles.eventFooter}>
                <span
                  className={styles.eventType}
                  style={{ color: getEventStyles(event).color }}
                >
                  {event.type === 'demand-created' && 'Demanda Criada'}
                  {event.type === 'document-sent' && 'Documento Enviado'}
                  {event.type === 'document-received' && 'Resposta Recebida'}
                  {event.type === 'demand-completed' && 'Demanda Finalizada'}
                  {event.type === 'deadline-alert' && 'Alerta de Prazo'}
                </span>

                {event.urgency === 'critical' && (
                  <span className={styles.urgencyBadge}>
                    <Icon name="alert-triangle" size={12} />
                    Urgente
                  </span>
                )}
              </div>
            </div>

            {index < timelineEvents.length - 1 && (
              <div className={styles.timelineConnector} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.timelineFooter}>
        <button className={styles.loadMoreButton}>
          <Icon name="refresh" size={16} />
          Carregar mais eventos
        </button>
      </div>
    </div>
  );
}
