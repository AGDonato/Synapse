import React, { useMemo } from 'react';
import Icon from '../ui/Icon';
import { useDemandas } from '../../hooks/useDemandas';
import { useDocumentos } from '../../hooks/useDocumentos';
import styles from './TransparencyPanel.module.css';

interface ComplianceMetric {
  id: string;
  title: string;
  description: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ReactElement;
  legalBasis?: string;
}

/**
 * Painel de Transparência para Órgão Público
 *
 * Apresenta métricas de compliance, cumprimento de prazos legais e transparência
 * administrativa adequadas para o contexto de órgãos públicos brasileiros.
 */
export default function TransparencyPanel() {
  const { demandas } = useDemandas();
  const { documentos } = useDocumentos();

  const complianceMetrics = useMemo((): ComplianceMetric[] => {
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(
      currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Filtrar demandas e documentos dos últimos 30 dias
    const recentDemands = demandas.filter(demanda => {
      const dataInicial = new Date(
        demanda.dataInicial.split('/').reverse().join('-')
      );
      return dataInicial >= thirtyDaysAgo;
    });

    const recentDocuments = documentos.filter(doc => {
      if (!doc.dataEnvio) return false;
      const dataEnvio = new Date(doc.dataEnvio.split('/').reverse().join('-'));
      return dataEnvio >= thirtyDaysAgo;
    });

    // Métrica 1: Taxa de cumprimento de prazos (LAI - 20 dias)
    const documentsWithResponse = recentDocuments.filter(
      doc => doc.dataResposta
    );
    const onTimeResponses = documentsWithResponse.filter(doc => {
      if (!doc.dataEnvio || !doc.dataResposta) return false;

      const envio = new Date(doc.dataEnvio.split('/').reverse().join('-'));
      const resposta = new Date(
        doc.dataResposta.split('/').reverse().join('-')
      );
      const daysDiff = Math.ceil(
        (resposta.getTime() - envio.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysDiff <= 20; // Lei de Acesso à Informação - 20 dias úteis
    });

    const onTimeRate =
      documentsWithResponse.length > 0
        ? Math.round(
            (onTimeResponses.length / documentsWithResponse.length) * 100
          )
        : 100;

    // Métrica 2: Taxa de transparência ativa
    const totalDocuments = recentDocuments.length;
    const publicDocuments = recentDocuments.filter(
      doc =>
        doc.tipoDocumento === 'Relatório Técnico' ||
        doc.tipoDocumento === 'Relatório de Inteligência'
    ).length;

    const transparencyRate =
      totalDocuments > 0
        ? Math.round((publicDocuments / totalDocuments) * 100)
        : 0;

    // Métrica 3: Eficiência processual
    const completedDemands = recentDemands.filter(
      d => d.status === 'Finalizada'
    );
    const avgProcessingTime =
      completedDemands.length > 0
        ? completedDemands.reduce((acc, demanda) => {
            if (!demanda.dataFinal) return acc;

            const inicio = new Date(
              demanda.dataInicial.split('/').reverse().join('-')
            );
            const fim = new Date(
              demanda.dataFinal.split('/').reverse().join('-')
            );
            const days = Math.ceil(
              (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
            );

            return acc + days;
          }, 0) / completedDemands.length
        : 0;

    // Métrica 4: Taxa de resposta
    const totalRequests = recentDocuments.filter(
      doc =>
        doc.tipoDocumento === 'Ofício' ||
        doc.tipoDocumento === 'Ofício Circular'
    ).length;

    const respondedRequests = recentDocuments.filter(
      doc =>
        (doc.tipoDocumento === 'Ofício' ||
          doc.tipoDocumento === 'Ofício Circular') &&
        doc.dataResposta
    ).length;

    const responseRate =
      totalRequests > 0
        ? Math.round((respondedRequests / totalRequests) * 100)
        : 100;

    return [
      {
        id: 'law-compliance',
        title: 'Cumprimento de Prazo LAI',
        description: 'Solicitações respondidas dentro de 20 dias úteis',
        value: onTimeRate,
        target: 90,
        unit: '%',
        status:
          onTimeRate >= 90
            ? 'excellent'
            : onTimeRate >= 80
              ? 'good'
              : onTimeRate >= 70
                ? 'warning'
                : 'critical',
        icon: <Icon name="scales" size={24} />,
        legalBasis: 'Lei 12.527/2011 - Lei de Acesso à Informação',
      },
      {
        id: 'active-transparency',
        title: 'Transparência Ativa',
        description: 'Documentos publicados proativamente',
        value: transparencyRate,
        target: 80,
        unit: '%',
        status:
          transparencyRate >= 80
            ? 'excellent'
            : transparencyRate >= 60
              ? 'good'
              : transparencyRate >= 40
                ? 'warning'
                : 'critical',
        icon: <Icon name="eye" size={24} />,
        legalBasis: 'Art. 8º da Lei 12.527/2011',
      },
      {
        id: 'process-efficiency',
        title: 'Eficiência Processual',
        description: 'Tempo médio de tramitação de demandas',
        value: Math.round(avgProcessingTime),
        target: 30,
        unit: 'dias',
        status:
          avgProcessingTime <= 30
            ? 'excellent'
            : avgProcessingTime <= 45
              ? 'good'
              : avgProcessingTime <= 60
                ? 'warning'
                : 'critical',
        icon: <Icon name="clock" size={24} />,
        legalBasis: 'Princípio da Eficiência - Art. 37, CF/88',
      },
      {
        id: 'response-rate',
        title: 'Taxa de Resposta',
        description: 'Solicitações formalmente respondidas',
        value: responseRate,
        target: 95,
        unit: '%',
        status:
          responseRate >= 95
            ? 'excellent'
            : responseRate >= 90
              ? 'good'
              : responseRate >= 85
                ? 'warning'
                : 'critical',
        icon: <Icon name="mail" size={24} />,
        legalBasis: 'Princípio da Moralidade Administrativa',
      },
    ];
  }, [demandas, documentos]);

  const getStatusColor = (status: ComplianceMetric['status']) => {
    switch (status) {
      case 'excellent':
        return 'var(--color-success-600)';
      case 'good':
        return 'var(--color-primary-600)';
      case 'warning':
        return 'var(--color-warning-600)';
      case 'critical':
        return 'var(--color-error-600)';
      default:
        return 'var(--color-gray-600)';
    }
  };

  const getStatusLabel = (status: ComplianceMetric['status']) => {
    switch (status) {
      case 'excellent':
        return 'Excelente';
      case 'good':
        return 'Bom';
      case 'warning':
        return 'Atenção';
      case 'critical':
        return 'Crítico';
      default:
        return 'N/A';
    }
  };

  const overallScore = useMemo(() => {
    const scores = complianceMetrics.map(metric => {
      const percentage =
        metric.unit === '%'
          ? metric.value
          : metric.unit === 'dias'
            ? Math.max(0, 100 - (metric.value / metric.target) * 100)
            : (metric.value / metric.target) * 100;

      return Math.min(100, Math.max(0, percentage));
    });

    return Math.round(
      scores.reduce((acc, score) => acc + score, 0) / scores.length
    );
  }, [complianceMetrics]);

  return (
    <div className={styles.transparencyPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Icon name="shield-check" size={28} />
          </div>
          <div className={styles.headerText}>
            <h2>Painel de Transparência</h2>
            <p>Métricas de compliance e transparência administrativa</p>
          </div>
        </div>
        <div className={styles.overallScore}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreValue}>{overallScore}</span>
            <span className={styles.scoreUnit}>pts</span>
          </div>
          <div className={styles.scoreLabel}>
            Índice Geral
            <span className={styles.scoreSubtitle}>Último período</span>
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {complianceMetrics.map(metric => (
          <div key={metric.id} className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div
                className={styles.metricIcon}
                style={{ color: getStatusColor(metric.status) }}
              >
                {metric.icon}
              </div>
              <div
                className={styles.metricStatus}
                style={{ color: getStatusColor(metric.status) }}
              >
                {getStatusLabel(metric.status)}
              </div>
            </div>

            <div className={styles.metricContent}>
              <div className={styles.metricValue}>
                {metric.value}
                <span className={styles.metricUnit}>{metric.unit}</span>
              </div>

              <h4 className={styles.metricTitle}>{metric.title}</h4>
              <p className={styles.metricDescription}>{metric.description}</p>

              <div className={styles.metricProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                      backgroundColor: getStatusColor(metric.status),
                    }}
                  />
                </div>
                <span className={styles.progressTarget}>
                  Meta: {metric.target}
                  {metric.unit}
                </span>
              </div>

              {metric.legalBasis && (
                <div className={styles.legalBasis}>
                  <Icon name="gavel" size={14} />
                  <span>{metric.legalBasis}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.panelFooter}>
        <div className={styles.footerNote}>
          <Icon name="info" size={16} />
          <span>
            Dados atualizados automaticamente. Período de referência: últimos 30
            dias. Para informações detalhadas, consulte os relatórios
            específicos.
          </span>
        </div>
      </div>
    </div>
  );
}
