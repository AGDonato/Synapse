import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDemandasData } from '../../../shared/hooks/queries/useDemandas';
import { AXIS_TOOLTIP_CONFIG, createTooltipHTML } from '../../../shared/utils/chartTooltipConfig';

interface DemandsYearlyChartProps {
  selectedYears: string[];
}

const DemandsYearlyChart: React.FC<DemandsYearlyChartProps> = ({ selectedYears }) => {
  const { data: demandas = [] } = useDemandasData();

  const chartData = useMemo(() => {
    // Filtrar demandas pelos anos selecionados
    const relevantDemandas = demandas.filter(demanda => {
      if (!demanda.dataInicial) {
        return false;
      }
      const year = demanda.dataInicial.split('/')[2];
      return selectedYears.includes(year);
    });

    // Agrupar por ano
    const dataByYear: Record<string, { iniciadas: number; finalizadas: number }> = {};

    // Inicializar todos os anos selecionados
    selectedYears.forEach(year => {
      dataByYear[year] = { iniciadas: 0, finalizadas: 0 };
    });

    // Contar demandas iniciadas por ano
    relevantDemandas.forEach(demanda => {
      const yearInicial = demanda.dataInicial.split('/')[2];
      if (dataByYear[yearInicial]) {
        dataByYear[yearInicial].iniciadas++;
      }
    });

    // Contar demandas finalizadas por ano
    relevantDemandas.forEach(demanda => {
      if (demanda.dataFinal) {
        const yearFinal = demanda.dataFinal.split('/')[2];
        if (dataByYear[yearFinal]) {
          dataByYear[yearFinal].finalizadas++;
        }
      }
    });

    // Converter para formato do ECharts
    const years = Object.keys(dataByYear).sort();
    const iniciadasData = years.map(year => dataByYear[year].iniciadas);
    const finalizadasData = years.map(year => dataByYear[year].finalizadas);

    return {
      years,
      iniciadas: iniciadasData,
      finalizadas: finalizadasData,
    };
  }, [demandas, selectedYears]);

  const chartOptions = useMemo(() => {
    return {
      tooltip: {
        ...AXIS_TOOLTIP_CONFIG,
        formatter: (params: any) => {
          if (!params || !Array.isArray(params) || params.length === 0) {
            return '';
          }

          const year = params[0].axisValue;
          const total = params.reduce((sum: number, param: any) => sum + param.value, 0);

          const items = params.map((param: any) => ({
            label: param.seriesName,
            value: param.value,
            color: param.color,
          }));

          return createTooltipHTML({
            title: `Ano ${year}`,
            items: [
              {
                label: 'Total',
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
        data: ['Finalizadas', 'Iniciadas'],
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
      series: [
        {
          name: 'Finalizadas',
          type: 'bar' as const,
          data: chartData.finalizadas,
          itemStyle: { color: '#22c55e' },
        },
        {
          name: 'Iniciadas',
          type: 'bar' as const,
          data: chartData.iniciadas,
          itemStyle: { color: '#3b82f6' },
        },
      ],
    };
  }, [chartData]);

  if (chartData.years.length === 0) {
    return (
      <div
        style={{
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>📊</div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Nenhum dado encontrado</div>
        <div style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          Nenhuma demanda encontrada para os anos selecionados
        </div>
      </div>
    );
  }

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
        option={chartOptions}
        style={{ height: '300px', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default DemandsYearlyChart;
