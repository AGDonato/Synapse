import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import { mockProvedores } from '../../../shared/data/mockProvedores';
import { useDocumentosData } from '../../../shared/hooks/queries/useDocumentos';
import { useProviderFilters } from '../../../shared/hooks/useProviderFilters';
import ProviderFilters from './ProviderFilters';
import {
  applyProviderLimitToBoxplotData,
  calculateProviderDemands,
} from '../../../shared/utils/providerDemandUtils';
import {
  STANDARD_TOOLTIP_CONFIG,
  createTooltipHTML,
} from '../../../shared/utils/chartTooltipConfig';
import styles from './ResponseTimeBoxplot.module.css';

interface ResponseTimeBoxplotProps {
  filters?: ReturnType<typeof useProviderFilters>;
  selectedYears?: string[];
}

const ResponseTimeBoxplot: React.FC<ResponseTimeBoxplotProps> = ({
  filters: externalFilters,
  selectedYears = [],
}) => {
  const { data: documentos = [] } = useDocumentosData();
  const internalFilters = useProviderFilters();
  const filters = externalFilters || internalFilters;

  const boxplotData = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return { providers: [], rawData: [] };
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
            const [diaEnvio, mesEnvio, anoEnvio] = destinatarioData.dataEnvio.split('/');
            const sentDate = new Date(
              parseInt(anoEnvio),
              parseInt(mesEnvio) - 1,
              parseInt(diaEnvio)
            );

            let responseDate: Date;
            if (destinatarioData.dataResposta) {
              const [diaResp, mesResp, anoResp] = destinatarioData.dataResposta.split('/');
              responseDate = new Date(parseInt(anoResp), parseInt(mesResp) - 1, parseInt(diaResp));
            } else {
              responseDate = new Date(); // Use current date if not responded
            }

            const responseTime = Math.ceil(
              (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Apenas adicionar tempos de resposta válidos (positivos)
            if (responseTime <= 0) {
              return;
            }

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
        const [diaEnvio, mesEnvio, anoEnvio] = doc.dataEnvio.split('/');
        const sentDate = new Date(parseInt(anoEnvio), parseInt(mesEnvio) - 1, parseInt(diaEnvio));

        let responseDate: Date;
        if (doc.dataResposta) {
          const [diaResp, mesResp, anoResp] = doc.dataResposta.split('/');
          responseDate = new Date(parseInt(anoResp), parseInt(mesResp) - 1, parseInt(diaResp));
        } else {
          responseDate = new Date(); // Use current date if not responded
        }

        const responseTime = Math.ceil(
          (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Apenas adicionar tempos de resposta válidos (positivos)
        if (responseTime <= 0) {
          return;
        }

        if (!providerResponseTimes.has(providerName)) {
          providerResponseTimes.set(providerName, []);
        }
        providerResponseTimes.get(providerName)!.push(responseTime);
      }
    });

    // Prepare data for ECharts transform - each provider's data as separate array
    const providers: string[] = [];
    const rawData: (string | number)[][] = [];

    // Sort providers by alphabetical order
    const providerMedians = Array.from(providerResponseTimes.entries())
      .map(([provider, times]) => ({
        provider,
        times,
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));

    // Build data structure for ECharts transform
    providerMedians.forEach(({ provider, times }, providerIndex) => {
      if (times.length > 0) {
        providers.push(provider);
        // Add each response time as a separate row with [providerIndex, responseTime]
        times.forEach(time => {
          rawData.push([providerIndex, time]);
        });
      }
    });

    // Calculate provider demands and apply limit filter
    const providerDemands = calculateProviderDemands(documentos, allowedSubjects);
    const limitedData = applyProviderLimitToBoxplotData(
      providers,
      rawData,
      filters.providerLimit,
      providerDemands
    );

    return limitedData;
  }, [filters, documentos, selectedYears]);

  const chartOptions = useMemo(() => {
    return {
      dataset: [
        {
          // Dataset 0: Raw data source
          source: boxplotData.rawData,
        },
        {
          // Dataset 1: Boxplot transform - generates boxplot + outlier data
          transform: {
            type: 'boxplot',
            config: {
              itemNameFormatter: (params: { value: number }) => boxplotData.providers[params.value],
            },
          },
        },
        {
          // Dataset 2: Outlier data from transform result
          fromDatasetIndex: 1,
          fromTransformResult: 1,
        },
      ],
      tooltip: [
        {
          ...STANDARD_TOOLTIP_CONFIG,
          trigger: 'item',
          axisPointer: { type: 'shadow' },
          formatter: function (params: {
            componentType: string;
            seriesType?: string;
            data: number[];
            name: string;
          }) {
            if (params.componentType === 'series') {
              if (params.seriesType === 'boxplot') {
                return createTooltipHTML({
                  title: params.name,
                  items: [
                    {
                      label: 'Extremo inferior',
                      value: `${params.data[1]} dias`,
                      isSecondary: true,
                    },
                    {
                      label: '1º Quartil (Q1)',
                      value: `${params.data[2]} dias`,
                      isSecondary: true,
                    },
                    {
                      label: 'Mediana',
                      value: `${params.data[3]} dias`,
                      color: '#3b82f6',
                    },
                    {
                      label: '3º Quartil (Q3)',
                      value: `${params.data[4]} dias`,
                      isSecondary: true,
                    },
                    {
                      label: 'Extremo superior',
                      value: `${params.data[5]} dias`,
                      isSecondary: true,
                    },
                  ],
                  footer: '* Inclui documentos pendentes (tempo até hoje)',
                });
              } else if (params.seriesType === 'scatter') {
                return createTooltipHTML({
                  title: boxplotData.providers[params.data[0]],
                  items: [
                    {
                      label: '⚠️ Outlier',
                      value: `${params.data[1]} dias`,
                      color: '#ef4444',
                    },
                  ],
                  footer: 'Valor extremo (pode incluir documento pendente)',
                });
              }
            }
            return '';
          },
        },
      ],
      grid: {
        left: '10%',
        right: '6%',
        bottom: '3%',
        top: 50,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: boxplotData.providers,
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
          name: 'Tempo de Resposta',
          type: 'boxplot',
          datasetIndex: 1,
          itemStyle: {
            borderColor: '#3b82f6',
            color: '#dbeafe',
            borderWidth: 1.5,
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderColor: '#1d4ed8',
              color: '#bfdbfe',
              borderWidth: 2,
            },
          },
        },
        {
          name: 'Outliers',
          type: 'scatter',
          datasetIndex: 2,
          symbolSize: 8,
          itemStyle: {
            color: '#ef4444',
            opacity: 0.8,
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#dc2626',
              opacity: 1,
              borderColor: '#991b1b',
              borderWidth: 1,
            },
          },
        },
      ],
    };
  }, [boxplotData]);

  return (
    <div className={styles.container}>
      {/* Título Padronizado */}
      <div>
        <div className={styles.titleSection}>
          <div className={styles.titleIndicator} />
          <h3 className={styles.title}>Distribuição de Tempo de Resposta</h3>
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
      {boxplotData.providers.length > 0 ? (
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
            Selecione pelo menos um filtro para visualizar os dados de tempo de resposta
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTimeBoxplot;
