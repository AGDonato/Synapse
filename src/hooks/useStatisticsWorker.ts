import { useCallback, useEffect, useRef, useState } from 'react';
import type { StatisticsInput, StatisticsOutput } from '../workers/statisticsWorker';

interface UseStatisticsWorkerReturn {
  data: StatisticsOutput | null;
  isLoading: boolean;
  error: string | null;
  processStatistics: (input: StatisticsInput) => void;
  performance: {
    processingTime: number;
    memoryUsage: number;
    now?: number;
  };
}

export const useStatisticsWorker = (): UseStatisticsWorkerReturn => {
  const [data, setData] = useState<StatisticsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState({ processingTime: 0, memoryUsage: 0, now: 0 });
  
  const workerRef = useRef<Worker | null>(null);
  const processingStartTime = useRef<number>(0);

  // Inicializar o Web Worker
  useEffect(() => {
    // Criar o worker inline para evitar problemas de path
    const workerBlob = new Blob([`
      // Web Worker para processamento de estatísticas pesadas
      function processStatistics(input) {
        const startTime = performance.now();
        const startMemory = performance.memory?.usedJSHeapSize ?? 0;

        const { demandas, documentos, filtros } = input;

        // Filtrar dados baseado nos filtros
        let demandasFiltradas = [...demandas];
        let documentosFiltrados = [...documentos];

        // Filtrar por anos
        if (filtros.anos.length > 0) {
          demandasFiltradas = demandasFiltradas.filter(d => {
            if (!d.dataInicial) return false;
            const ano = d.dataInicial.split('/')[2];
            return filtros.anos.includes(ano);
          });
        }

        // Filtrar por analista
        if (filtros.analista.length > 0) {
          demandasFiltradas = demandasFiltradas.filter(d => 
            filtros.analista.includes(d.analista)
          );
        }

        // Filtrar documentos baseado nas demandas filtradas
        const idsDemandasFiltradas = demandasFiltradas.map(d => d.id);
        documentosFiltrados = documentosFiltrados.filter(doc => 
          idsDemandasFiltradas.includes(doc.demandaId)
        );

        // Cálculos básicos
        const totalDemandas = demandasFiltradas.length;
        const totalDocumentos = documentosFiltrados.length;

        // Demandas por status
        const demandasPorStatus = demandasFiltradas.reduce((acc, demanda) => {
          acc[demanda.status] = (acc[demanda.status] || 0) + 1;
          return acc;
        }, {});

        // Documentos por tipo
        const documentosPorTipo = documentosFiltrados.reduce((acc, doc) => {
          acc[doc.tipoDocumento] = (acc[doc.tipoDocumento] || 0) + 1;
          return acc;
        }, {});

        // Demandas por ano
        const demandasPorAno = demandasFiltradas.reduce((acc, demanda) => {
          if (demanda.dataInicial) {
            const ano = demanda.dataInicial.split('/')[2];
            acc[ano] = (acc[ano] || 0) + 1;
          }
          return acc;
        }, {});

        // Tempo médio de processamento
        const demandasComTempo = demandasFiltradas.filter(d => d.dataInicial && d.dataFinal);
        const tempoMedioProcessamento = demandasComTempo.length > 0 
          ? demandasComTempo.reduce((acc, demanda) => {
              if (!demanda.dataInicial || !demanda.dataFinal) return acc;
              const inicio = new Date(demanda.dataInicial.split('/').reverse().join('-'));
              const fim = new Date(demanda.dataFinal.split('/').reverse().join('-'));
              const diffDays = Math.abs(fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
              return acc + diffDays;
            }, 0) / demandasComTempo.length
          : 0;

        // Taxa de conclusão
        const demandasFinalizadas = demandasFiltradas.filter(d => d.status === 'Finalizada').length;
        const taxaConclusao = totalDemandas > 0 ? (demandasFinalizadas / totalDemandas) * 100 : 0;

        // Análise de complexidade
        const complexidade = demandasFiltradas.reduce((acc, demanda) => {
          const docsCount = documentosFiltrados.filter(doc => doc.demandaId === demanda.id).length;
          if (docsCount <= 2) acc.demandasSimples++;
          else if (docsCount <= 5) acc.demandasMedias++;
          else acc.demandasComplexas++;
          return acc;
        }, { demandasSimples: 0, demandasMedias: 0, demandasComplexas: 0 });

        // Análise de tendências
        const dadosMensais = demandasFiltradas.reduce((acc, demanda) => {
          if (demanda.dataInicial) {
            const [, mes, ano] = demanda.dataInicial.split('/');
            const chave = \`\${ano}-\${mes}\`;
            acc[chave] = (acc[chave] || 0) + 1;
          }
          return acc;
        }, {});

        const mesesOrdenados = Object.keys(dadosMensais).sort();
        const crescimentoMensal = mesesOrdenados.map((_, index) => {
          if (index === 0) return 0;
          const atual = dadosMensais[mesesOrdenados[index]] || 0;
          const anterior = dadosMensais[mesesOrdenados[index - 1]] || 0;
          return anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
        });

        // Sazonalidade
        const sazonalidade = demandasFiltradas.reduce((acc, demanda) => {
          if (demanda.dataInicial) {
            const mes = parseInt(demanda.dataInicial.split('/')[1]);
            let trimestre = '';
            if (mes <= 3) trimestre = 'Q1';
            else if (mes <= 6) trimestre = 'Q2';
            else if (mes <= 9) trimestre = 'Q3';
            else trimestre = 'Q4';
            
            acc[trimestre] = (acc[trimestre] || 0) + 1;
          }
          return acc;
        }, {});

        const endTime = performance.now();
        const endMemory = performance.memory?.usedJSHeapSize ?? 0;

        return {
          totalDemandas,
          totalDocumentos,
          demandasPorStatus,
          documentosPorTipo,
          demandasPorAno,
          tempoMedioProcessamento,
          taxaConclusao,
          analiseComplexidade: complexidade,
          tendencias: {
            crescimentoMensal,
            sazonalidade,
          },
          performance: {
            tempoProcessamento: endTime - startTime,
            memoriaUtilizada: endMemory - startMemory,
          },
        };
      }

      self.onmessage = (event) => {
        try {
          const result = processStatistics(event.data);
          self.postMessage({ success: true, data: result });
        } catch (error) {
          self.postMessage({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido' 
          });
        }
      };
    `], { type: 'application/javascript' });

    const blobURL = URL.createObjectURL(workerBlob);
    const worker = new Worker(blobURL);
    
    worker.onmessage = (event) => {
      const processingEndTime = Date.now();
      const totalProcessingTime = processingEndTime - processingStartTime.current;

      if (event.data.success) {
        setData(event.data.data);
        setError(null);
        setPerformance({
          processingTime: totalProcessingTime,
          memoryUsage: event.data.data.performance?.memoriaUtilizada || 0,
          now: Date.now(), // Adicionar timestamp
        });
      } else {
        setError(event.data.error);
        setData(null);
      }
      
      setIsLoading(false);
    };

    worker.onerror = (error) => {
      setError(`Erro no Web Worker: ${  error.message}`);
      setIsLoading(false);
    };

    workerRef.current = worker;

    // Cleanup
    return () => {
      worker.terminate();
      URL.revokeObjectURL(blobURL);
    };
  }, []);

  const processStatistics = useCallback((input: StatisticsInput) => {
    if (!workerRef.current) {
      setError('Web Worker não está disponível');
      return;
    }

    setIsLoading(true);
    setError(null);
    processingStartTime.current = Date.now();
    
    workerRef.current.postMessage(input);
  }, []);

  return {
    data,
    isLoading,
    error,
    processStatistics,
    performance,
  };
};