import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDemandas } from '../../hooks/useDemandas';

interface SolicitantesOrgansChartProps {
  selectedYears: string[];
}

const SolicitantesOrgansChart: React.FC<SolicitantesOrgansChartProps> = ({
  selectedYears,
}) => {
  const { demandas } = useDemandas();

  const { chartData, gaecoTotal, demaisTotal } = useMemo(() => {
    // Filtrar demandas pelos anos selecionados
    const relevantDemandas = demandas.filter(demanda => {
      if (!demanda.dataInicial) return false;
      const year = demanda.dataInicial.split('/')[2];
      return selectedYears.includes(year);
    });

    // Função para identificar se é GAECO
    const isGAECO = (orgao: string) => {
      return (
        orgao.includes('GAECO') ||
        orgao.includes('CYBERGAECO') ||
        orgao.includes('Grupo de Atuação Especial de Combate ao Crime')
      );
    };

    // Agrupar por órgão e classificar
    const gaecoOrgaos: Record<string, number> = {};
    const demaisOrgaos: Record<string, number> = {};

    relevantDemandas.forEach(demanda => {
      if (!demanda.orgao) return;

      if (isGAECO(demanda.orgao)) {
        gaecoOrgaos[demanda.orgao] = (gaecoOrgaos[demanda.orgao] || 0) + 1;
      } else {
        demaisOrgaos[demanda.orgao] = (demaisOrgaos[demanda.orgao] || 0) + 1;
      }
    });

    // Converter para formato treemap
    const gaecoData = Object.entries(gaecoOrgaos).map(([name, value]) => ({
      name,
      value,
    }));

    const demaisData = Object.entries(demaisOrgaos).map(([name, value]) => ({
      name,
      value,
    }));

    // Combinar os dados para o treemap
    const combinedData = [...gaecoData, ...demaisData];

    const gaecoTotal = Object.values(gaecoOrgaos).reduce(
      (sum, val) => sum + val,
      0
    );
    const demaisTotal = Object.values(demaisOrgaos).reduce(
      (sum, val) => sum + val,
      0
    );

    return {
      chartData: combinedData,
      gaecoTotal,
      demaisTotal,
    };
  }, [demandas, selectedYears]);

  const chartOptions = useMemo(() => {
    return {
      animation: false,
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: false,
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params: { name: string; value: number }) {
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          const percentage =
            total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';
          const isGAECO =
            params.name.includes('GAECO') ||
            params.name.includes('CYBERGAECO') ||
            params.name.includes(
              'Grupo de Atuação Especial de Combate ao Crime'
            );
          const grupo = isGAECO ? 'GAECO' : 'Demais Órgãos';

          return `
            <div style="padding: 10px; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 6px; color: #1f2937; font-size: 14px;">${params.name}</div>
              <div style="color: ${isGAECO ? '#3b82f6' : '#10b981'}; margin-bottom: 3px; font-weight: 600;">Demandas: ${params.value}</div>
              <div style="color: #64748b; margin-bottom: 3px;">Percentual: ${percentage}%</div>
              <div style="color: #64748b; font-size: 12px;">Grupo: ${grupo}</div>
            </div>
          `;
        },
      },
      visualMap: {
        type: 'continuous',
        min: Math.min(...chartData.map(item => item.value)),
        max: Math.max(...chartData.map(item => item.value)),
        inRange: {
          color: [
            // Cores para GAECO (azul) e Demais Órgãos (verde)
            '#dbeafe',
            '#3b82f6',
            '#1d4ed8', // tons de azul
            '#d1fae5',
            '#10b981',
            '#047857', // tons de verde
          ],
        },
        show: false,
      },
      series: [
        {
          name: 'Órgãos Solicitantes',
          type: 'treemap',
          data: chartData,
          roam: false,
          nodeClick: false,
          animation: false,
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          breadcrumb: {
            show: false,
          },
          label: {
            show: function (params: { data: { value: number } }) {
              // Só mostrar labels em áreas com valor suficientemente grande
              return params.data.value > 1;
            },
            fontSize: 13,
            color: '#ffffff',
            fontWeight: 'normal',
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            disabled: true,
          },
        },
      ],
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🏛️</div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
          Nenhum órgão solicitante encontrado
        </div>
        <div style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          Nenhuma demanda no período selecionado
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '300px',
        gap: '1rem',
        paddingRight: '1rem',
      }}
    >
      {/* Treemap - 70% */}
      <div style={{ flex: '0 0 70%', position: 'relative' }}>
        <ReactECharts
          option={chartOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
          key={`solicitantes-treemap-${selectedYears.join('-')}`}
          notMerge={true}
        />
      </div>

      {/* Indicadores - 30% */}
      <div
        style={{
          flex: '0 0 30%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Indicador GAECO */}
        <div
          style={{
            flex: '1',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: '400',
              color: '#1e293b',
              marginBottom: '0.25rem',
            }}
          >
            {gaecoTotal}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: '#64748b',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            GAECO
          </div>
        </div>

        {/* Indicador Demais Órgãos */}
        <div
          style={{
            flex: '1',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: '400',
              color: '#1e293b',
              marginBottom: '0.25rem',
            }}
          >
            {demaisTotal}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: '#64748b',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Demais Órgãos
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitantesOrgansChart;
