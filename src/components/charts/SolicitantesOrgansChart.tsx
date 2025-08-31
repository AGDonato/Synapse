import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDemandasData } from '../../hooks/queries/useDemandas';

interface SolicitantesOrgansChartProps {
  selectedYears: string[];
}

// Função para gerar escala dinâmica de azul baseada no volume de dados (GAECO)
const generateBlueScale = (dataLength: number): string[] => {
  // Paleta base de 7 tons de azul vibrantes - do mais claro ao mais escuro
  const blueBase = [
    '#dbeafe', // Blue-100 - azul claro mas visível
    '#bfdbfe', // Blue-200 - azul claro-médio
    '#93c5fd', // Blue-300 - azul médio-claro
    '#60a5fa', // Blue-400 - azul médio vibrante
    '#3b82f6', // Blue-500 - azul médio-escuro
    '#2563eb', // Blue-600 - azul escuro
    '#1d4ed8', // Blue-700 - azul muito escuro
  ];

  // Lógica dinâmica baseada no volume de dados
  if (dataLength <= 3) {
    // Poucos dados: usar 4 cores com maior contraste
    return [
      blueBase[0], // Blue-100
      blueBase[2], // Blue-300
      blueBase[4], // Blue-500
      blueBase[6], // Blue-700
    ];
  } else if (dataLength <= 5) {
    // Volume médio: usar 5 cores bem distribuídas
    return [
      blueBase[0], // Blue-100
      blueBase[1], // Blue-200
      blueBase[3], // Blue-400
      blueBase[5], // Blue-600
      blueBase[6], // Blue-700
    ];
  } else {
    // Muitos dados (6+): usar todas as 7 cores para máxima granularidade
    return blueBase;
  }
};

// Função para gerar escala dinâmica de verde baseada no volume de dados (Demais Órgãos)
const generateGreenScale = (dataLength: number): string[] => {
  // Paleta base de 7 tons de verde vibrantes - do mais claro ao mais escuro
  const greenBase = [
    '#d1fae5', // Emerald-100 - verde claro mas visível
    '#a7f3d0', // Emerald-200 - verde claro-médio
    '#6ee7b7', // Emerald-300 - verde médio-claro
    '#34d399', // Emerald-400 - verde médio vibrante
    '#10b981', // Emerald-500 - verde médio-escuro
    '#059669', // Emerald-600 - verde escuro
    '#047857', // Emerald-700 - verde muito escuro
  ];

  // Lógica dinâmica baseada no volume de dados
  if (dataLength <= 3) {
    // Poucos dados: usar 4 cores com maior contraste
    return [
      greenBase[0], // Emerald-100
      greenBase[2], // Emerald-300
      greenBase[4], // Emerald-500
      greenBase[6], // Emerald-700
    ];
  } else if (dataLength <= 5) {
    // Volume médio: usar 5 cores bem distribuídas
    return [
      greenBase[0], // Emerald-100
      greenBase[1], // Emerald-200
      greenBase[3], // Emerald-400
      greenBase[5], // Emerald-600
      greenBase[6], // Emerald-700
    ];
  } else {
    // Muitos dados (6+): usar todas as 7 cores para máxima granularidade
    return greenBase;
  }
};

