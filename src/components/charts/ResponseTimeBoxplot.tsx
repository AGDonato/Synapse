import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useProviderFilters } from '../../hooks/useProviderFilters';
import ProviderFilters from './ProviderFilters';
import {
  calculateProviderDemands,
  applyProviderLimitToBoxplotData,
} from '../../utils/providerDemandUtils';

interface ResponseTimeBoxplotProps {
  filters?: ReturnType<typeof useProviderFilters>;
}

const ResponseTimeBoxplot: React.FC<ResponseTimeBoxplotProps> = ({
  filters: externalFilters,
}) => {
  const { documentos } = useDocumentos();
  const internalFilters = useProviderFilters();
  const filters = externalFilters || internalFilters;

  const boxplotData = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return { providers: [], rawData: [] };
    }

    // Filter documents that should have response times (Ofícios and Ofícios Circulares to providers)
    const documentsWithResponseTime = documentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento))
        return false;

      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) return false;

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

            if (!isValidProvider || !destinatarioData.dataEnvio) return;

            // Calculate response time in days (use current date if not responded yet)
            const sentDate = new Date(
              destinatarioData.dataEnvio.split('/').reverse().join('-')
            );
            const responseDate = destinatarioData.dataResposta
              ? new Date(
                  destinatarioData.dataResposta.split('/').reverse().join('-')
                )
              : new Date(); // Use current date if not responded
            const responseTime = Math.ceil(
              (responseDate.getTime() - sentDate.getTime()) /
                (1000 * 60 * 60 * 24)
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
        const isProvider = mockProvedores.some(
          provedor => provedor.nomeFantasia === providerName
        );

        if (!isProvider) return;

        // Calculate response time in days (use current date if not responded yet)
        const sentDate = new Date(
          doc.dataEnvio!.split('/').reverse().join('-')
        );
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
    const providerDemands = calculateProviderDemands(
      documentos,
      allowedSubjects
    );
    const limitedData = applyProviderLimitToBoxplotData(
      providers,
      rawData,
      filters.providerLimit,
      providerDemands
    );

    return limitedData;
  }, [filters.filters, filters.providerLimit, documentos]);

  const chartOptions = useMemo(() => {
    return {
      title: {
        text: 'Tempo de Resposta por Provedor (Boxplot)',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1e293b',
        },
      },
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
              itemNameFormatter: (params: { value: number }) =>
                boxplotData.providers[params.value],
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
                return `
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
                    <div><strong>Extremo inferior:</strong> ${params.data[1]} dias</div>
                    <div><strong>1º Quartil (Q1):</strong> ${params.data[2]} dias</div>
                    <div style="font-weight: bold; color: #3b82f6;"><strong>Mediana:</strong> ${params.data[3]} dias</div>
                    <div><strong>3º Quartil (Q3):</strong> ${params.data[4]} dias</div>
                    <div><strong>Extremo superior:</strong> ${params.data[5]} dias</div>
                    <div style="margin-top: 8px; font-size: 0.8em; color: #64748b;">
                      <em>* Inclui documentos pendentes (tempo até hoje)</em>
                    </div>
                  </div>
                `;
              } else if (params.seriesType === 'scatter') {
                return `
                  <div style="padding: 8px;">
                    <div style="font-weight: bold; margin-bottom: 8px;">${boxplotData.providers[params.data[0]]}</div>
                    <div style="color: #ef4444;"><strong>⚠️ Outlier:</strong> ${params.data[1]} dias</div>
                    <div style="margin-top: 4px; font-size: 0.8em; color: #64748b;">
                      <em>Valor extremo (pode incluir documento pendente)</em>
                    </div>
                  </div>
                `;
              }
            }
            return '';
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: boxplotData.providers,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Tempo de Resposta (dias)',
        nameLocation: 'middle',
        nameGap: 40,
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
    <div style={{ width: '100%', padding: '1rem' }}>
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
          style={{ height: '500px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      ) : (
        <div
          style={{
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '1.125rem',
          }}
        >
          <div style={{ marginBottom: '0.5rem', fontSize: '3rem' }}>📊</div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            Nenhum dado disponível
          </div>
          <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
            Selecione pelo menos um filtro para visualizar os dados de tempo de
            resposta
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTimeBoxplot;
