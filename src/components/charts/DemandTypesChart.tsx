import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDemandas } from '../../hooks/useDemandas';

interface DemandTypesChartProps {
  selectedYears: string[];
}

const DemandTypesChart: React.FC<DemandTypesChartProps> = ({
  selectedYears,
}) => {
  const { demandas } = useDemandas();

  const chartData = useMemo(() => {
    // Filtrar demandas pelos anos selecionados
    const filteredDemandas = demandas.filter(demanda => {
      if (!demanda.dataInicial) return false;
      const demandYear = demanda.dataInicial.split('/')[2];
      return selectedYears.length > 0
        ? selectedYears.includes(demandYear)
        : true;
    });

    // Agrupar por tipo de demanda
    const typeGroups = filteredDemandas.reduce(
      (acc, demanda) => {
        const tipo = demanda.tipoDemanda;
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Converter para formato do ECharts
    const data = Object.entries(typeGroups).map(([name, value]) => ({
      name,
      value,
    }));

    const total = filteredDemandas.length;

    return { data, total };
  }, [demandas, selectedYears]);

  const chartOptions = useMemo(() => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#ec4899', // pink
      '#6366f1', // indigo
    ];

    return {
      tooltip: {
        trigger: 'item',
        formatter: function (params: {
          name: string;
          value: number;
          color: string;
        }) {
          const percentage = ((params.value / chartData.total) * 100).toFixed(
            1
          );
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div style="color: ${params.color};">Quantidade: ${params.value}</div>
              <div style="color: #64748b;">Percentual: ${percentage}%</div>
            </div>
          `;
        },
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: {
          fontSize: 11,
        },
        pageButtonItemGap: 5,
        pageIconSize: 10,
        pageTextStyle: {
          fontSize: 10,
        },
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: chartData.total.toString(),
          fontSize: 32,
          fontWeight: 'bold',
          fill: '#1e293b',
        },
      },
      series: [
        {
          name: 'Tipos de Demandas',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          data: chartData.data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          itemStyle: {
            color: function (params: { dataIndex: number }) {
              return colors[params.dataIndex % colors.length];
            },
          },
        },
      ],
    };
  }, [chartData]);

  if (chartData.data.length === 0) {
    return (
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
          Nenhuma demanda encontrada para os anos selecionados
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <ReactECharts
        option={chartOptions}
        style={{ height: '450px', width: '100%' }}
        opts={{ renderer: 'svg' }}
        key={`demand-types-${selectedYears.join('-')}`}
        notMerge={true}
      />
    </div>
  );
};

export default DemandTypesChart;
