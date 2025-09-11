import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import { mockProvedores } from '../../../shared/data/mockProvedores';
import { useDocumentosData } from '../../../shared/hooks/queries/useDocumentos';
import { useProviderFilters } from '../../../shared/hooks/useProviderFilters';
import ProviderFilters from './ProviderFilters';
import {
  applyProviderLimit,
  calculateProviderDemands,
} from '../../../shared/utils/providerDemandUtils';
import { AXIS_TOOLTIP_CONFIG, createTooltipHTML } from '../../../shared/utils/chartTooltipConfig';
import styles from './AverageResponseTimeChart.module.css';

interface AverageResponseTimeData {
  name: string;
  averageTime: number;
  totalDocuments: number;
}

interface AverageResponseTimeChartProps {
  filters?: ReturnType<typeof useProviderFilters>;
  selectedYears?: string[];
}

const AverageResponseTimeChart: React.FC<AverageResponseTimeChartProps> = ({
  filters: externalFilters,
  selectedYears = [],
}) => {
  const { data: documentos = [] } = useDocumentosData();
  const internalFilters = useProviderFilters();
  const filters = externalFilters ?? internalFilters;

  const averageData = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return [];
    }

    // Filter documents by selected years (using dataEnvio)
    const yearFilteredDocumentos = documentos.filter(doc => {
      if (!doc.dataEnvio) return false;
      const year = doc.dataEnvio.split('/')[2];
      return selectedYears.length > 0 ? selectedYears.includes(year) : true;
    });

    // Filter documents that should have response times (Ofícios and Ofícios Circulares to providers)
    const documentsWithResponseTime = yearFilteredDocumentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) {
        return false;
      }

      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) {
        return false;
      }

      // Must have been sent (resposta é opcional - usará data atual se não respondido)
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
            const providerTimes = providerResponseTimes.get(providerName);
            if (providerTimes) {
              providerTimes.push(responseTime);
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

        // Calculate response time in days (use current date if not responded yet)
        const sentDate = new Date(doc.dataEnvio?.split('/').reverse().join('-') ?? '');
        const responseDate = doc.dataResposta
          ? new Date(doc.dataResposta.split('/').reverse().join('-'))
          : new Date(); // Use current date if not responded
        const responseTime = Math.ceil(
          (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!providerResponseTimes.has(providerName)) {
          providerResponseTimes.set(providerName, []);
        }
        const providerTimes = providerResponseTimes.get(providerName);
        if (providerTimes) {
          providerTimes.push(responseTime);
        }
      }
    });

    // Calculate average response time for each provider
    const averageData: AverageResponseTimeData[] = [];

    providerResponseTimes.forEach((times, provider) => {
      if (times.length > 0) {
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        averageData.push({
          name: provider,
          averageTime: Math.round(averageTime * 10) / 10, // Round to 1 decimal place
          totalDocuments: times.length,
        });
      }
    });

    // Calculate provider demands to determine top providers
    const providerDemands = calculateProviderDemands(documentos, allowedSubjects);

    // Sort by provider name (alphabetical order)
    const sortedResult = averageData.sort((a, b) => a.name.localeCompare(b.name));

    // Apply provider limit filter
    return applyProviderLimit(sortedResult, filters.providerLimit, providerDemands);
  }, [filters, documentos, selectedYears]);

  const chartOptions = useMemo(() => {
    if (averageData.length === 0) {
      return {}; // Retorna early para dados vazios
    }

    const providers = averageData.map(item => item.name);
    const averageTimes = averageData.map(item => item.averageTime);

    return {
      tooltip: {
        ...AXIS_TOOLTIP_CONFIG,
        formatter: function (params: { dataIndex: number; value: number; name: string }[]) {
          if (params && params.length > 0) {
            const data = params[0];
            const providerData = averageData[data.dataIndex];

            return createTooltipHTML({
              title: data.name,
              items: [
                {
                  label: 'Tempo Médio',
                  value: `${data.value} dias`,
                  color: 'var(--color-brand-500)',
                },
                {
                  label: 'Total de Documentos',
                  value: providerData.totalDocuments,
                  isSecondary: true,
                },
              ],
            });
          }
          return '';
        },
      },
      grid: {
        left: '10%',
        right: '3%',
        bottom: '3%',
        top: 50,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: providers,
        axisTick: {
          alignWithLabel: true,
        },
        axisLabel: {
          rotate: 45,
          fontSize: 9,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Tempo (dia)',
        nameLocation: 'middle',
        nameGap: 60,
        axisLabel: {
          formatter: '{value}d',
        },
      },
      series: [
        {
          name: 'Tempo Médio de Resposta',
          type: 'bar',
          data: averageTimes,
          itemStyle: {
            color: 'var(--color-brand-500)',
            borderRadius: [0, 0, 0, 0],
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: 'var(--color-brand-700)',
              borderWidth: 1,
              borderColor: 'var(--color-brand-800)',
            },
          },
        },
      ],
    };
  }, [averageData]);

  return (
    <div className={styles.container}>
      {/* Título Padronizado */}
      <div>
        <div className={styles.titleSection}>
          <div className={styles.titleIndicator} />
          <h3 className={styles.title}>Tempo Médio de Resposta</h3>
        </div>
      </div>

      {/* Filter Buttons - only show if using internal filters */}
      {!externalFilters && (
        <ProviderFilters
          filters={filters.filters}
          onToggleFilter={filters.toggleFilter}
          providerLimit={filters.providerLimit}
          onLimitChange={filters.setProviderLimit}
        />
      )}

      {/* Chart */}
      {averageData.length > 0 ? (
        <ReactECharts
          option={chartOptions}
          className={styles.chartContainer}
          style={{ height: '350px', minHeight: '350px' }}
          opts={{ renderer: 'svg' }}
        />
      ) : (
        <div className={styles.noDataContainer}>
          <div className={styles.noDataIcon}>📊</div>
          <div className={styles.noDataTitle}>Nenhum dado disponível</div>
          <div className={styles.noDataSubtitle}>
            Selecione pelo menos um filtro para visualizar os dados de tempo médio
          </div>
        </div>
      )}
    </div>
  );
};

export default AverageResponseTimeChart;
