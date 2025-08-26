import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useDemandas } from '../../hooks/useDemandas';

interface JudicialOrgansTreemapProps {
  selectedYears: string[];
}

const JudicialOrgansTreemap: React.FC<JudicialOrgansTreemapProps> = ({
  selectedYears,
}) => {
  const { documentos } = useDocumentos();
  const { demandas } = useDemandas();

  const chartData = useMemo(() => {
    // Filtrar documentos de decisão judicial do período selecionado
    const relevantDocs = documentos.filter(doc => {
      const demanda = demandas.find(d => d.id === doc.demandaId);
      if (!demanda?.dataInicial) return false;
      const docYear = demanda.dataInicial.split('/')[2];
      if (!selectedYears.includes(docYear)) return false;

      const isValidType =
        doc.tipoDocumento === 'Ofício' ||
        doc.tipoDocumento === 'Ofício Circular';
      const isDecisaoJudicial =
        doc.assunto === 'Encaminhamento de decisão judicial';

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
    return {
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: function (params: { name: string; value: number }) {
          const total = chartData.reduce((sum, item) => sum + item.value, 0);
          const percentage = ((params.value / total) * 100).toFixed(1);
          return `
            <div style="padding: 10px; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 6px; color: #1f2937; font-size: 14px;">${params.name}</div>
              <div style="color: #3b82f6; margin-bottom: 3px; font-weight: 600;">Decisões: ${params.value}</div>
              <div style="color: #64748b;">Percentual: ${percentage}%</div>
            </div>
          `;
        },
      },
      visualMap: {
        type: 'continuous',
        min: Math.min(...chartData.map(item => item.value)),
        max: Math.max(...chartData.map(item => item.value)),
        inRange: {
          color: ['#e9d5ff', '#a855f7', '#6b21a8'],
        },
        show: false,
      },
      series: [
        {
          name: 'Órgãos Judiciais',
          type: 'treemap',
          data: chartData,
          roam: false,
          nodeClick: false,
          animation: false,
          breadcrumb: {
            show: false,
          },
          label: {
            show: true,
            fontSize: 11,
            color: '#000',
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
          height: '200px',
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
    <ReactECharts
      option={chartOptions}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
      opts={{ renderer: 'svg' }}
      key={`judicial-organs-treemap-${selectedYears.join('-')}`}
      notMerge={true}
    />
  );
};

export default JudicialOrgansTreemap;
