import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDemandasData } from '../../hooks/queries/useDemandas';

interface SolicitantesOrgansChartProps {
  selectedYears: string[];
}

// Configurações para auto-agrupamento
const MAX_VISIBLE_ORGANS = 20; // Threshold para agrupamento
const TOP_ORGANS_COUNT = 15; // Quantos órgãos mostrar antes de agrupar

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

      // Ordenar todos os órgãos por valor decrescente
      const sortedOrgans = Object.entries(orgaoCount).sort((a, b) => b[1] - a[1]);

      const totalOrgans = sortedOrgans.length;
      const needsGrouping = totalOrgans > MAX_VISIBLE_ORGANS;

      let chartData: {
        name: string;
        value: number;
        category: string;
        isGrouped?: boolean;
        originalOrgans?: { name: string; value: number; category: string }[];
      }[];

      if (needsGrouping) {
        // Pegar top N órgãos
        const topOrgans = sortedOrgans.slice(0, TOP_ORGANS_COUNT);
        const remainingOrgans = sortedOrgans.slice(TOP_ORGANS_COUNT);

        // Separar órgãos restantes por categoria
        const remainingGaeco = remainingOrgans.filter(([name]) => isGAECO(name));
        const remainingDemais = remainingOrgans.filter(([name]) => !isGAECO(name));

        // Criar dados do chart
        chartData = [
          // Top N órgãos individuais
          ...topOrgans.map(([name, value]) => ({
            name,
            value,
            category: isGAECO(name) ? 'gaeco' : 'demais',
          })),
        ];

        // Adicionar categoria "Outros GAECO" se houver
        if (remainingGaeco.length > 0) {
          const outrosGaecoValue = remainingGaeco.reduce((sum, [, value]) => sum + value, 0);
          chartData.push({
            name: `Outros GAECO (${remainingGaeco.length})`,
            value: outrosGaecoValue,
            category: 'gaeco',
            isGrouped: true,
            originalOrgans: remainingGaeco.map(([name, value]) => ({
              name,
              value,
              category: 'gaeco',
            })),
          });
        }

        // Adicionar categoria "Outros Órgãos" se houver
        if (remainingDemais.length > 0) {
          const outrosDemaisValue = remainingDemais.reduce((sum, [, value]) => sum + value, 0);
          chartData.push({
            name: `Outros Órgãos (${remainingDemais.length})`,
            value: outrosDemaisValue,
            category: 'demais',
            isGrouped: true,
            originalOrgans: remainingDemais.map(([name, value]) => ({
              name,
              value,
              category: 'demais',
            })),
          });
        }
      } else {
        // Sem agrupamento - usar todos os órgãos
        chartData = sortedOrgans.map(([name, value]) => ({
          name,
          value,
          category: isGAECO(name) ? 'gaeco' : 'demais',
        }));
      }

      const gaecoTotal = Object.values(gaecoOrgaos).reduce((sum, val) => sum + val, 0);
      const demaisTotal = Object.values(demaisOrgaos).reduce((sum, val) => sum + val, 0);
      const gaecoCount = Object.keys(gaecoOrgaos).length;
      const demaisCount = Object.keys(demaisOrgaos).length;

      // Log para debug
      console.log(`[SolicitantesOrgansChart] Total: ${totalOrgans} órgãos`);
      console.log(`[SolicitantesOrgansChart] GAECO: ${gaecoCount} órgãos, ${gaecoTotal} demandas`);
      console.log(
        `[SolicitantesOrgansChart] Demais: ${demaisCount} órgãos, ${demaisTotal} demandas`
      );
      console.log(`[SolicitantesOrgansChart] Agrupamento: ${needsGrouping ? 'ATIVO' : 'INATIVO'}`);

      return {
        chartData,
        gaecoTotal,
        demaisTotal,
        gaecoCount,
        demaisCount,
        hasGrouping: needsGrouping,
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
    const getColorByCategory = (item: { category: string; value: number }): string => {
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
            isGrouped?: boolean;
            originalOrgans?: { name: string; value: number; category: string }[];
          };
        }) {
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : '0.0';
          const isGAECO = params.data.category === 'gaeco';
          const grupo = isGAECO ? 'GAECO' : 'Demais Órgãos';

          let tooltipContent = `
            <div style="padding: 10px; min-width: 200px; max-width: 350px;">
              <div style="font-weight: bold; margin-bottom: 6px; color: #1f2937; font-size: 14px;">${params.name}</div>
              <div style="color: ${isGAECO ? '#3b82f6' : '#10b981'}; margin-bottom: 3px; font-weight: 600;">Demandas: ${params.value}</div>
              <div style="color: #64748b; margin-bottom: 3px;">Percentual: ${percentage}%</div>
              <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">Grupo: ${grupo}</div>
          `;

          // Se for um item agrupado, mostrar detalhes dos órgãos
          if (params.data.isGrouped && params.data.originalOrgans) {
            tooltipContent += `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
                <div style="font-weight: 600; color: #4b5563; font-size: 12px; margin-bottom: 4px;">
                  Órgãos inclusos:
                </div>
                <div style="max-height: 120px; overflow-y: auto;">
            `;

            // Ordenar órgãos por valor decrescente
            const sortedOrgans = [...params.data.originalOrgans].sort((a, b) => b.value - a.value);

            sortedOrgans.forEach(organ => {
              const orgPercentage = total > 0 ? ((organ.value / total) * 100).toFixed(1) : '0.0';
              tooltipContent += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 2px 0; font-size: 11px;">
                  <span style="color: #6b7280; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${organ.name}">
                    ${organ.name}
                  </span>
                  <span style="color: ${isGAECO ? '#3b82f6' : '#10b981'}; font-weight: 500; margin-left: 8px;">
                    ${organ.value} (${orgPercentage}%)
                  </span>
                </div>
              `;
            });

            tooltipContent += `
                </div>
                <div style="font-size: 10px; color: #9ca3af; margin-top: 4px; font-style: italic;">
                  💡 Órgãos agrupados automaticamente (total > ${MAX_VISIBLE_ORGANS})
                </div>
              </div>
            `;
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
            title={`Mostrando top ${TOP_ORGANS_COUNT} órgãos + agrupamentos. Total de órgãos encontrados: ${gaecoCount + demaisCount}`}
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
