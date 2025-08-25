import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useProviderFilters } from '../../hooks/useProviderFilters';
import ProviderFilters from './ProviderFilters';
import {
  calculateProviderDemands,
  applyProviderLimitToResponseRate,
} from '../../utils/providerDemandUtils';

interface ResponseRateData {
  providerName: string;
  totalDocuments: number;
  respondedDocuments: number;
  notRespondedDocuments: number;
  responseRate: number;
}

interface ResponseRateChartProps {
  filters?: ReturnType<typeof useProviderFilters>;
}

const ResponseRateChart: React.FC<ResponseRateChartProps> = ({
  filters: externalFilters,
}) => {
  const { documentos } = useDocumentos();
  const internalFilters = useProviderFilters();
  const filters = externalFilters || internalFilters;
  const responseData = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return [];
    }

    // Filter documents that should have responses (Ofícios and Ofícios Circulares to providers)
    const documentsToProviders = documentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento))
        return false;

      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) return false;

      // Check if destinatario is a provider by looking for it in mockProvedores
      const isProvider = mockProvedores.some(
        provedor =>
          provedor.nomeFantasia === doc.destinatario ||
          (doc.tipoDocumento === 'Ofício Circular' &&
            doc.destinatario.includes(provedor.nomeFantasia))
      );

      return isProvider && doc.dataEnvio; // Only count sent documents
    });

    // Group by provider and calculate response rates
    const providerStats = new Map<string, ResponseRateData>();

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

            if (!isValidProvider || !destinatarioData.dataEnvio) return;

            if (!providerStats.has(providerName)) {
              providerStats.set(providerName, {
                providerName,
                totalDocuments: 0,
                respondedDocuments: 0,
                notRespondedDocuments: 0,
                responseRate: 0,
              });
            }

            const stats = providerStats.get(providerName)!;
            stats.totalDocuments++;

            if (destinatarioData.respondido && destinatarioData.dataResposta) {
              stats.respondedDocuments++;
            } else {
              stats.notRespondedDocuments++;
            }
          });
        }
      } else {
        // Handle regular Ofício
        const providerName = doc.destinatario;

        if (!providerStats.has(providerName)) {
          providerStats.set(providerName, {
            providerName,
            totalDocuments: 0,
            respondedDocuments: 0,
            notRespondedDocuments: 0,
            responseRate: 0,
          });
        }

        const stats = providerStats.get(providerName)!;
        stats.totalDocuments++;

        if (doc.respondido && doc.dataResposta) {
          stats.respondedDocuments++;
        } else {
          stats.notRespondedDocuments++;
        }
      }
    });

    // Calculate response rates
    const result = Array.from(providerStats.values()).map(stats => ({
      ...stats,
      responseRate:
        stats.totalDocuments > 0
          ? (stats.respondedDocuments / stats.totalDocuments) * 100
          : 0,
    }));

    // Calculate provider demands to determine top providers
    const providerDemands = calculateProviderDemands(
      documentos,
      allowedSubjects
    );

    // Sort by provider name (reverse alphabetical order)
    const sortedResult = result.sort((a, b) =>
      b.providerName.localeCompare(a.providerName)
    );

    // Apply provider limit filter
    return applyProviderLimitToResponseRate(
      sortedResult,
      filters.providerLimit,
      providerDemands
    );
  }, [filters, documentos]);

  const chartOptions = useMemo(() => {
    const providers = responseData.map(item => item.providerName);
    const respondedPercentages = responseData.map(item =>
      item.totalDocuments > 0
        ? (item.respondedDocuments / item.totalDocuments) * 100
        : 0
    );
    const notRespondedPercentages = responseData.map(item =>
      item.totalDocuments > 0
        ? (item.notRespondedDocuments / item.totalDocuments) * 100
        : 0
    );

    // Use subtitle from filters hook

    return {
      title: {
        text: 'Taxa de Resposta por Provedor',
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
          params: Array<{
            dataIndex: number;
            value: number;
            seriesName: string;
          }>
        ) {
          if (!params || params.length === 0) return '';

          const dataIndex = params[0].dataIndex;
          const data = responseData[dataIndex];

          if (!data) return '';

          // Calculate percentages safely
          const respondedPercentage =
            data.totalDocuments > 0
              ? ((data.respondedDocuments / data.totalDocuments) * 100).toFixed(
                  1
                )
              : '0.0';
          const notRespondedPercentage =
            data.totalDocuments > 0
              ? (
                  (data.notRespondedDocuments / data.totalDocuments) *
                  100
                ).toFixed(1)
              : '0.0';

          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.providerName}</div>
              <div style="color: #22c55e;">Respondidos: ${data.respondedDocuments} (${respondedPercentage}%)</div>
              <div style="color: #ef4444;">Não Respondidos: ${data.notRespondedDocuments} (${notRespondedPercentage}%)</div>
              <div style="margin-top: 4px; font-weight: bold;">Total de Documentos: ${data.totalDocuments}</div>
            </div>
          `;
        },
      },
      legend: {
        data: [
          { name: 'Sim', icon: 'rect' },
          { name: 'Não', icon: 'rect' },
        ],
        top: 50,
        itemGap: 20,
        selectedMode: 'multiple',
        selected: {
          Sim: true,
          Não: true,
        },
      },
      grid: {
        left: '3%',
        right: '6%',
        bottom: '3%',
        top: 100,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
      yAxis: {
        type: 'category',
        data: providers,
        axisLabel: {
          fontSize: 9,
          interval: 0,
        },
      },
      series: [
        {
          name: 'Sim',
          type: 'bar',
          stack: 'total',
          data: respondedPercentages,
          itemStyle: {
            color: '#22c55e',
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: 'Não',
          type: 'bar',
          stack: 'total',
          data: notRespondedPercentages,
          itemStyle: {
            color: '#ef4444',
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }, [responseData]);

  // Summary statistics for display below chart

  return (
    <div
      style={{
        width: '100%',
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
      {responseData.length > 0 ? (
        <ReactECharts
          option={chartOptions}
          style={{ height: '510px', width: '100%' }}
          opts={{ renderer: 'svg' }}
          key={`response-rate-${JSON.stringify(filters.filters)}-${filters.providerLimit}`}
          notMerge={true}
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
            Selecione pelo menos um filtro para visualizar os dados
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseRateChart;
