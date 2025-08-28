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

const getWorkerFilterFunctions = () => {
  return `
    function filtrarPorAnos(demandas, anos) {
      if (anos.length === 0) return demandas;
      return demandas.filter(d => {
        if (!d.dataInicial) return false;
        const ano = d.dataInicial.split('/')[2];
        return anos.includes(ano);
      });
    }

    function filtrarPorAnalista(demandas, analistas) {
      if (analistas.length === 0) return demandas;
      return demandas.filter(d => analistas.includes(d.analista));
    }

    function filtrarDocumentosPorDemandas(documentos, demandasIds) {
      return documentos.filter(doc => demandasIds.includes(doc.demandaId));
    }
  `;
};

const getWorkerCalculationFunctions = () => {
  return `
    function calcularEstatisticasBasicas(demandasFiltradas, documentosFiltrados) {
      const totalDemandas = demandasFiltradas.length;
      const totalDocumentos = documentosFiltrados.length;
      
      const demandasPorStatus = demandasFiltradas.reduce((acc, demanda) => {
        acc[demanda.status] = (acc[demanda.status] || 0) + 1;
        return acc;
      }, {});

      const documentosPorTipo = documentosFiltrados.reduce((acc, doc) => {
        acc[doc.tipoDocumento] = (acc[doc.tipoDocumento] || 0) + 1;
        return acc;
      }, {});

      const demandasPorAno = demandasFiltradas.reduce((acc, demanda) => {
        if (demanda.dataInicial) {
          const ano = demanda.dataInicial.split('/')[2];
          acc[ano] = (acc[ano] || 0) + 1;
        }
        return acc;
      }, {});

      return { totalDemandas, totalDocumentos, demandasPorStatus, documentosPorTipo, demandasPorAno };
    }

    function calcularTempoMedioProcessamento(demandasFiltradas) {
      const demandasComTempo = demandasFiltradas.filter(d => d.dataInicial && d.dataFinal);
      return demandasComTempo.length > 0 
        ? demandasComTempo.reduce((acc, demanda) => {
            if (!demanda.dataInicial || !demanda.dataFinal) return acc;
            const inicio = new Date(demanda.dataInicial.split('/').reverse().join('-'));
            const fim = new Date(demanda.dataFinal.split('/').reverse().join('-'));
            const diffDays = Math.abs(fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
            return acc + diffDays;
          }, 0) / demandasComTempo.length
        : 0;
    }

    function calcularTaxaConclusao(demandasFiltradas) {
      const demandasFinalizadas = demandasFiltradas.filter(d => d.status === 'Finalizada').length;
      return demandasFiltradas.length > 0 ? (demandasFinalizadas / demandasFiltradas.length) * 100 : 0;
    }
  `;
};

const getWorkerAnalysisFunctions = () => {
  return `
    function analisarComplexidade(demandasFiltradas, documentosFiltrados) {
      return demandasFiltradas.reduce((acc, demanda) => {
        const docsCount = documentosFiltrados.filter(doc => doc.demandaId === demanda.id).length;
        if (docsCount <= 2) acc.demandasSimples++;
        else if (docsCount <= 5) acc.demandasMedias++;
        else acc.demandasComplexas++;
        return acc;
      }, { demandasSimples: 0, demandasMedias: 0, demandasComplexas: 0 });
    }

    function analisarTendencias(demandasFiltradas) {
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

      return { crescimentoMensal, sazonalidade };
    }
  `;
};

const createWorkerBlob = () => {
  const workerCode = `
    ${getWorkerFilterFunctions()}
    ${getWorkerCalculationFunctions()}  
    ${getWorkerAnalysisFunctions()}

    function processStatistics(input) {
      const startTime = performance.now();
      const startMemory = performance.memory?.usedJSHeapSize ?? 0;

      const { demandas, documentos, filtros } = input;

      let demandasFiltradas = [...demandas];
      let documentosFiltrados = [...documentos];

      demandasFiltradas = filtrarPorAnos(demandasFiltradas, filtros.anos);
      demandasFiltradas = filtrarPorAnalista(demandasFiltradas, filtros.analista);

      const idsDemandasFiltradas = demandasFiltradas.map(d => d.id);
      documentosFiltrados = filtrarDocumentosPorDemandas(documentosFiltrados, idsDemandasFiltradas);

      const estatisticasBasicas = calcularEstatisticasBasicas(demandasFiltradas, documentosFiltrados);
      const tempoMedioProcessamento = calcularTempoMedioProcessamento(demandasFiltradas);
      const taxaConclusao = calcularTaxaConclusao(demandasFiltradas);
      const complexidade = analisarComplexidade(demandasFiltradas, documentosFiltrados);
      const tendencias = analisarTendencias(demandasFiltradas);

      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize ?? 0;

      return {
        ...estatisticasBasicas,
        tempoMedioProcessamento,
        taxaConclusao,
        analiseComplexidade: complexidade,
        tendencias,
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
  `;

  return new Blob([workerCode], { type: 'application/javascript' });
};

export const useStatisticsWorker = (): UseStatisticsWorkerReturn => {
  const [data, setData] = useState<StatisticsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState({ processingTime: 0, memoryUsage: 0, now: 0 });
  
  const workerRef = useRef<Worker | null>(null);
  const processingStartTime = useRef<number>(0);

  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const processingEndTime = Date.now();
    const totalProcessingTime = processingEndTime - processingStartTime.current;

    if (event.data.success) {
      setData(event.data.data);
      setError(null);
      setPerformance({
        processingTime: totalProcessingTime,
        memoryUsage: event.data.data.performance?.memoriaUtilizada ?? 0,
        now: Date.now(),
      });
    } else {
      setError(event.data.error);
      setData(null);
    }
    
    setIsLoading(false);
  }, []);

  const handleWorkerError = useCallback((error: ErrorEvent) => {
    setError(`Erro no Web Worker: ${error.message}`);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const workerBlob = createWorkerBlob();
    const blobURL = URL.createObjectURL(workerBlob);
    const worker = new Worker(blobURL);
    
    worker.onmessage = handleWorkerMessage;
    worker.onerror = handleWorkerError;
    workerRef.current = worker;

    return () => {
      worker.terminate();
      URL.revokeObjectURL(blobURL);
    };
  }, [handleWorkerMessage, handleWorkerError]);

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