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
        dataByYearAndStatus.set(
          year,
          new Map([
            ['Finalizada', 0],
            ['Em Andamento', 0],
            ['Aguardando', 0],
            ['Fila de Espera', 0],
          ])
        );
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
        data: years.map(
          year => dataByYearAndStatus.get(year)?.get('Finalizada') || 0
        ),
        itemStyle: { color: '#22c55e' },
      },
      {
        name: 'Em Andamento',
        type: 'bar' as const,
        data: years.map(
          year => dataByYearAndStatus.get(year)?.get('Em Andamento') || 0
        ),
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: 'Aguardando',
        type: 'bar' as const,
        data: years.map(
          year => dataByYearAndStatus.get(year)?.get('Aguardando') || 0
        ),
        itemStyle: { color: '#ef4444' },
      },
      {
        name: 'Fila de Espera',
        type: 'bar' as const,
        data: years.map(
          year => dataByYearAndStatus.get(year)?.get('Fila de Espera') || 0
        ),
        itemStyle: { color: '#6b7280' },
      },
    ];

    return { years, series };
  }, [demandas]);

  const option = {
    title: {
      text: 'Status das Demandas por Ano',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
      },
    },
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
    },
    legend: {
      top: 50,
      data: ['Finalizada', 'Em Andamento', 'Aguardando', 'Fila de Espera'],
    },
    grid: {
      left: '12%',
      right: '1%',
      bottom: '3%',
      top: 100,
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: chartData.years,
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value' as const,
      name: 'Quantidade',
      nameLocation: 'middle',
      nameGap: 60,
      minInterval: 1,
      alignTicks: true,
      nameTextStyle: {
        fontSize: 12,
        fontWeight: 'normal',
      },
      axisLabel: {
        formatter: '{value}',
      },
    },
    series: chartData.series,
  };

  return (
    <div style={{ width: '100%', padding: '1rem 0.5rem 1rem 1rem' }}>
      <ReactECharts
        option={option}
        style={{ height: '450px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
