import { useMemo } from 'react';
import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useProviderFilters } from '../../hooks/useProviderFilters';

// Função para formatar números decimais no padrão brasileiro
const formatDecimalBR = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals).replace('.', ',');
};

interface ProviderPerformance {
  name: string;
  averageTime: number;
  totalDocuments: number;
}

interface ProviderRankingProps {
  filters: ReturnType<typeof useProviderFilters>;
}

const ProviderRanking: React.FC<ProviderRankingProps> = ({ filters }) => {
  const { documentos } = useDocumentos();

  const { topProviders, bottomProviders } = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty data
    if (allowedSubjects.length === 0) {
      return { topProviders: [], bottomProviders: [] };
    }

    // Filter documents that should have response times
    const documentsWithResponseTime = documentos.filter(doc => {
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento))
        return false;
      if (!allowedSubjects.includes(doc.assunto)) return false;
      return doc.dataEnvio;
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
            const isValidProvider = mockProvedores.some(
              provedor => provedor.nomeFantasia === providerName
            );

            if (!isValidProvider || !destinatarioData.dataEnvio) return;

            // Calculate response time in days (use current date if not responded yet)
            const sentDate = new Date(
              destinatarioData.dataEnvio.split('/').reverse().join('-')
            );
            const responseDate = destinatarioData.dataResposta
              ? new Date(
                  destinatarioData.dataResposta.split('/').reverse().join('-')
                )
              : new Date(); // Use current date if not responded
            const responseTime = Math.ceil(
              (responseDate.getTime() - sentDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

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
        const isProvider = mockProvedores.some(
          provedor => provedor.nomeFantasia === providerName
        );

        if (!isProvider) return;

        // Calculate response time in days (use current date if not responded yet)
        const sentDate = new Date(
          doc.dataEnvio!.split('/').reverse().join('-')
        );
        const responseDate = doc.dataResposta
          ? new Date(doc.dataResposta.split('/').reverse().join('-'))
          : new Date(); // Use current date if not responded
        const responseTime = Math.ceil(
          (responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!providerResponseTimes.has(providerName)) {
          providerResponseTimes.set(providerName, []);
        }
        providerResponseTimes.get(providerName)!.push(responseTime);
      }
    });

    // Calculate average response time for each provider
    const providerPerformances: ProviderPerformance[] = [];

    providerResponseTimes.forEach((times, provider) => {
      if (times.length > 0) {
        const averageTime =
          times.reduce((sum, time) => sum + time, 0) / times.length;
        providerPerformances.push({
          name: provider,
          averageTime: Math.round(averageTime * 10) / 10,
          totalDocuments: times.length,
        });
      }
    });

    // Sort by average time (ascending = better performance)
    const sortedPerformances = providerPerformances.sort(
      (a, b) => a.averageTime - b.averageTime
    );

    // Get top 3 (best) and bottom 3 (worst)
    const topProviders = sortedPerformances.slice(0, 3);
    const bottomProviders = sortedPerformances.slice(-3).reverse();

    return { topProviders, bottomProviders };
  }, [filters, documentos]);

  if (topProviders.length === 0 && bottomProviders.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#64748b',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
          Nenhum dado disponível
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          Selecione filtros para ver o ranking
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        padding: '1rem 1rem 1rem 1rem',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Título Padronizado */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.25rem',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '24px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '2px',
              marginRight: '1rem',
            }}
          />
          <h3
            style={{
              margin: '0',
              color: '#1e293b',
              fontSize: '1.25rem',
              fontWeight: '700',
              letterSpacing: '-0.025em',
            }}
          >
            Ranking de Provedores
          </h3>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: '1rem',
        }}
      >
        {/* Top Performers */}
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: '1.5rem 0 0.75rem 0',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Mais Rápidos
          </h4>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {topProviders.map((provider, index) => (
              <div
                key={provider.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: index === 0 ? '#f0fdf4' : '#f8fafc',
                  borderRadius: '8px',
                  border: `1px solid ${index === 0 ? '#bbf7d0' : '#e2e8f0'}`,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background:
                      index === 0
                        ? '#22c55e'
                        : index === 1
                          ? '#3b82f6'
                          : '#8b5cf6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    marginRight: '0.5rem',
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#1e293b',
                    }}
                  >
                    {provider.name}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#22c55e',
                  }}
                >
                  {formatDecimalBR(provider.averageTime)} dias
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Performers */}
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1rem',
              fontWeight: '500',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Mais Lentos
          </h4>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {bottomProviders.map((provider, index) => (
              <div
                key={provider.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  background: index === 0 ? '#fef2f2' : '#f8fafc',
                  borderRadius: '8px',
                  border: `1px solid ${index === 0 ? '#fecaca' : '#e2e8f0'}`,
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background:
                      index === 0
                        ? '#ef4444'
                        : index === 1
                          ? '#f97316'
                          : '#eab308',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    marginRight: '0.5rem',
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#1e293b',
                    }}
                  >
                    {provider.name}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#ef4444',
                  }}
                >
                  {formatDecimalBR(provider.averageTime)} dias
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderRanking;
