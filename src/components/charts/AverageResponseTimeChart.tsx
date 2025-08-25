import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useProviderFilters } from '../../hooks/useProviderFilters';
import ProviderFilters from './ProviderFilters';
import {
  calculateProviderDemands,
  applyProviderLimit,
} from '../../utils/providerDemandUtils';

interface AverageResponseTimeData {
  name: string;
  averageTime: number;
  totalDocuments: number;
}

interface AverageResponseTimeChartProps {
  filters?: ReturnType<typeof useProviderFilters>;
}

const AverageResponseTimeChart: React.FC<AverageResponseTimeChartProps> = ({
  filters: externalFilters,
}) => {
  const { documentos } = useDocumentos();
  const internalFilters = useProviderFilters();
  const filters = externalFilters || internalFilters;

  const averageData = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return [];
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

    // Calculate average response time for each provider
    const averageData: AverageResponseTimeData[] = [];

    providerResponseTimes.forEach((times, provider) => {
      if (times.length > 0) {
        const averageTime =
          times.reduce((sum, time) => sum + time, 0) / times.length;
        averageData.push({
          name: provider,
          averageTime: Math.round(averageTime * 10) / 10, // Round to 1 decimal place
          totalDocuments: times.length,
        });
      }
    });

    // Calculate provider demands to determine top providers
    const providerDemands = calculateProviderDemands(
      documentos,
      allowedSubjects
    );

    // Sort by provider name (alphabetical order)
    const sortedResult = averageData.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Apply provider limit filter
    return applyProviderLimit(
      sortedResult,
      filters.providerLimit,
      providerDemands
    );
  }, [filters.filters, filters.providerLimit, documentos]);

  const chartOptions = useMemo(() => {
    const providers = averageData.map(item => item.name);
    const averageTimes = averageData.map(item => item.averageTime);

    return {
      title: {
        text: 'Tempo Médio de Resposta por Provedor',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1e293b',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        confine: false,
        appendToBody: true,
        formatter: function (
          params: Array<{ dataIndex: number; value: number; name: string }>
        ) {
          if (params && params.length > 0) {
            const data = params[0];
            const providerData = averageData[data.dataIndex];
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
                <div style="color: #10b981;"><strong>Tempo Médio:</strong> ${data.value} dias</div>
                <div style="margin-top: 4px; color: #64748b;">
                  <strong>Total de Documentos:</strong> ${providerData.totalDocuments}
                </div>
              </div>
            `;
          }
          return '';
        },
      },
      grid: {
        left: '8%',
        right: '1%',
        bottom: '3%',
        top: 100,
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
        alignTicks: true,
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
            color: '#10b981',
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              color: '#059669',
              borderWidth: 1,
              borderColor: '#047857',
            },
          },
        },
      ],
    };
  }, [averageData]);

  return (
    <div
      style={{
        width: '95%',
        padding: '1rem 0.5rem 1rem 1rem',
        position: 'relative',
        zIndex: 10,
      }}
    >
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
            Selecione pelo menos um filtro para visualizar os dados de tempo
            médio
          </div>
        </div>
      )}
    </div>
  );
};

export default AverageResponseTimeChart;
