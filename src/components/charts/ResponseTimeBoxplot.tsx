import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';

import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';

interface FilterState {
  decisaoJudicial: boolean;
  administrativo: boolean;
}

const ResponseTimeBoxplot: React.FC = () => {
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

  const boxplotData = useMemo(() => {
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
      return { providers: [], boxplotValues: [] };
    }

    // Filter documents that should have responses (Ofícios and Ofícios Circulares to providers)
    const documentsWithResponseTime = documentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento)) return false;
      
      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) return false;
      
      // Must have been sent and responded
      return doc.dataEnvio && doc.respondido && doc.dataResposta;
    });

    // Group response times by provider
    const providerResponseTimes = new Map<string, number[]>();

    documentsWithResponseTime.forEach(doc => {
      if (doc.tipoDocumento === 'Ofício Circular') {
        // Handle Ofício Circular - process each individual destinatário
        if (doc.destinatariosData) {
          doc.destinatariosData.forEach(destinatarioData => {
            const providerName = destinatarioData.nome;
            
            // Check if this provider is in mockProvedores
            const isValidProvider = mockProvedores.some(provedor => 
              provedor.nomeFantasia === providerName
            );
            
            if (!isValidProvider || !destinatarioData.dataEnvio || !destinatarioData.dataResposta) return;
            
            // Calculate response time in days
            const sentDate = new Date(destinatarioData.dataEnvio.split('/').reverse().join('-'));
            const responseDate = new Date(destinatarioData.dataResposta.split('/').reverse().join('-'));
            const responseTime = Math.ceil((responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (!providerResponseTimes.has(providerName)) {
              providerResponseTimes.set(providerName, []);
            }
            providerResponseTimes.get(providerName)!.push(responseTime);
          });
        }
      } else {
        // Handle regular Ofício
        const providerName = doc.destinatario;
        
        // Check if destinatario is a provider
        const isProvider = mockProvedores.some(provedor => 
          provedor.nomeFantasia === providerName
        );
        
        if (!isProvider) return;
        
        // Calculate response time in days
        const sentDate = new Date(doc.dataEnvio!.split('/').reverse().join('-'));
        const responseDate = new Date(doc.dataResposta!.split('/').reverse().join('-'));
        const responseTime = Math.ceil((responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (!providerResponseTimes.has(providerName)) {
          providerResponseTimes.set(providerName, []);
        }
        providerResponseTimes.get(providerName)!.push(responseTime);
      }
    });

    // Calculate boxplot values for each provider
    const providers: string[] = [];
    const boxplotValues: number[][] = [];

    providerResponseTimes.forEach((times, provider) => {
      if (times.length > 0) {
        providers.push(provider);
        
        // Sort times for percentile calculation
        const sortedTimes = [...times].sort((a, b) => a - b);
        
        // Calculate boxplot statistics
        const min = sortedTimes[0];
        const q1 = sortedTimes[Math.floor(sortedTimes.length * 0.25)];
        const median = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
        const q3 = sortedTimes[Math.floor(sortedTimes.length * 0.75)];
        const max = sortedTimes[sortedTimes.length - 1];
        
        boxplotValues.push([min, q1, median, q3, max]);
      }
    });

    // Sort providers by median response time
    const sortedIndices = boxplotValues
      .map((values, index) => ({ index, median: values[2] }))
      .sort((a, b) => a.median - b.median)
      .map(item => item.index);

    const sortedProviders = sortedIndices.map(i => providers[i]);
    const sortedValues = sortedIndices.map(i => boxplotValues[i]);

    return { providers: sortedProviders, boxplotValues: sortedValues };
  }, [filters, documentos]);

  const chartOptions = useMemo(() => {
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
        text: 'Tempo de Resposta por Provedor (Boxplot)',
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
        trigger: 'item',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params: {componentType: string; dataIndex: number; data: number[]}) {
          if (params.componentType === 'series') {
            const data = params.data;
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 8px;">${boxplotData.providers[params.dataIndex]}</div>
                <div>Mínimo: ${data[1]} dias</div>
                <div>1º Quartil: ${data[2]} dias</div>
                <div style="font-weight: bold; color: #3b82f6;">Mediana: ${data[3]} dias</div>
                <div>3º Quartil: ${data[4]} dias</div>
                <div>Máximo: ${data[5]} dias</div>
              </div>
            `;
          }
          return '';
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 80,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: boxplotData.providers,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Tempo de Resposta (dias)',
        nameLocation: 'middle',
        nameGap: 40,
        axisLabel: {
          formatter: '{value}d'
        }
      },
      series: [
        {
          name: 'Tempo de Resposta',
          type: 'boxplot',
          data: boxplotData.boxplotValues,
          itemStyle: {
            borderColor: '#3b82f6',
            color: '#dbeafe'
          },
          emphasis: {
            itemStyle: {
              borderColor: '#1d4ed8',
              color: '#bfdbfe',
              borderWidth: 2
            }
          }
        }
      ]
    };
  }, [boxplotData, filters]);

  // Calculate summary statistics
  const allResponseTimes = boxplotData.boxplotValues.flat();
  const avgMedian = boxplotData.boxplotValues.length > 0
    ? boxplotData.boxplotValues.reduce((sum, values) => sum + values[2], 0) / boxplotData.boxplotValues.length
    : 0;
  const minTime = allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0;
  const maxTime = allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0;

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
      {boxplotData.providers.length > 0 ? (
        <ReactECharts 
          option={chartOptions} 
          style={{ height: '500px', width: '100%' }}
          opts={{ renderer: 'svg' }}
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
            Selecione pelo menos um filtro para visualizar os dados de tempo de resposta
          </div>
        </div>
      )}
      
      {/* Summary Statistics - Only show when there's data */}
      {boxplotData.providers.length > 0 && (
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
              {boxplotData.providers.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Provedores Analisados
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {avgMedian.toFixed(1)} dias
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Mediana Média
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {minTime} dias
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Tempo Mínimo
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
              {maxTime} dias
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Tempo Máximo
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTimeBoxplot;