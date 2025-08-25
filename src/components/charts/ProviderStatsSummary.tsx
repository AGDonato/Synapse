import { useMemo } from 'react';
import { mockProvedores } from '../../data/mockProvedores';
import { useDocumentos } from '../../hooks/useDocumentos';
import { useProviderFilters } from '../../hooks/useProviderFilters';

interface ProviderStatsSummaryProps {
  filters: ReturnType<typeof useProviderFilters>;
}

const ProviderStatsSummary: React.FC<ProviderStatsSummaryProps> = ({
  filters,
}) => {
  const { documentos } = useDocumentos();

  const stats = useMemo(() => {
    // Get allowed subjects from filters hook
    const allowedSubjects = filters.getSubjects();

    // If no filters are active, return empty stats
    if (allowedSubjects.length === 0) {
      return {
        totalProviders: 0,
        totalDocuments: 0,
        averageTime: 0,
        respondedDocuments: 0,
        responseRate: 0,
      };
    }

    // Filter documents that should be included in analysis
    const documentsToProviders = documentos.filter(doc => {
      // Must be Ofício or Ofício Circular
      if (!['Ofício', 'Ofício Circular'].includes(doc.tipoDocumento))
        return false;

      // Must have the correct subject
      if (!allowedSubjects.includes(doc.assunto)) return false;

      // Must have been sent
      return doc.dataEnvio;
    });

    // Collect all provider data for statistics
    const providerStats = new Map<
      string,
      {
        totalDocuments: number;
        respondedDocuments: number;
        responseTimes: number[];
      }
    >();

    documentsToProviders.forEach(doc => {
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

            // Initialize provider stats if not exists
            if (!providerStats.has(providerName)) {
              providerStats.set(providerName, {
                totalDocuments: 0,
                respondedDocuments: 0,
                responseTimes: [],
              });
            }

            const stats = providerStats.get(providerName)!;
            stats.totalDocuments++;

            if (destinatarioData.respondido && destinatarioData.dataResposta) {
              stats.respondedDocuments++;

              // Calculate response time in days
              const sentDate = new Date(
                destinatarioData.dataEnvio.split('/').reverse().join('-')
              );
              const responseDate = new Date(
                destinatarioData.dataResposta.split('/').reverse().join('-')
              );
              const responseTime = Math.ceil(
                (responseDate.getTime() - sentDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              stats.responseTimes.push(responseTime);
            } else {
              // For non-responded documents, calculate time until today
              const sentDate = new Date(
                destinatarioData.dataEnvio.split('/').reverse().join('-')
              );
              const currentDate = new Date();
              const responseTime = Math.ceil(
                (currentDate.getTime() - sentDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              stats.responseTimes.push(responseTime);
            }
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

        // Initialize provider stats if not exists
        if (!providerStats.has(providerName)) {
          providerStats.set(providerName, {
            totalDocuments: 0,
            respondedDocuments: 0,
            responseTimes: [],
          });
        }

        const stats = providerStats.get(providerName)!;
        stats.totalDocuments++;

        if (doc.respondido && doc.dataResposta) {
          stats.respondedDocuments++;

          // Calculate response time in days
          const sentDate = new Date(
            doc.dataEnvio!.split('/').reverse().join('-')
          );
          const responseDate = new Date(
            doc.dataResposta.split('/').reverse().join('-')
          );
          const responseTime = Math.ceil(
            (responseDate.getTime() - sentDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          stats.responseTimes.push(responseTime);
        } else {
          // For non-responded documents, calculate time until today
          const sentDate = new Date(
            doc.dataEnvio!.split('/').reverse().join('-')
          );
          const currentDate = new Date();
          const responseTime = Math.ceil(
            (currentDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          stats.responseTimes.push(responseTime);
        }
      }
    });

    // Calculate aggregate statistics
    const totalProviders = providerStats.size;

    let totalDocuments = 0;
    let totalResponded = 0;
    let allResponseTimes: number[] = [];

    providerStats.forEach(stats => {
      totalDocuments += stats.totalDocuments;
      totalResponded += stats.respondedDocuments;
      allResponseTimes = allResponseTimes.concat(stats.responseTimes);
    });

    const averageTime =
      allResponseTimes.length > 0
        ? allResponseTimes.reduce((sum, time) => sum + time, 0) /
          allResponseTimes.length
        : 0;

    const responseRate =
      totalDocuments > 0 ? (totalResponded / totalDocuments) * 100 : 0;

    return {
      totalProviders,
      totalDocuments,
      averageTime,
      respondedDocuments: totalResponded,
      responseRate,
    };
  }, [filters.filters, filters.providerLimit, documentos]);

  if (stats.totalProviders === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: '1.5rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}
      >
        Selecione pelo menos um filtro para visualizar as estatísticas
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        gap: '1rem',
      }}
    >
      {/* Provedores Analisados */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '0.25rem',
          }}
        >
          {stats.totalProviders}
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          Provedores Analisados
        </div>
      </div>

      {/* Total de Documentos */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#3b82f6',
            marginBottom: '0.25rem',
          }}
        >
          {stats.totalDocuments}
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          Total de Documentos
        </div>
      </div>

      {/* Documentos Respondidos */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#22c55e',
            marginBottom: '0.25rem',
          }}
        >
          {stats.respondedDocuments}
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          Documentos Respondidos
        </div>
      </div>

      {/* Tempo Médio Geral */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#10b981',
            marginBottom: '0.25rem',
          }}
        >
          {stats.averageTime.toFixed(1)} dias
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          Tempo Médio Geral
        </div>
      </div>

      {/* Taxa Geral de Resposta */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color:
              stats.responseRate >= 70
                ? '#22c55e'
                : stats.responseRate >= 50
                  ? '#eab308'
                  : '#ef4444',
            marginBottom: '0.25rem',
          }}
        >
          {stats.responseRate.toFixed(1)}%
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            fontWeight: '500',
          }}
        >
          Taxa Geral de Resposta
        </div>
      </div>
    </div>
  );
};

export default ProviderStatsSummary;
