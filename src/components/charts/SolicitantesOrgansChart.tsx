import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDemandasData } from '../../hooks/queries/useDemandas';

interface SolicitantesOrgansChartProps {
  selectedYears: string[];
}

// Configurações para auto-agrupamento
const MAX_DEMAIS_ORGANS_INDIVIDUAL = 13; // Threshold para agrupar apenas "Demais Órgãos"
const TOP_DEMAIS_ORGANS_COUNT = 10; // Quantos "Demais Órgãos" mostrar antes de agrupar

// Função para gerar escala dinâmica de azul baseada no volume de dados (GAECO)
const generateBlueScale = (dataLength: number): string[] => {
  // Paleta base de 7 tons de azul visíveis - do mais claro ao mais escuro
  // Removido Blue-100 e 200 (muito claros), interpolado entre as cores visíveis
  const blueBase = [
    '#93c5fd', // Blue-300 - azul claro mas bem visível
    '#7db4fd', // Interpolado entre Blue-300 e 400
    '#60a5fa', // Blue-400 - azul médio vibrante
    '#4f94f8', // Interpolado entre Blue-400 e 500
    '#3b82f6', // Blue-500 - azul médio-escuro
    '#2563eb', // Blue-600 - azul escuro
    '#1d4ed8', // Blue-700 - azul muito escuro
  ];

  // Lógica dinâmica baseada no volume de dados
  if (dataLength <= 3) {
    // Poucos dados: usar 4 cores com maior contraste
    return [
      blueBase[0], // Blue-300 - bem visível
      blueBase[2], // Blue-400 - médio vibrante
      blueBase[4], // Blue-500 - médio-escuro
      blueBase[6], // Blue-700 - muito escuro
    ];
  } else if (dataLength <= 5) {
    // Volume médio: usar 5 cores bem distribuídas
    return [
      blueBase[0], // Blue-300 - bem visível
      blueBase[1], // Interpolado 300-400
      blueBase[3], // Interpolado 400-500
      blueBase[5], // Blue-600 - escuro
      blueBase[6], // Blue-700 - muito escuro
    ];
  } else {
    // Muitos dados (6+): usar todas as 7 cores para máxima granularidade
    return blueBase;
  }
};

// Função para gerar escala dinâmica de verde baseada no volume de dados (Demais Órgãos)
const generateGreenScale = (dataLength: number): string[] => {
  // Paleta base de 7 tons de verde visíveis - do mais claro ao mais escuro
  // Removido Emerald-100 e 200 (muito claros), interpolado entre as cores visíveis
  const greenBase = [
    '#6ee7b7', // Emerald-300 - verde claro mas bem visível
    '#51e0a5', // Interpolado entre Emerald-300 e 400
    '#34d399', // Emerald-400 - verde médio vibrante
    '#22cd8d', // Interpolado entre Emerald-400 e 500
    '#10b981', // Emerald-500 - verde médio-escuro
    '#059669', // Emerald-600 - verde escuro
    '#047857', // Emerald-700 - verde muito escuro
  ];

  // Lógica dinâmica baseada no volume de dados
  if (dataLength <= 3) {
    // Poucos dados: usar 4 cores com maior contraste
    return [
      greenBase[0], // Emerald-300 - bem visível
      greenBase[2], // Emerald-400 - médio vibrante
      greenBase[4], // Emerald-500 - médio-escuro
      greenBase[6], // Emerald-700 - muito escuro
    ];
  } else if (dataLength <= 5) {
    // Volume médio: usar 5 cores bem distribuídas
    return [
      greenBase[0], // Emerald-300 - bem visível
      greenBase[1], // Interpolado 300-400
      greenBase[3], // Interpolado 400-500
      greenBase[5], // Emerald-600 - escuro
      greenBase[6], // Emerald-700 - muito escuro
    ];
  } else {
    // Muitos dados (6+): usar todas as 7 cores para máxima granularidade
    return greenBase;
  }
};

