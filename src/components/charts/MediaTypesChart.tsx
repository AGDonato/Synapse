import React, { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import { useDocumentosData } from '../../hooks/queries/useDocumentos';
import { useDemandasData } from '../../hooks/queries/useDemandas';

interface MediaTypesChartProps {
  selectedYears: string[];
}

const MediaTypesChart: React.FC<MediaTypesChartProps> = ({ selectedYears }) => {
  const { data: documentos = [] } = useDocumentosData();
  const { data: demandas = [] } = useDemandasData();

  const chartData = useMemo(() => {
    // Filtrar documentos de mídia do período selecionado
    const filteredMediaDocs = documentos.filter(doc => {
      if (doc.tipoDocumento !== 'Mídia') {
        return false;
      }

      const demanda = demandas.find(d => d.id === doc.demandaId);
      if (!demanda?.dataInicial) {
        return false;
      }

      const docYear = demanda.dataInicial.split('/')[2];
      return selectedYears.length > 0 ? selectedYears.includes(docYear) : true;
    });

    // Agrupar por tipo de mídia
    const mediaTypeGroups = filteredMediaDocs.reduce(
      (acc, doc) => {
        const tipo = doc.tipoMidia || 'Não especificado';
        if (!acc[tipo]) {
          acc[tipo] = { total: 0, comDefeito: 0 };
        }
        acc[tipo].total++;
        if (doc.apresentouDefeito) {
          acc[tipo].comDefeito++;
        }
        return acc;
      },
      {} as Record<string, { total: number; comDefeito: number }>
    );

    // Converter para arrays para o gráfico
    const categories = Object.keys(mediaTypeGroups);
    const totals = categories.map(tipo => mediaTypeGroups[tipo].total);
    const defeitos = categories.map(tipo => mediaTypeGroups[tipo].comDefeito);

    return { categories, totals, defeitos };
  }, [documentos, demandas, selectedYears]);

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

    const pieData = chartData.categories.map((tipo, index) => ({
      name: tipo,
      value: chartData.totals[index],
      defeitos: chartData.defeitos[index],
    }));

    const totalMedias = chartData.totals.reduce((sum, count) => sum + count, 0);

    return {
      tooltip: {
        trigger: 'item',
        extraCssText:
          'z-index: 99999 !important; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); border-radius: 8px;',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#d1d5db',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 12,
        },
        formatter: function (params: {
          name: string;
          value: number;
          data: { defeitos: number };
          color: string;
        }) {
          const percentage = ((params.value / totalMedias) * 100).toFixed(1);
          const percentualDefeito =
            params.value > 0 ? ((params.data.defeitos / params.value) * 100).toFixed(1) : '0.0';

          return `
            <div style="padding: 10px; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 6px; color: #1f2937; font-size: 14px;">${params.name}</div>
              <div style="color: ${params.color}; margin-bottom: 3px; font-weight: 600;">Total: ${params.value}</div>
              <div style="color: #ef4444; margin-bottom: 3px; font-weight: 600;">Com Defeito: ${params.data.defeitos}</div>
              <div style="color: #64748b; margin-bottom: 3px;">Percentual do Total: ${percentage}%</div>
              <div style="color: #64748b;">Taxa de Defeito: ${percentualDefeito}%</div>
            </div>
          `;
        },
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: {
          fontSize: 12,
        },
        pageButtonItemGap: 3,
        pageIconSize: 8,
        pageTextStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: 'Tipos de Mídia',
          type: 'pie',
          radius: ['0%', '50%'],
          center: ['30%', '50%'],
          data: pieData,
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

  if (chartData.categories.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>💿</div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Nenhuma mídia encontrada</div>
        <div style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          Nenhuma mídia no período selecionado
        </div>
      </div>
    );
  }

  return (
    <EChartsWrapper
      option={chartOptions}
      height={300}
      opts={{ renderer: 'svg' }}
      key={`media-types-${selectedYears.join('-')}`}
    />
  );
};

export default MediaTypesChart;
