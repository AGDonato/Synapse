import React, { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import { useDemandasData } from '../../hooks/queries/useDemandas';
import { AXIS_TOOLTIP_CONFIG, createTooltipHTML } from '../../utils/chartTooltipConfig';

interface OpenDemandsChartProps {
  selectedYears?: string[];
}

export function OpenDemandsChart({ selectedYears = [] }: OpenDemandsChartProps = {}) {
  const { data: demandas = [] } = useDemandasData();

  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();

    // Filtrar apenas demandas não finalizadas e pelos anos selecionados
    const openDemands = demandas.filter(d => {
      if (d.status === 'Finalizada') return false;
      if (!d.dataInicial) return false;

      const year = d.dataInicial.split('/')[2];
      return selectedYears.length > 0 ? selectedYears.includes(year) : true;
    });

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
  }, [demandas, selectedYears]);

  const chartOptions = useMemo(
    () => ({
      tooltip: {
        ...AXIS_TOOLTIP_CONFIG,
        formatter: (
          params: {
            axisValue: string;
            value: number;
            seriesName: string;
            color: string;
            marker?: string;
          }[]
        ) => {
          const total = chartData.total;
          const items = params.map(param => {
            const percentage = ((param.value / total) * 100).toFixed(1);
            return {
              label: param.seriesName,
              value: `${param.value} (${percentage}%)`,
              color: param.color,
            };
          });

          return createTooltipHTML({
            title: params[0].axisValue,
            items: [
              {
                label: 'Total de Demandas Abertas',
                value: total,
                isSecondary: true,
              },
              ...items,
            ],
          });
        },
      },
      legend: {
        top: 20,
        data: [`${chartData.currentYear}`, 'Anteriores'],
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '3%',
        top: 90,
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
      series: [
        {
          name: `${chartData.currentYear}`,
          type: 'bar' as const,
          stack: 'total',
          data: [chartData.currentYearDemands],
          itemStyle: { color: '#3b82f6' },
          barWidth: 60, // Largura fixa para evitar expansão lateral
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
          barWidth: 60, // Largura fixa para evitar expansão lateral
          emphasis: {
            focus: 'series',
          },
        },
      ],
    }),
    [chartData]
  );

  return (
    <EChartsWrapper
      option={chartOptions}
      height={300}
      style={{
        padding: '0 0.5rem 0.5rem 0.5rem',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      opts={{ renderer: 'svg' }}
    />
  );
}

export default OpenDemandsChart;