const SolicitantesOrgansChart: React.FC<SolicitantesOrgansChartProps> = ({ selectedYears }) => {
  const { data: demandas = [] } = useDemandasData();

  const { chartData, gaecoTotal, demaisTotal, gaecoCount, demaisCount } = useMemo(() => {
    // Filtrar demandas pelos anos selecionados
    const relevantDemandas = demandas.filter(demanda => {
      if (!demanda.dataInicial) {
        return false;
      }
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

    // Agrupar por órgão
    const orgaoCount: Record<string, number> = {};

    relevantDemandas.forEach(demanda => {
      if (!demanda.orgao) {
        return;
      }
      orgaoCount[demanda.orgao] = (orgaoCount[demanda.orgao] || 0) + 1;
    });

    // Separar contadores para estatísticas
    const gaecoOrgaos: Record<string, number> = {};
    const demaisOrgaos: Record<string, number> = {};

    Object.entries(orgaoCount).forEach(([orgao, count]) => {
      if (isGAECO(orgao)) {
        gaecoOrgaos[orgao] = count;
      } else {
        demaisOrgaos[orgao] = count;
      }
    });

    // Converter para formato treemap único com categoria
    const chartData = Object.entries(orgaoCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        category: isGAECO(name) ? 'gaeco' : 'demais',
      }));

    const gaecoTotal = Object.values(gaecoOrgaos).reduce((sum, val) => sum + val, 0);
    const demaisTotal = Object.values(demaisOrgaos).reduce((sum, val) => sum + val, 0);
    const gaecoCount = Object.keys(gaecoOrgaos).length;
    const demaisCount = Object.keys(demaisOrgaos).length;

    // Log para debug
    console.log(`[SolicitantesOrgansChart] GAECO: ${gaecoCount} órgãos, ${gaecoTotal} demandas`);
    console.log(`[SolicitantesOrgansChart] Demais: ${demaisCount} órgãos, ${demaisTotal} demandas`);

    return {
      chartData,
      gaecoTotal,
      demaisTotal,
      gaecoCount,
      demaisCount,
    };
  }, [demandas, selectedYears]);

  const chartOptions = useMemo(() => {
    // Gerar escalas dinâmicas baseadas na quantidade de dados
    const blueScale = generateBlueScale(gaecoCount);
    const greenScale = generateGreenScale(demaisCount);

    // Função para mapear cores baseado na categoria e valor
    const getColorByCategory = (item: { category: string; value: number }): string => {
      if (item.category === 'gaeco') {
        // Mapear valor para escala azul
        const gaecoValues = chartData
          .filter(d => d.category === 'gaeco')
          .map(d => d.value)
          .sort((a, b) => a - b);

        if (gaecoValues.length <= 1) {
          return blueScale[Math.floor(blueScale.length / 2)];
        }

        const minVal = gaecoValues[0];
        const maxVal = gaecoValues[gaecoValues.length - 1];
        const normalizedValue = maxVal > minVal ? (item.value - minVal) / (maxVal - minVal) : 0;
        const colorIndex = Math.floor(normalizedValue * (blueScale.length - 1));
        return blueScale[colorIndex];
      } else {
        // Mapear valor para escala verde
        const demaisValues = chartData
          .filter(d => d.category === 'demais')
          .map(d => d.value)
          .sort((a, b) => a - b);

        if (demaisValues.length <= 1) {
          return greenScale[Math.floor(greenScale.length / 2)];
        }

        const minVal = demaisValues[0];
        const maxVal = demaisValues[demaisValues.length - 1];
        const normalizedValue = maxVal > minVal ? (item.value - minVal) / (maxVal - minVal) : 0;
        const colorIndex = Math.floor(normalizedValue * (greenScale.length - 1));
        return greenScale[colorIndex];
      }
    };

    // Aplicar cores aos dados
    const dataWithColors = chartData.map(item => ({
      ...item,
      itemStyle: {
        color: getColorByCategory(item),
      },
    }));

    // Log para debug
    console.log(`[SolicitantesOrgansChart] Usando ${blueScale.length} tons de azul para GAECO`);
    console.log(`[SolicitantesOrgansChart] Usando ${greenScale.length} tons de verde para Demais`);

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
        formatter: function (params: { name: string; value: number; data: { category: string } }) {
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';
          const isGAECO = params.data.category === 'gaeco';
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
      series: [
        {
          name: 'Órgãos Solicitantes',
          type: 'treemap',
          data: dataWithColors,
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
  }, [chartData, gaecoCount, demaisCount]);

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
