import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { useDemandas } from '../../hooks/useDemandas';

export function StatusByYearChart() {
  const { demandas } = useDemandas();

  const chartData = useMemo(() => {
    const dataByYearAndStatus = new Map<string, Map<string, number>>();
    
    demandas.forEach(demanda => {
      const year = demanda.dataInicial.split('/')[2];
      
      if (!dataByYearAndStatus.has(year)) {
        dataByYearAndStatus.set(year, new Map([
          ['Finalizada', 0],
          ['Em Andamento', 0],
          ['Aguardando', 0],
          ['Fila de Espera', 0]
        ]));
      }
      
      const yearData = dataByYearAndStatus.get(year)!;
      const currentCount = yearData.get(demanda.status) || 0;
      yearData.set(demanda.status, currentCount + 1);
    });

    const years = Array.from(dataByYearAndStatus.keys()).sort();
    
    const series = [
      {
        name: 'Finalizada',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Finalizada') || 0),
        itemStyle: { color: '#22c55e' }
      },
      {
        name: 'Em Andamento',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Em Andamento') || 0),
        itemStyle: { color: '#f59e0b' }
      },
      {
        name: 'Aguardando',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Aguardando') || 0),
        itemStyle: { color: '#ef4444' }
      },
      {
        name: 'Fila de Espera',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Fila de Espera') || 0),
        itemStyle: { color: '#6b7280' }
      }
    ];

    return { years, series };
  }, [demandas]);

  const option = {
    title: {
      text: 'Status das Demandas por Ano',
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
      }
    },
    legend: {
      bottom: 0,
      data: ['Finalizada', 'Em Andamento', 'Aguardando', 'Fila de Espera']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      data: chartData.years,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value' as const,
      name: 'Quantidade',
      minInterval: 1
    },
    series: chartData.series
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