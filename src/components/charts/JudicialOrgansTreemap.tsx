import React, { useMemo } from 'react';
import EChartsWrapper from './EChartsWrapper';
import { useDocumentosData } from '../../hooks/queries/useDocumentos';
import { useDemandasData } from '../../hooks/queries/useDemandas';
import { STANDARD_TOOLTIP_CONFIG, createTooltipHTML } from '../../utils/chartTooltipConfig';

interface JudicialOrgansTreemapProps {
  selectedYears: string[];
}

// Função para gerar escala dinâmica de roxo baseada no volume de dados
const generatePurpleScale = (dataLength: number): string[] => {
  // Paleta base de 7 tons de roxo vibrantes - do mais claro ao mais escuro
  // Usando cores mais saturadas para melhor visibilidade
  const purpleBase = [
    '#ddd6fe', // Violet-200 - roxo claro mas visível
    '#c4b5fd', // Violet-300 - roxo claro-médio
    '#a78bfa', // Violet-400 - roxo médio-claro
    '#8b5cf6', // Violet-500 - roxo médio vibrante
    '#7c3aed', // Violet-600 - roxo médio-escuro
    '#6d28d9', // Violet-700 - roxo escuro
    '#5b21b6', // Violet-800 - roxo muito escuro
  ];

  // Lógica dinâmica baseada no volume de dados
  if (dataLength <= 3) {
    // Poucos dados: usar 4 cores com maior contraste
    return [
      purpleBase[0], // Violet-200
      purpleBase[2], // Violet-400
      purpleBase[4], // Violet-600
      purpleBase[6], // Violet-800
    ];
  } else if (dataLength <= 5) {
    // Volume médio: usar 5 cores bem distribuídas
    return [
      purpleBase[0], // Violet-200
      purpleBase[1], // Violet-300
      purpleBase[3], // Violet-500
      purpleBase[5], // Violet-700
      purpleBase[6], // Violet-800
    ];
  } else {
    // Muitos dados (6+): usar todas as 7 cores para máxima granularidade
    return purpleBase;
  }
};

const JudicialOrgansTreemap: React.FC<JudicialOrgansTreemapProps> = ({ selectedYears }) => {
  const { data: documentos = [] } = useDocumentosData();
  const { data: demandas = [] } = useDemandasData();

  const chartData = useMemo(() => {
    // Filtrar documentos de decisão judicial do período selecionado
    const relevantDocs = documentos.filter(doc => {
      const demanda = demandas.find(d => d.id === doc.demandaId);
      if (!demanda?.dataInicial) {
        return false;
      }
      const docYear = demanda.dataInicial.split('/')[2];
      if (!selectedYears.includes(docYear)) {
        return false;
      }

      const isValidType = doc.tipoDocumento === 'Ofício' || doc.tipoDocumento === 'Ofício Circular';
      const isDecisaoJudicial = doc.assunto === 'Encaminhamento de decisão judicial';

      return (
        isValidType &&
        isDecisaoJudicial &&
        doc.autoridade &&
        doc.orgaoJudicial &&
        doc.dataAssinatura
      );
    });

    // Criar Set de decisões únicas e contar por órgão judicial
    const uniqueDecisions = new Set();
    const orgaoJudicialCount: Record<string, number> = {};

    relevantDocs.forEach(doc => {
      const demanda = demandas.find(d => d.id === doc.demandaId);
      const key = `${demanda?.sged}-${doc.autoridade}-${doc.orgaoJudicial}-${doc.dataAssinatura}`;

      if (!uniqueDecisions.has(key)) {
        uniqueDecisions.add(key);
        const orgao = doc.orgaoJudicial || 'Não especificado';
        orgaoJudicialCount[orgao] = (orgaoJudicialCount[orgao] || 0) + 1;
      }
    });

    // Converter para formato treemap
    const data = Object.entries(orgaoJudicialCount).map(([name, value]) => ({
      name,
      value,
    }));

    return data;
  }, [documentos, demandas, selectedYears]);

  const chartOptions = useMemo(() => {
    // Gerar escala de cores dinâmica baseada na quantidade de dados
    const purpleScale = generatePurpleScale(chartData.length);

    // Log para debug (remover em produção)
    console.log(
      `[JudicialOrgansTreemap] Dados: ${chartData.length} órgãos, usando ${purpleScale.length} tons de roxo`
    );
    console.log('[JudicialOrgansTreemap] Escala de cores:', purpleScale);

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
        ...STANDARD_TOOLTIP_CONFIG,
        trigger: 'item' as const,
        formatter: function (params: any) {
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          const percentage = ((params.value / total) * 100).toFixed(1);

          // Calcular qual cor está sendo usada para este item
          const sortedData = [...chartData].sort((a, b) => a.value - b.value);
          const itemIndex = sortedData.findIndex(item => item.name === params.name);
          const colorIndex = Math.floor((itemIndex / sortedData.length) * purpleScale.length);
          const itemColor = purpleScale[Math.min(colorIndex, purpleScale.length - 1)];

          return createTooltipHTML({
            title: params.name,
            items: [
              {
                label: 'Decisões',
                value: params.value,
                color: itemColor,
              },
              {
                label: 'Percentual',
                value: `${percentage}%`,
                isSecondary: true,
              },
            ],
            isTreemap: true,
          });
        },
      },
      visualMap: {
        type: 'continuous',
        min: Math.min(...chartData.map(item => item.value)),
        max: Math.max(...chartData.map(item => item.value)),
        inRange: {
          color: purpleScale, // Usar a escala dinâmica de roxo
        },
        show: false,
        calculable: false,
        realtime: false,
      },
      series: [
        {
          name: 'Órgãos Judiciais',
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
              return params.data.value > 2;
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
    } as any;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: '150px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>⚖️</div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
          Nenhuma decisão judicial encontrada
        </div>
        <div style={{ fontSize: '0.75rem', textAlign: 'center' }}>
          Nenhuma decisão judicial no período selecionado
        </div>
      </div>
    );
  }

  return (
    <EChartsWrapper
      option={chartOptions}
      height={300}
      opts={{ renderer: 'svg' }}
      key={`judicial-organs-treemap-${Array.isArray(selectedYears) ? selectedYears.join('-') : 'default'}`}
    />
  );
};

export default JudicialOrgansTreemap;