const SolicitantesOrgansChart: React.FC<SolicitantesOrgansChartProps> = ({ selectedYears }) => {
  const { data: demandas = [] } = useDemandasData();
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    organs: { name: string; value: number; category: string }[];
    title: string;
  }>({ isOpen: false, organs: [], title: '' });

  const { chartData, gaecoTotal, demaisTotal, gaecoCount, demaisCount, hasGrouping } =
    useMemo(() => {
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

      // Separar órgãos por categoria e ordenar cada categoria
      const gaecoEntries = Object.entries(gaecoOrgaos).sort((a, b) => b[1] - a[1]);
      const demaisEntries = Object.entries(demaisOrgaos).sort((a, b) => b[1] - a[1]);

      const totalOrgans = gaecoEntries.length + demaisEntries.length;
      const demaisNeedsGrouping = demaisEntries.length > MAX_DEMAIS_ORGANS_INDIVIDUAL;

      let chartData: {
        name: string;
        value: number;
        actualValue?: number; // Valor real quando value é artificial
        category: string;
        isGrouped?: boolean;
        isSpecial?: boolean; // Para elementos que não seguem regras normais
        originalOrgans?: { name: string; value: number; category: string }[];
      }[];

      // GAECO: sempre mostrar TODOS os órgãos individuais (são apenas ~7)
      const gaecoData = gaecoEntries.map(([name, value]) => ({
        name,
        value,
        category: 'gaeco' as const,
      }));

      let demaisData: typeof chartData;

      if (demaisNeedsGrouping) {
        // Demais Órgãos: agrupar se > 13
        const topDemais = demaisEntries.slice(0, TOP_DEMAIS_ORGANS_COUNT);
        const remainingDemais = demaisEntries.slice(TOP_DEMAIS_ORGANS_COUNT);

        // Top N demais órgãos individuais
        demaisData = topDemais.map(([name, value]) => ({
          name,
          value,
          category: 'demais' as const,
        }));

        // Agrupar restante em "Outros Órgãos"
        if (remainingDemais.length > 0) {
          const outrosDemaisValue = remainingDemais.reduce((sum, [, value]) => sum + value, 0);

          // Calcular valor artificial pequeno (5% do menor órgão individual ou mínimo de 1)
          const individualValues = [...gaecoEntries, ...topDemais].map(([, value]) => value);
          const minIndividualValue = Math.min(...individualValues);
          const artificialValue = Math.max(1, Math.floor(minIndividualValue * 0.05));

          demaisData.push({
            name: `Outros Órgãos (${remainingDemais.length})`,
            value: artificialValue, // Valor artificial pequeno para não interferir no layout
            actualValue: outrosDemaisValue, // Valor real para tooltip e estatísticas
            category: 'demais',
            isGrouped: true,
            isSpecial: true, // Flag para tratamento especial
            originalOrgans: remainingDemais.map(([name, value]) => ({
              name,
              value,
              category: 'demais',
            })),
          });
        }
      } else {
        // Demais Órgãos: mostrar todos individuais (≤ 13)
        demaisData = demaisEntries.map(([name, value]) => ({
          name,
          value,
          category: 'demais' as const,
        }));
      }

      // Combinar GAECO + Demais
      chartData = [...gaecoData, ...demaisData];

      const gaecoTotal = Object.values(gaecoOrgaos).reduce((sum, val) => sum + val, 0);
      const demaisTotal = Object.values(demaisOrgaos).reduce((sum, val) => sum + val, 0);
      const gaecoCount = Object.keys(gaecoOrgaos).length;
      const demaisCount = Object.keys(demaisOrgaos).length;

      // Log para debug
      console.log(`[SolicitantesOrgansChart] Total: ${totalOrgans} órgãos`);
      console.log(
        `[SolicitantesOrgansChart] GAECO: ${gaecoCount} órgãos, ${gaecoTotal} demandas (TODOS individuais)`
      );
      console.log(
        `[SolicitantesOrgansChart] Demais: ${demaisCount} órgãos, ${demaisTotal} demandas`
      );
      console.log(
        `[SolicitantesOrgansChart] Agrupamento Demais: ${demaisNeedsGrouping ? 'ATIVO' : 'INATIVO'}`
      );

      return {
        chartData,
        gaecoTotal,
        demaisTotal,
        gaecoCount,
        demaisCount,
        hasGrouping: demaisNeedsGrouping,
      };
    }, [demandas, selectedYears]);

  const chartOptions = useMemo(() => {
    // Gerar escalas dinâmicas baseadas na quantidade de dados visíveis (não totais)
    const visibleGaecoCount = chartData.filter(d => d.category === 'gaeco').length;
    const visibleDemaisCount = chartData.filter(d => d.category === 'demais').length;

    const blueScale = generateBlueScale(visibleGaecoCount);
    const greenScale = generateGreenScale(visibleDemaisCount);

    // Pre-computar valores para evitar re-cálculos
    const gaecoValues = chartData
      .filter(d => d.category === 'gaeco')
      .map(d => d.value)
      .sort((a, b) => a - b);

    const demaisValues = chartData
      .filter(d => d.category === 'demais')
      .map(d => d.value)
      .sort((a, b) => a - b);

    // Pre-computar ranges para normalização
    const gaecoRange = {
      min: gaecoValues.length > 0 ? gaecoValues[0] : 0,
      max: gaecoValues.length > 0 ? gaecoValues[gaecoValues.length - 1] : 0,
      span: 0,
    };
    gaecoRange.span = gaecoRange.max - gaecoRange.min;

    const demaisRange = {
      min: demaisValues.length > 0 ? demaisValues[0] : 0,
      max: demaisValues.length > 0 ? demaisValues[demaisValues.length - 1] : 0,
      span: 0,
    };
    demaisRange.span = demaisRange.max - demaisRange.min;

    // Função otimizada para mapear cores
    const getColorByCategory = (item: {
      category: string;
      value: number;
      isSpecial?: boolean;
    }): string => {
      // Elementos especiais sempre usam cinza fixo
      if (item.isSpecial) {
        return '#9ca3af'; // Gray-400 - cinza neutro
      }

      if (item.category === 'gaeco') {
        if (gaecoValues.length <= 1) {
          return blueScale[Math.floor(blueScale.length / 2)];
        }

        const normalizedValue =
          gaecoRange.span > 0 ? (item.value - gaecoRange.min) / gaecoRange.span : 0;
        const colorIndex = Math.floor(normalizedValue * (blueScale.length - 1));
        return blueScale[colorIndex];
      } else {
        if (demaisValues.length <= 1) {
          return greenScale[Math.floor(greenScale.length / 2)];
        }

        const normalizedValue =
          demaisRange.span > 0 ? (item.value - demaisRange.min) / demaisRange.span : 0;
        const colorIndex = Math.floor(normalizedValue * (greenScale.length - 1));
        return greenScale[colorIndex];
      }
    };

    // Pre-computar todas as cores uma vez
    const dataWithColors = chartData.map(item => ({
      ...item,
      itemStyle: {
        color: getColorByCategory(item),
      },
    }));

    // Log para debug
    console.log(
      `[SolicitantesOrgansChart] Usando ${blueScale.length} tons de azul para ${visibleGaecoCount} GAECO visíveis`
    );
    console.log(
      `[SolicitantesOrgansChart] Usando ${greenScale.length} tons de verde para ${visibleDemaisCount} Demais visíveis`
    );

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
        formatter: function (params: {
          name: string;
          value: number;
          data: {
            category: string;
            actualValue?: number;
            isGrouped?: boolean;
            isSpecial?: boolean;
            originalOrgans?: { name: string; value: number; category: string }[];
          };
        }) {
          // Para elementos especiais, usar valor real para cálculos
          const displayValue = params.data.actualValue || params.value;
          const realTotal = chartData.reduce(
            (sum, item) => sum + (item.actualValue || item.value),
            0
          );
          const percentage = realTotal > 0 ? ((displayValue / realTotal) * 100).toFixed(1) : '0.0';

          const isGAECO = params.data.category === 'gaeco';
          const isSpecial = params.data.isSpecial;

          let grupo = isGAECO ? 'GAECO' : 'Demais Órgãos';
          const color = isSpecial ? '#6b7280' : isGAECO ? '#3b82f6' : '#10b981';

          if (isSpecial) {
            grupo = 'Agrupamento';
          }

          let tooltipContent = `
            <div style="padding: 10px; min-width: 200px; max-width: 350px;">
              <div style="font-weight: bold; margin-bottom: 6px; color: #1f2937; font-size: 14px;">${params.name}</div>
              <div style="color: ${color}; margin-bottom: 3px; font-weight: 600;">Demandas: ${displayValue}</div>
              <div style="color: #64748b; margin-bottom: 3px;">Percentual: ${percentage}%</div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">Grupo: ${grupo}</div>
          `;

          // Se for um item agrupado, mostrar detalhes dos órgãos
          if (params.data.isGrouped && params.data.originalOrgans) {
            if (isSpecial) {
              // Para elementos especiais, mostrar informação sobre drill-down
              tooltipContent += `
                <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
                  <div style="font-weight: 600; color: #4b5563; font-size: 12px; margin-bottom: 4px;">
                    ${params.data.originalOrgans.length} órgãos agrupados
                  </div>
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-style: italic;">
                    🖱️ Clique para ver detalhes em treemap dedicado
                  </div>
                  <div style="font-size: 10px; color: #9ca3af; font-style: italic;">
                    💡 Área fixa para não interferir no ranking visual
                  </div>
                </div>
              `;
            } else {
              // Para elementos normais agrupados, mostrar lista
              tooltipContent += `
                <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
                  <div style="font-weight: 600; color: #4b5563; font-size: 12px; margin-bottom: 4px;">
                    Órgãos inclusos:
                  </div>
                  <div style="max-height: 120px; overflow-y: auto;">
              `;

              // Ordenar órgãos por valor decrescente
              const sortedOrgans = [...params.data.originalOrgans].sort(
                (a, b) => b.value - a.value
              );

              sortedOrgans.forEach(organ => {
                const orgPercentage =
                  realTotal > 0 ? ((organ.value / realTotal) * 100).toFixed(1) : '0.0';
                tooltipContent += `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0; font-size: 11px;">
                    <span style="color: #6b7280; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${organ.name}">
                      ${organ.name}
                    </span>
                    <span style="color: ${color}; font-weight: 500; margin-left: 8px;">
                      ${organ.value} (${orgPercentage}%)
                    </span>
                  </div>
                `;
              });

              tooltipContent += `
                  </div>
                  <div style="font-size: 10px; color: #9ca3af; margin-top: 4px; font-style: italic;">
                    💡 Demais órgãos agrupados automaticamente (${demaisCount} total > ${MAX_DEMAIS_ORGANS_INDIVIDUAL})
                  </div>
                </div>
              `;
            }
          }

          tooltipContent += `</div>`;
          return tooltipContent;
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
            show: function (params: {
              data: { value: number };
              rect?: { width: number; height: number };
            }) {
              // Calcular área aproximada baseada no valor
              const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
              const itemRatio = totalValue > 0 ? params.data.value / totalValue : 0;

              // Área disponível: 70% de largura ~210px × 300px altura = 63,000px²
              const availableArea = 210 * 300;
              const estimatedArea = itemRatio * availableArea;

              // Mostrar label apenas se:
              // 1. Área >= 400px² (retângulo ~20x20px mínimo legível)
              // 2. Valor > 1 (dados relevantes)
              // 3. Com agrupamento: ser mais seletivo (área >= 800px²)
              const minArea = hasGrouping ? 800 : 400;

              return estimatedArea >= minArea && params.data.value > 1;
            },
            fontSize: function (params: { data: { value: number } }) {
              // Ajustar tamanho da fonte baseado na área
              const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
              const itemRatio = totalValue > 0 ? params.data.value / totalValue : 0;
              const availableArea = 210 * 300;
              const estimatedArea = itemRatio * availableArea;

              // Font size dinâmico: 10px para pequenos, 13px para grandes
              if (estimatedArea >= 2000) return 13;
              if (estimatedArea >= 1000) return 11;
              return 10;
            },
            color: '#ffffff',
            fontWeight: 'normal',
            // Truncar texto longo para caber em retângulos pequenos
            formatter: function (params: { data: { name: string; value: number } }) {
              const name = params.data.name;
              const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
              const itemRatio = totalValue > 0 ? params.data.value / totalValue : 0;
              const availableArea = 210 * 300;
              const estimatedArea = itemRatio * availableArea;

              // Truncar nome baseado na área estimada
              if (estimatedArea < 1000) {
                // Área pequena: mostrar apenas iniciais ou nome muito curto
                return name.length > 8 ? name.substring(0, 8) + '...' : name;
              } else if (estimatedArea < 3000) {
                // Área média: nome moderadamente truncado
                return name.length > 15 ? name.substring(0, 15) + '...' : name;
              } else {
                // Área grande: nome completo ou pouco truncado
                return name.length > 25 ? name.substring(0, 25) + '...' : name;
              }
            },
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
        {/* Indicador de agrupamento */}
        {hasGrouping && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
            title={`Mostrando ${gaecoCount} GAECO individuais + top ${TOP_DEMAIS_ORGANS_COUNT} demais + agrupamento. Total: ${gaecoCount + demaisCount} órgãos`}
          >
            📊 Agrupado
          </div>
        )}
        <ReactECharts
          option={chartOptions}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
          key={`solicitantes-treemap-${selectedYears.join('-')}`}
          notMerge={true}
          onEvents={{
            click: (params: any) => {
              // Abrir modal apenas para elementos especiais agrupados
              if (params.data?.isSpecial && params.data?.isGrouped && params.data?.originalOrgans) {
                setModalData({
                  isOpen: true,
                  organs: params.data.originalOrgans,
                  title: `Detalhes de ${params.name}`,
                });
              }
            },
          }}
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

      {/* Modal de drill-down para órgãos agrupados */}
      {modalData.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalData({ isOpen: false, organs: [], title: '' })}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '90vw',
              maxHeight: '80vh',
              width: '800px',
              height: '600px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem',
              }}
            >
              <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
                {modalData.title}
              </h3>
              <button
                onClick={() => setModalData({ isOpen: false, organs: [], title: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem',
                  borderRadius: '4px',
                }}
              >
                ×
              </button>
            </div>

            {/* Conteúdo do modal - treemap dos órgãos agrupados */}
            <div style={{ flex: 1, position: 'relative' }}>
              <ReactECharts
                option={{
                  animation: false,
                  tooltip: {
                    trigger: 'item',
                    formatter: function (params: { name: string; value: number }) {
                      const total = modalData.organs.reduce((sum, org) => sum + org.value, 0);
                      const percentage =
                        total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';
                      return `
                        <div style="padding: 8px;">
                          <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
                          <div style="color: #10b981; font-weight: 600;">Demandas: ${params.value}</div>
                          <div style="color: #64748b;">Percentual: ${percentage}%</div>
                        </div>
                      `;
                    },
                  },
                  visualMap: {
                    type: 'continuous',
                    min: Math.min(...modalData.organs.map(org => org.value)),
                    max: Math.max(...modalData.organs.map(org => org.value)),
                    inRange: {
                      color: generateGreenScale(modalData.organs.length),
                    },
                    show: false,
                  },
                  series: [
                    {
                      name: 'Órgãos Agrupados',
                      type: 'treemap',
                      data: modalData.organs.map(organ => ({
                        name: organ.name,
                        value: organ.value,
                      })),
                      roam: false,
                      nodeClick: false,
                      animation: false,
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      breadcrumb: { show: false },
                      label: {
                        show: true,
                        fontSize: 12,
                        color: '#ffffff',
                        fontWeight: 'normal',
                      },
                      itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 1,
                      },
                      emphasis: { disabled: true },
                    },
                  ],
                }}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>

            {/* Footer com informações */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#6b7280',
              }}
            >
              <strong>{modalData.organs.length} órgãos</strong> com total de{' '}
              <strong>{modalData.organs.reduce((sum, org) => sum + org.value, 0)} demandas</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitantesOrgansChart;
