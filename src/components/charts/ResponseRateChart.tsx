import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';

interface ResponseRateData {
  providerName: string;
  totalDocuments: number;
  respondedDocuments: number;
  notRespondedDocuments: number;
  responseRate: number;
}

interface FilterState {
  decisaoJudicial: boolean;
  administrativo: boolean;
}

const ResponseRateChart: React.FC = () => {
  const { documentos } = useDocumentos();
  const [filters, setFilters] = useState<FilterState>({
    decisaoJudicial: true,
    administrativo: true,
  });

  const toggleFilter = (filterType: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };
  const responseData = useMemo(() => {
    // Define subjects based on filter types
    const decisaoJudicialSubjects = ['Encaminhamento de decisão judicial'];
    const administrativoSubjects = [
      'Requisição de dados cadastrais',
      'Requisição de dados cadastrais e preservação de dados',
      'Solicitação de dados cadastrais'
    ];

    // Determine which subjects to include based on active filters
    const allowedSubjects: string[] = [];
    if (filters.decisaoJudicial) {
      allowedSubjects.push(...decisaoJudicialSubjects);
    }
    if (filters.administrativo) {
      allowedSubjects.push(...administrativoSubjects);
    }

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return [];
    }

    // Filter documents that should have responses (Ofícios and Ofícios Circulares to providers)
    const documentsToProviders = documentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) return false;
      
      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) return false;
      
      // Check if destinatario is a provider by looking for it in mockProvedores
      const isProvider = mockProvedores.some(provedor => 
        provedor.nomeFantasia === doc.destinatario ||
        (doc.tipoDocumento === 'Ofício Circular' && doc.destinatario.includes(provedor.nomeFantasia))
      );
      
      return isProvider && doc.dataEnvio; // Only count sent documents
    });

    // Group by provider and calculate response rates
    const providerStats = new Map<string, ResponseRateData>();

    documentsToProviders.forEach(doc => {
      if (doc.tipoDocumento === 'Ofício Circular') {
        // Handle Ofício Circular - process each individual destinatário
        if (doc.destinatariosData) {
          doc.destinatariosData.forEach(destinatarioData => {
            const providerName = destinatarioData.nome;
            
            // Check if this provider is in mockProvedores
            const isValidProvider = mockProvedores.some(provedor => 
              provedor.nomeFantasia === providerName
            );
            
            if (!isValidProvider || !destinatarioData.dataEnvio) return;
            
            if (!providerStats.has(providerName)) {
              providerStats.set(providerName, {
                providerName,
                totalDocuments: 0,
                respondedDocuments: 0,
                notRespondedDocuments: 0,
                responseRate: 0
              });
            }

            const stats = providerStats.get(providerName)!;
            stats.totalDocuments++;
            
            if (destinatarioData.respondido && destinatarioData.dataResposta) {
              stats.respondedDocuments++;
            } else {
              stats.notRespondedDocuments++;
            }
          });
        }
      } else {
        // Handle regular Ofício
        const providerName = doc.destinatario;
        
        if (!providerStats.has(providerName)) {
          providerStats.set(providerName, {
            providerName,
            totalDocuments: 0,
            respondedDocuments: 0,
            notRespondedDocuments: 0,
            responseRate: 0
          });
        }

        const stats = providerStats.get(providerName)!;
        stats.totalDocuments++;
        
        if (doc.respondido && doc.dataResposta) {
          stats.respondedDocuments++;
        } else {
          stats.notRespondedDocuments++;
        }
      }
    });

    // Calculate response rates
    const result = Array.from(providerStats.values()).map(stats => ({
      ...stats,
      responseRate: stats.totalDocuments > 0 
        ? (stats.respondedDocuments / stats.totalDocuments) * 100 
        : 0
    }));

    // Sort by response rate (ascending) to show worst performers first
    return result.sort((a, b) => a.responseRate - b.responseRate);
  }, [filters.administrativo, filters.decisaoJudicial, documentos]);

  const chartOptions = useMemo(() => {
    const providers = responseData.map(item => item.providerName);
    const respondedPercentages = responseData.map(item => 
      item.totalDocuments > 0 ? (item.respondedDocuments / item.totalDocuments) * 100 : 0
    );
    const notRespondedPercentages = responseData.map(item => 
      item.totalDocuments > 0 ? (item.notRespondedDocuments / item.totalDocuments) * 100 : 0
    );

    // Generate subtitle based on active filters
    const getSubtitle = () => {
      const activeFilters = [];
      if (filters.decisaoJudicial) activeFilters.push('Decisão Judicial');
      if (filters.administrativo) activeFilters.push('Administrativo');
      
      if (activeFilters.length === 0) {
        return 'Nenhum filtro ativo';
      } else if (activeFilters.length === 2) {
        return 'Filtros: Decisão Judicial e Administrativo';
      } else {
        return `Filtro: ${activeFilters[0]}`;
      }
    };

    return {
      title: {
        text: 'Taxa de Resposta por Provedor',
        subtext: getSubtitle(),
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1e293b'
        },
        subtextStyle: {
          fontSize: 12,
          color: '#64748b'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: Array<{dataIndex: number; value: number}>) {
          const dataIndex = params[0].dataIndex;
          const data = responseData[dataIndex];
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${data.providerName}</div>
              <div style="color: #22c55e;">Respondidos: ${data.respondedDocuments} (${params[0].value.toFixed(1)}%)</div>
              <div style="color: #ef4444;">Não Respondidos: ${data.notRespondedDocuments} (${params[1].value.toFixed(1)}%)</div>
              <div style="margin-top: 4px; font-weight: bold;">Total de Documentos: ${data.totalDocuments}</div>
            </div>
          `;
        }
      },
      legend: {
        data: ['Respondidos', 'Não Respondidos'],
        top: 40,
        itemGap: 20
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      yAxis: {
        type: 'category',
        data: providers,
        axisLabel: {
          fontSize: 10,
          width: 100,
          overflow: 'truncate'
        }
      },
      series: [
        {
          name: 'Respondidos',
          type: 'bar',
          stack: 'total',
          data: respondedPercentages,
          itemStyle: {
            color: '#22c55e'
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: 'Não Respondidos',
          type: 'bar',
          stack: 'total',
          data: notRespondedPercentages,
          itemStyle: {
            color: '#ef4444'
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    };
  }, [responseData]);

  // Summary statistics for display below chart
  const totalDocuments = responseData.reduce((sum, item) => sum + item.totalDocuments, 0);
  const totalResponded = responseData.reduce((sum, item) => sum + item.respondedDocuments, 0);
  const overallResponseRate = totalDocuments > 0 ? (totalResponded / totalDocuments) * 100 : 0;

  return (
    <div style={{ width: '100%', padding: '1rem' }}>
      {/* Filter Buttons */}
      <div style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => toggleFilter('decisaoJudicial')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '2px solid #3b82f6',
            backgroundColor: filters.decisaoJudicial ? '#3b82f6' : 'white',
            color: filters.decisaoJudicial ? 'white' : '#3b82f6',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (!filters.decisaoJudicial) {
              e.currentTarget.style.backgroundColor = '#dbeafe';
            }
          }}
          onMouseLeave={(e) => {
            if (!filters.decisaoJudicial) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: filters.decisaoJudicial ? 'white' : '#3b82f6'
          }} />
          Decisão Judicial
        </button>
        
        <button
          onClick={() => toggleFilter('administrativo')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: '2px solid #8b5cf6',
            backgroundColor: filters.administrativo ? '#8b5cf6' : 'white',
            color: filters.administrativo ? 'white' : '#8b5cf6',
            fontWeight: '600',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (!filters.administrativo) {
              e.currentTarget.style.backgroundColor = '#f3e8ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!filters.administrativo) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: filters.administrativo ? 'white' : '#8b5cf6'
          }} />
          Administrativo
        </button>
      </div>

      {/* Chart */}
      {responseData.length > 0 ? (
        <ReactECharts 
          option={chartOptions} 
          style={{ height: '600px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      ) : (
        <div style={{
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '1.125rem'
        }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '3rem' }}>📊</div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            Nenhum dado disponível
          </div>
          <div style={{ fontSize: '0.875rem', textAlign: 'center' }}>
            Selecione pelo menos um filtro para visualizar os dados
          </div>
        </div>
      )}
      
      {/* Summary Statistics - Only show when there's data */}
      {responseData.length > 0 && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#f8fafc', 
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {responseData.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Provedores Analisados
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
              {totalDocuments}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Total de Documentos
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {totalResponded}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Documentos Respondidos
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: overallResponseRate >= 50 ? '#22c55e' : '#ef4444' }}>
              {overallResponseRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Taxa Geral de Resposta
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseRateChart;