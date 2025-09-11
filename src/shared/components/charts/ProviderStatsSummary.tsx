import { useMemo } from 'react';
import { mockProvedores } from '../../../shared/data/mockProvedores';
import { useDocumentosData } from '../../../shared/hooks/queries/useDocumentos';
import type { useProviderFilters } from '../../../shared/hooks/useProviderFilters';
import ProviderFilters from './ProviderFilters';
import styles from './ProviderStatsSummary.module.css';

// Função para formatar números decimais no padrão brasileiro
const formatDecimalBR = (value: number, decimals = 1): string => {
  return value.toFixed(decimals).replace('.', ',');
};

interface ProviderStatsSummaryProps {
  filters: ReturnType<typeof useProviderFilters>;
  selectedYears?: string[];
}

const ProviderStatsSummary: React.FC<ProviderStatsSummaryProps> = ({
  filters,
  selectedYears = [],
}) => {
  const { data: documentos = [] } = useDocumentosData();

  const stats = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty stats
    if (allowedSubjects.length === 0) {
      return {
        totalProviders: 0,
        totalDocuments: 0,
        averageTime: 0,
        respondedDocuments: 0,
        responseRate: 0,
      };
    }

    // Filter documents by selected years (using dataEnvio)
    const yearFilteredDocumentos = documentos.filter(doc => {
      if (!doc.dataEnvio) return false;
      const year = doc.dataEnvio.split('/')[2];
      return selectedYears.length > 0 ? selectedYears.includes(year) : true;
    });

    // Filter documents that should be included in analysis
    const documentsToProviders = yearFilteredDocumentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) {
        return false;
      }

      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) {
        return false;
      }

      // Must have been sent
      return doc.dataEnvio;
    });

    // Collect all provider data for statistics
    const providerStats = new Map<
      string,
      {
        totalDocuments: number;
        respondedDocuments: number;
        responseTimes: number[];
      }
    >();

    documentsToProviders.forEach(doc => {
      if (doc.tipoDocumento === 'Ofício Circular') {
        // Handle Ofício Circular - process each individual destinatário
        if (doc.destinatariosData) {
          doc.destinatariosData.forEach(destinatarioData => {
            const providerName = destinatarioData.nome;

            // Check if this provider is in mockProvedores
            const isValidProvider = mockProvedores.some(
              provedor => provedor.nomeFantasia === providerName
            );

            if (!isValidProvider || !destinatarioData.dataEnvio) {
              return;
            }

            // Initialize provider stats if not exists
            if (!providerStats.has(providerName)) {
              providerStats.set(providerName, {
                totalDocuments: 0,
                respondedDocuments: 0,
                responseTimes: [],
              });
            }

            const stats = providerStats.get(providerName)!;
            stats.totalDocuments++;

            if (destinatarioData.respondido && destinatarioData.dataResposta) {
              stats.respondedDocuments++;

              // Calculate response time in days
              const sentDate = new Date(destinatarioData.dataEnvio.split('/').reverse().join('-'));
              const responseDate = new Date(
                destinatarioData.dataResposta.split('/').reverse().join('-')
              );
              const responseTime = Math.ceil(
                (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              stats.responseTimes.push(responseTime);
            } else {
              // For non-responded documents, calculate time until today
              const sentDate = new Date(destinatarioData.dataEnvio.split('/').reverse().join('-'));
              const currentDate = new Date();
              const responseTime = Math.ceil(
                (currentDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              stats.responseTimes.push(responseTime);
            }
          });
        }
      } else {
        // Handle regular Ofício
        const providerName = doc.destinatario;

        // Check if destinatario is a provider
        const isProvider = mockProvedores.some(provedor => provedor.nomeFantasia === providerName);

        if (!isProvider) {
          return;
        }

        // Initialize provider stats if not exists
        if (!providerStats.has(providerName)) {
          providerStats.set(providerName, {
            totalDocuments: 0,
            respondedDocuments: 0,
            responseTimes: [],
          });
        }

        const stats = providerStats.get(providerName)!;
        stats.totalDocuments++;

        if (doc.respondido && doc.dataResposta) {
          stats.respondedDocuments++;

          // Calculate response time in days
          if (!doc.dataEnvio) return;
          const sentDate = new Date(doc.dataEnvio.split('/').reverse().join('-'));
          const responseDate = new Date(doc.dataResposta.split('/').reverse().join('-'));
          const responseTime = Math.ceil(
            (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          stats.responseTimes.push(responseTime);
        } else {
          // For non-responded documents, calculate time until today
          if (!doc.dataEnvio) return;
          const sentDate = new Date(doc.dataEnvio.split('/').reverse().join('-'));
          const currentDate = new Date();
          const responseTime = Math.ceil(
            (currentDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          stats.responseTimes.push(responseTime);
        }
      }
    });

    // Calculate aggregate statistics
    const totalProviders = providerStats.size;

    let totalDocuments = 0;
    let totalResponded = 0;
    let allResponseTimes: number[] = [];

    providerStats.forEach(stats => {
      totalDocuments += stats.totalDocuments;
      totalResponded += stats.respondedDocuments;
      allResponseTimes = allResponseTimes.concat(stats.responseTimes);
    });

    const averageTime =
      allResponseTimes.length > 0
        ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
        : 0;

    const responseRate = totalDocuments > 0 ? (totalResponded / totalDocuments) * 100 : 0;

    return {
      totalProviders,
      totalDocuments,
      averageTime,
      respondedDocuments: totalResponded,
      responseRate,
    };
  }, [filters, documentos, selectedYears]);

  if (stats.totalProviders === 0) {
    return (
      <div className={styles.summaryContainer}>
        <ProviderFilters
          filters={filters.filters}
          onToggleFilter={filters.toggleFilter}
          providerLimit={filters.providerLimit}
          onLimitChange={filters.setProviderLimit}
        />
        <div className={styles.noFilterMessage}>
          Selecione pelo menos um filtro para visualizar as estatísticas
        </div>
      </div>
    );
  }

  return (
    <div className={styles.summaryContainer}>
      <ProviderFilters
        filters={filters.filters}
        onToggleFilter={filters.toggleFilter}
        providerLimit={filters.providerLimit}
        onLimitChange={filters.setProviderLimit}
      />
      <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
        {/* Provedores Analisados */}
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.providers}`}>{stats.totalProviders}</div>
          <div className={styles.statLabel}>Provedores Analisados</div>
        </div>

        {/* Total de Documentos */}
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.documents}`}>{stats.totalDocuments}</div>
          <div className={styles.statLabel}>Total de Documentos</div>
        </div>

        {/* Documentos Respondidos */}
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.responded}`}>
            {stats.respondedDocuments}
          </div>
          <div className={styles.statLabel}>Documentos Respondidos</div>
        </div>

        {/* Tempo Médio Geral */}
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.averageTime}`}>
            {Math.floor(stats.averageTime)}{' '}
            <span style={{ fontSize: '1rem', fontWeight: 400 }}>dias</span>
          </div>
          <div className={styles.statLabel}>Tempo Médio Geral</div>
        </div>

        {/* Taxa Geral de Resposta */}
        <div className={styles.statItem}>
          <div
            className={`${styles.statValue} ${styles.responseRate} ${
              stats.responseRate >= 70
                ? styles.excellent
                : stats.responseRate >= 50
                  ? styles.good
                  : styles.poor
            }`}
          >
            {formatDecimalBR(stats.responseRate)}%
          </div>
          <div className={styles.statLabel}>Taxa Geral de Resposta</div>
        </div>
      </div>
    </div>
  );
};

export default ProviderStatsSummary;
