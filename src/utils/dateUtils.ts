// src/utils/dateUtils.ts

/**
 * Formata uma data para DD-MM-YYYY (sempre com hífens)
 * @param dateString Data em vários formatos (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY) ou null
 * @returns Data formatada como DD-MM-YYYY ou string vazia se null
 */
export function formatDateToDDMMYYYY(dateString: string | null): string {
  if (!dateString) {return '';}

  // Se já estiver no formato DD-MM-YYYY, retorna como está
  if (/^\d{2}-\d{2}-\d{4}$/.exec(dateString)) {
    return dateString;
  }

  // Se estiver no formato YYYY-MM-DD, converte para DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.exec(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  }

  // Se estiver no formato DD/MM/YYYY (com barras), converte para DD-MM-YYYY (com hífens)
  if (/^\d{2}\/\d{2}\/\d{4}$/.exec(dateString)) {
    const [day, month, year] = dateString.split('/');
    return `${day}-${month}-${year}`;
  }

  // Caso a string não corresponda aos formatos esperados, retorna como está
  return dateString;
}

/**
 * Formata uma data do formato YYYY-MM-DD para DD-MM-YYYY ou retorna placeholder
 * @param dateString Data no formato YYYY-MM-DD ou null
 * @param placeholder Texto a ser exibido quando a data é null (padrão: '--')
 * @returns Data formatada como DD-MM-YYYY ou placeholder
 */
export function formatDateToDDMMYYYYOrPlaceholder(
  dateString: string | null,
  placeholder = '--'
): string {
  if (!dateString) {return placeholder;}
  return formatDateToDDMMYYYY(dateString);
}

/**
 * Converte uma string de data em vários formatos para objeto Date
 * @param dateString Data nos formatos YYYY-MM-DD, DD-MM-YYYY ou DD/MM/YYYY
 * @returns Objeto Date ou null se a string for inválida
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) {return null;}

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.exec(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month é 0-indexado no Date
  }

  // Formato DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.exec(dateString)) {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month é 0-indexado no Date
  }

  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.exec(dateString)) {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day); // month é 0-indexado no Date
  }

  return null;
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param startDate Data inicial em qualquer formato suportado (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY)
 * @param endDate Data final em qualquer formato suportado ou null (usa data atual)
 * @returns Número de dias entre as datas (0 se for o mesmo dia)
 */
export function calculateDaysBetweenDates(
  startDate: string,
  endDate: string | null = null
): number {
  const start = parseDate(startDate);
  if (!start) {return 0;}

  const end = endDate ? parseDate(endDate) : new Date();
  if (!end) {return 0;}

  // Normaliza as datas para midnight (00:00:00) para comparação correta
  const startNormalized = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );
  const endNormalized = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  // Calcula a diferença em milissegundos e converte para dias
  const diffTime = endNormalized.getTime() - startNormalized.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Retorna 0 se for o mesmo dia ou negativo, senão retorna a diferença
  return Math.max(0, diffDays);
}

/**
 * Retorna uma string descritiva do tempo decorrido para uma demanda
 * @param dataInicial Data inicial da demanda no formato YYYY-MM-DD
 * @param dataFinal Data final da demanda no formato YYYY-MM-DD ou null
 * @param status Status atual da demanda
 * @returns String descritiva (ex: "15 dias aberta", "30 dias finalizada")
 */
export function getDemandaDurationText(
  dataInicial: string,
  dataFinal: string | null,
  status: string
): string {
  const dias = calculateDaysBetweenDates(dataInicial, dataFinal);

  if (status === 'Finalizada' && dataFinal) {
    return `${dias} ${dias === 1 ? 'dia' : 'dias'} finalizada`;
  } else {
    return `${dias} ${dias === 1 ? 'dia' : 'dias'} aberta`;
  }
}
