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
      if (year === currentYear.slice(-4)) {
        // Pegar últimos 4 dígitos para comparar com formato da data
        currentYearDemands++;
      } else {
        previousYearsDemands++;
      }
    });

    return {
      currentYear,
      currentYearDemands,
      previousYearsDemands,
      total: currentYearDemands + previousYearsDemands,
    };
  }, [demandas]);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
      confine: false,
      appendToBody: true,
      formatter: (
        params: Array<{
          axisValue: string;
          value: number;
          seriesName: string;
          color: string;
        }>
      ) => {
        const total = chartData.total;
        let tooltipText = `${params[0].axisValue}<br/>`;
        tooltipText += `Total de Demandas Abertas: ${total}<br/><br/>`;
        params.forEach(
          (param: {
            axisValue: string;
            value: number;
            seriesName: string;
            color: string;
          }) => {
            const percentage = ((param.value / total) * 100).toFixed(1);
            tooltipText += `${param.marker} ${param.seriesName}: ${param.value} (${percentage}%)<br/>`;
          }
        );
        return tooltipText;
      },
    },
    legend: {
      top: 50,
      data: [`${chartData.currentYear}`, 'Anteriores'],
    },
    grid: {
      left: '20%',
      right: '10%',
      bottom: '3%',
      top: 100,
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: [chartData.currentYear],
    },
    yAxis: {
      type: 'value' as const,
      name: 'Quantidade (un)',
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
    series: [
      {
        name: `${chartData.currentYear}`,
        type: 'bar' as const,
        stack: 'total',
        data: [chartData.currentYearDemands],
        itemStyle: { color: '#3b82f6' },
        barWidth: '30%', // Reduzido para metade da largura padrão
        emphasis: {
          focus: 'series',
        },
      },
      {
        name: 'Anteriores',
        type: 'bar' as const,
        stack: 'total',
        data: [chartData.previousYearsDemands],
        itemStyle: { color: '#94a3b8' },
        barWidth: '30%', // Reduzido para metade da largura padrão
        emphasis: {
          focus: 'series',
        },
      },
    ],
  };

  return (
    <div
      style={{
        width: '100%',
        padding: '1rem 0.5rem 1rem 1rem',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <ReactECharts
        option={option}
        style={{ height: '450px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
