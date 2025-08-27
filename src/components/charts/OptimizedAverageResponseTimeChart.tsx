
// src/components/charts/OptimizedAverageResponseTimeChart.tsx
import React, { useMemo } from 'react';
import type { DocumentoDemanda } from '../../data/mockDocumentos';
import { LazyChartWrapper, OptimizedChartContainer, useOptimizedChartData } from './LazyChartWrapper';
import { useDocumentosData } from '../../hooks/queries/useDocumentos';
import { useProviderFilters } from '../../hooks/useProviderFilters';
import { mockProvedores } from '../../data/mockProvedores';
import {
  applyProviderLimit,
  calculateProviderDemands,
} from '../../utils/providerDemandUtils';
import styles from './AverageResponseTimeChart.module.css';

interface AverageResponseTimeData {
  name: string;
  averageTime: number;
  totalDocuments: number;
}

// ECharts tooltip parameter types
interface EChartsTooltipParams {
  dataIndex: number;
  data: number | string;
  name: string;
  value: number;
  seriesName?: string;
}

interface EChartsColorParams {
  dataIndex: number;
  data: number | string;
}

interface OptimizedAverageResponseTimeChartProps {
  filters?: ReturnType<typeof useProviderFilters>;
  height?: string;
  loadImmediately?: boolean;
}

// Memoized data processor
const processAverageResponseTimeData = (
  documentos: DocumentoDemanda[],
  allowedSubjects: string[],
  selectedProviders: string[],
  providerLimit: number
): AverageResponseTimeData[] => {
  if (allowedSubjects.length === 0) {
    return [];
  }

  // Filter documents that should have response times
  const documentsWithResponseTime = documentos.filter(doc => {
    if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) {return false;}
    if (!allowedSubjects.includes(doc.assunto)) {return false;}
    return doc.dataEnvio;
  });

  // Group by provider and calculate average response times
  const providerStats = new Map<string, { totalTime: number; count: number }>();

  documentsWithResponseTime.forEach(doc => {
    const providerName = doc.destinatario;
    if (!providerName) {return;}

    // Calculate response time in days
    let responseTime = 0;
    if (doc.dataResposta) {
      const sendDate = parseBrazilianDate(doc.dataEnvio);
      const responseDate = parseBrazilianDate(doc.dataResposta);
      if (sendDate && responseDate) {
        responseTime = Math.ceil((responseDate.getTime() - sendDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // If no response, calculate days since sending
      const sendDate = parseBrazilianDate(doc.dataEnvio);
      if (sendDate) {
        responseTime = Math.ceil((Date.now() - sendDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const current = providerStats.get(providerName) || { totalTime: 0, count: 0 };
    providerStats.set(providerName, {
      totalTime: current.totalTime + responseTime,
      count: current.count + 1
    });
  });

  // Convert to array and calculate averages
  let averageData: AverageResponseTimeData[] = Array.from(providerStats.entries())
    .map(([name, stats]) => ({
      name,
      averageTime: Math.round(stats.totalTime / stats.count),
      totalDocuments: stats.count
    }))
    .sort((a, b) => b.averageTime - a.averageTime);

  // Apply provider filter and limit
  if (selectedProviders.length > 0) {
    averageData = averageData.filter(provider => selectedProviders.includes(provider.name));
  }

  return applyProviderLimit(averageData, providerLimit);
};

// Helper function to parse Brazilian date format
const parseBrazilianDate = (dateString: string): Date | null => {
  if (!dateString) {return null;}
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

const OptimizedAverageResponseTimeChart: React.FC<OptimizedAverageResponseTimeChartProps> = React.memo(({
  filters: externalFilters,
  height = '400px',
  loadImmediately = false
}) => {
  const { data: documentos = [] } = useDocumentosData();
  const internalFilters = useProviderFilters();
  const filters = externalFilters || internalFilters;

  // Memoized filter values
  const filterValues = useMemo(() => ({
    allowedSubjects: filters.getSubjects(),
    selectedProviders: filters.selectedProviders,
    providerLimit: filters.providerLimit
  }), [filters]);

  // Use optimized chart data hook
  const averageData = useOptimizedChartData(
    documentos,
    (docs) => processAverageResponseTimeData(
      docs,
      filterValues.allowedSubjects,
      filterValues.selectedProviders,
      filterValues.providerLimit
    ),
    [filterValues.allowedSubjects, filterValues.selectedProviders, filterValues.providerLimit]
  );

  // Memoized chart option
  const chartOption = useMemo(() => {
    if (!averageData || averageData.length === 0) {
      return {
        title: {
          text: 'Tempo Médio de Resposta por Provedor',
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: 'Nenhum dado disponível',
            fontSize: 14,
            fill: '#666'
          }
        }
      };
    }

    const providerNames = averageData.map(item => item.name);
    const avgTimes = averageData.map(item => item.averageTime);
    const maxTime = Math.max(...avgTimes);

    return {
      title: {
        text: 'Tempo Médio de Resposta por Provedor',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: EChartsTooltipParams[] | EChartsTooltipParams) => {
          const paramsArray = Array.isArray(params) ? params : [params];
          if (paramsArray && paramsArray.length > 0) {
            const dataIndex = paramsArray[0].dataIndex;
            const provider = averageData[dataIndex];
            return `
              <div style="font-weight: bold; margin-bottom: 4px;">${provider.name}</div>
              <div>Tempo médio: <strong>${provider.averageTime} dias</strong></div>
              <div>Total de documentos: <strong>${provider.totalDocuments}</strong></div>
            `;
          }
          return '';
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: providerNames,
        axisLabel: {
          rotate: 45,
          fontSize: 11,
          overflow: 'truncate',
          width: 80
        }
      },
      yAxis: {
        type: 'value',
        name: 'Dias',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: Math.ceil(maxTime * 1.1),
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [{
        name: 'Tempo Médio (dias)',
        type: 'bar',
        data: avgTimes,
        itemStyle: {
          color: (params: EChartsColorParams) => {
            // Color gradient based on response time
            const value = typeof params.data === 'number' ? params.data : 0;
            const ratio = value / maxTime;
            if (ratio <= 0.3) {return '#52c41a';} // Green for fast response
            if (ratio <= 0.6) {return '#faad14';} // Yellow for medium response
            return '#f5222d'; // Red for slow response
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c} dias',
          fontSize: 10
        }
      }]
    };
  }, [averageData]);

  if (!averageData) {
    return (
      <OptimizedChartContainer 
        title="Tempo Médio de Resposta por Provedor" 
        className={styles.chartContainer}
      >
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>Erro ao processar dados</span>
        </div>
      </OptimizedChartContainer>
    );
  }

  return (
    <OptimizedChartContainer className={styles.chartContainer}>
      <LazyChartWrapper
        option={chartOption}
        height={height}
        loadImmediately={loadImmediately}
        className={styles.chart}
      />
    </OptimizedChartContainer>
  );
});

OptimizedAverageResponseTimeChart.displayName = 'OptimizedAverageResponseTimeChart';

export default OptimizedAverageResponseTimeChart;