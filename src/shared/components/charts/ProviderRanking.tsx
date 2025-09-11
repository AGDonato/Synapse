import { useMemo } from 'react';
import { mockProvedores } from '../../../shared/data/mockProvedores';
import { useDocumentosData } from '../../../shared/hooks/queries/useDocumentos';
import type { useProviderFilters } from '../../../shared/hooks/useProviderFilters';
import styles from './ProviderRanking.module.css';

// Função para formatar números decimais no padrão brasileiro
const formatDecimalBR = (value: number, decimals = 1): string => {
  return value.toFixed(decimals).replace('.', ',');
};

interface ProviderPerformance {
  name: string;
  averageTime: number;
  totalDocuments: number;
}

interface ProviderRankingProps {
  filters: ReturnType<typeof useProviderFilters>;
  selectedYears?: string[];
}

const ProviderRanking: React.FC<ProviderRankingProps> = ({ filters, selectedYears = [] }) => {
  const { data: documentos = [] } = useDocumentosData();

  const { topProviders, bottomProviders } = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return { topProviders: [], bottomProviders: [] };
    }

    // Filter documents by selected years (using dataEnvio)
    const yearFilteredDocumentos = documentos.filter(doc => {
      if (!doc.dataEnvio) return false;
      const year = doc.dataEnvio.split('/')[2];
      return selectedYears.length > 0 ? selectedYears.includes(year) : true;
    });

    // Filter documents that should have response times
    const documentsWithResponseTime = yearFilteredDocumentos.filter(doc => {
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) {
        return false;
      }
      if (!allowedSubjects.includes(doc.assunto)) {
        return false;
      }
      return doc.dataEnvio;
    });

    // Group response times by provider
    const providerResponseTimes = new Map<string, number[]>();

    documentsWithResponseTime.forEach(doc => {
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

            // Calculate response time in days (use current date if not responded yet)
            const sentDate = new Date(destinatarioData.dataEnvio.split('/').reverse().join('-'));
            const responseDate = destinatarioData.dataResposta
              ? new Date(destinatarioData.dataResposta.split('/').reverse().join('-'))
              : new Date(); // Use current date if not responded
            const responseTime = Math.ceil(
              (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (!providerResponseTimes.has(providerName)) {
              providerResponseTimes.set(providerName, []);
            }
            providerResponseTimes.get(providerName)!.push(responseTime);
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

        // Calculate response time in days (use current date if not responded yet)
        if (!doc.dataEnvio) return;
        const sentDate = new Date(doc.dataEnvio.split('/').reverse().join('-'));
        const responseDate = doc.dataResposta
          ? new Date(doc.dataResposta.split('/').reverse().join('-'))
          : new Date(); // Use current date if not responded
        const responseTime = Math.ceil(
          (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!providerResponseTimes.has(providerName)) {
          providerResponseTimes.set(providerName, []);
        }
        providerResponseTimes.get(providerName)!.push(responseTime);
      }
    });

    // Calculate average response time for each provider
    const providerPerformances: ProviderPerformance[] = [];

    providerResponseTimes.forEach((times, provider) => {
      if (times.length > 0) {
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        providerPerformances.push({
          name: provider,
          averageTime: Math.floor(averageTime),
          totalDocuments: times.length,
        });
      }
    });

    // Sort by average time (ascending = better performance)
    const sortedPerformances = providerPerformances.sort((a, b) => a.averageTime - b.averageTime);

    // Get top 3 (best) and bottom 3 (worst)
    const topProviders = sortedPerformances.slice(0, 3);
    const bottomProviders = sortedPerformances.slice(-3).reverse();

    return { topProviders, bottomProviders };
  }, [filters, documentos, selectedYears]);

  if (topProviders.length === 0 && bottomProviders.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <div className={styles.noDataIcon}>📊</div>
        <div className={styles.noDataTitle}>Nenhum dado disponível</div>
        <div className={styles.noDataSubtitle}>Selecione filtros para ver o ranking</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Título Padronizado */}
      <div>
        <div className={styles.titleSection}>
          <div className={styles.titleIndicator} />
          <h3 className={styles.title}>Ranking de Provedores</h3>
        </div>
      </div>

      <div className={styles.sectionsContainer}>
        {/* Top Performers */}
        <div className={styles.section}>
          <h4 className={`${styles.sectionTitle} ${styles.topPerformers}`}>Mais Rápidos</h4>

          <div className={styles.providerList}>
            {topProviders.map((provider, index) => (
              <div
                key={provider.name}
                className={`${styles.providerItem} ${
                  index === 0 ? styles.topFirst : styles.regular
                }`}
              >
                <div
                  className={`${styles.rankBadge} ${
                    index === 0 ? styles.first : index === 1 ? styles.second : styles.third
                  }`}
                >
                  {index + 1}
                </div>
                <div className={styles.providerInfo}>
                  <div className={styles.providerName}>{provider.name}</div>
                </div>
                <div className={`${styles.providerTime} ${styles.fast}`}>
                  {provider.averageTime} dias
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Performers */}
        <div className={styles.section}>
          <h4 className={`${styles.sectionTitle} ${styles.bottomPerformers}`}>Mais Lentos</h4>

          <div className={styles.providerList}>
            {bottomProviders.map((provider, index) => (
              <div
                key={provider.name}
                className={`${styles.providerItem} ${
                  index === 0 ? styles.bottomFirst : styles.regular
                }`}
              >
                <div
                  className={`${styles.rankBadge} ${
                    index === 0
                      ? styles.bottomFirst
                      : index === 1
                        ? styles.bottomSecond
                        : styles.bottomThird
                  }`}
                >
                  {index + 1}
                </div>
                <div className={styles.providerInfo}>
                  <div className={styles.providerName}>{provider.name}</div>
                </div>
                <div className={`${styles.providerTime} ${styles.slow}`}>
                  {provider.averageTime} dias
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderRanking;
