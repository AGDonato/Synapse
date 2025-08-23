import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { useDemandas } from '../../hooks/useDemandas';

export function OpenDemandsChart() {
  const { demandas } = useDemandas();

  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    
    // Filtrar apenas demandas não finalizadas
    const openDemands = demandas.filter(d => d.status !== 'Finalizada');
    
    // Separar demandas que iniciaram no ano atual vs anos anteriores
    let currentYearDemands = 0;
    let previousYearsDemands = 0;
    
    openDemands.forEach(demanda => {
      const year = demanda.dataInicial.split('/')[2];
      if (year === currentYear.slice(-4)) { // Pegar últimos 4 dígitos para comparar com formato da data
        currentYearDemands++;
      } else {
        previousYearsDemands++;
      }
    });

    return {
      currentYear,
      currentYearDemands,
      previousYearsDemands,
      total: currentYearDemands + previousYearsDemands
    };
  }, [demandas]);

  const option = {
    title: {
      text: `Demandas Abertas em ${chartData.currentYear}`,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const
      },
      formatter: (params: Array<{axisValue: string; value: number; seriesName: string; color: string}>) => {
        const total = chartData.total;
        let tooltipText = `${params[0].axisValue}<br/>`;
        tooltipText += `Total de Demandas Abertas: ${total}<br/><br/>`;
        params.forEach((param: {axisValue: string; value: number; seriesName: string; color: string}) => {
          const percentage = ((param.value / total) * 100).toFixed(1);
          tooltipText += `${param.marker} ${param.seriesName}: ${param.value} (${percentage}%)<br/>`;
        });
        return tooltipText;
      }
    },
    legend: {
      bottom: 0,
      data: [`Iniciadas em ${chartData.currentYear}`, 'Iniciadas em Anos Anteriores']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: [chartData.currentYear]
    },
    yAxis: {
      type: 'value' as const,
      name: 'Quantidade',
      minInterval: 1
    },
    series: [
      {
        name: `Iniciadas em ${chartData.currentYear}`,
        type: 'bar' as const,
        stack: 'total',
        data: [chartData.currentYearDemands],
        itemStyle: { color: '#3b82f6' },
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Iniciadas em Anos Anteriores',
        type: 'bar' as const,
        stack: 'total',
        data: [chartData.previousYearsDemands],
        itemStyle: { color: '#94a3b8' },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}