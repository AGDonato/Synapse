import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { useDemandasData } from '../../hooks/queries/useDemandas';

export function StatusByYearChart() {
  const { data: demandas = [] } = useDemandasData();

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

      const yearData = dataByYearAndStatus.get(year) as HTMLInputElement | null;
      const currentCount = yearData.get(demanda.status) || 0;
      yearData.set(demanda.status, currentCount + 1);
    });

    const years = Array.from(dataByYearAndStatus.keys()).sort();

    const series = [
      {
        name: 'Finalizada',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Finalizada') || 0),
        itemStyle: { color: '#22c55e' },
      },
      {
        name: 'Em Andamento',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Em Andamento') || 0),
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: 'Aguardando',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Aguardando') || 0),
        itemStyle: { color: '#ef4444' },
      },
      {
        name: 'Fila de Espera',
        type: 'bar' as const,
        data: years.map(year => dataByYearAndStatus.get(year)?.get('Fila de Espera') || 0),
        itemStyle: { color: '#6b7280' },
      },
    ];

    return { years, series };
  }, [demandas]);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
      confine: false,
      appendToBody: true,
    },
    legend: {
      top: 20,
      data: ['Finalizada', 'Em Andamento', 'Aguardando', 'Fila de Espera'],
    },
    grid: {
      left: '10%',
      right: '6%',
      bottom: '3%',
      top: 90,
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
      name: 'Quantidade (un)',
      nameLocation: 'middle',
      nameGap: 35,
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
    <div
      style={{
        width: '100%',
        padding: '0 0.5rem 0.5rem 0.5rem',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <ReactECharts
        option={option}
        style={{ height: '300px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}

export default StatusByYearChart;
