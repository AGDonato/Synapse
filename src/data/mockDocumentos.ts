// src/data/mockDocumentos.ts

export interface RetificacaoDocumento {
  id: string;
  autoridade: string;
  orgaoJudicial: string;
  dataAssinatura: string;
  retificada: boolean;
}

export interface PesquisaDocumento {
  tipo: string;
  identificador: string;
  complementar?: string;
}

export interface DestinatarioDocumento {
  nome: string;
  dataEnvio: string | null;
  dataResposta: string | null;
  codigoRastreio: string;
  naopossuiRastreio: boolean;
  respondido: boolean;
}

export type DocumentoDemanda = {
  id: number;
  demandaId: number;
  // Seção 1 - Informações do Documento
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: string;
  enderecamento: string;
  numeroDocumento: string;
  numeroAtena: string;
  codigoRastreio: string;
  naopossuiRastreio: boolean;
  anoDocumento: string;
  analista: string;
  // Seção 2 - Dados da Decisão Judicial
  autoridade: string;
  orgaoJudicial: string;
  dataAssinatura: string;
  retificada: boolean;
  retificacoes: RetificacaoDocumento[];
  // Seção 3 - Dados da Mídia
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  // Seção 4 - Dados da Pesquisa
  pesquisas: PesquisaDocumento[];
  // Campos de controle/status
  dataEnvio: string | null;
  dataResposta: string | null;
  respondido: boolean;
  // Campos adicionais
  dataFinalizacao: string | null;
  apresentouDefeito: boolean;
  // Para Ofício Circular - dados individuais por destinatário
  destinatariosData?: DestinatarioDocumento[];
  // Campos para armazenar IDs dos documentos selecionados em ofícios de encaminhamento
  selectedMidias?: string[];
  selectedRelatoriosTecnicos?: string[];
  selectedRelatoriosInteligencia?: string[];
  selectedAutosCircunstanciados?: string[];
  selectedDecisoes?: string[];
};

// Função auxiliar para gerar hash SHA-1 aleatório
const generateSHA1 = (): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Função auxiliar para gerar data aleatória em formato DD/MM/YYYY
const generateRandomDate = (
  startYear: number = 2024,
  endYear: number = 2025
): string => {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const randomDate = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );

  const day = randomDate.getDate().toString().padStart(2, '0');
  const month = (randomDate.getMonth() + 1).toString().padStart(2, '0');
  const year = randomDate.getFullYear();

  return `${day}/${month}/${year}`;
};

// Função auxiliar para gerar número de documento
const generateDocumentNumber = (analista: string, sged: string): string => {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${randomNum}/0042/${analista}/${sged}`;
};

// Função auxiliar para gerar pesquisas aleatórias
const generateRandomPesquisas = (count: number = 8): PesquisaDocumento[] => {
  const tiposIdentificadores = [
    'cpf',
    'cnpj',
    'e-mail',
    'telefone',
    'ip',
    'username',
    'hash',
    'imei',
    'id',
    'url',
    'txid',
    'nome',
    'conta',
    'agência',
  ];
  const pesquisas: PesquisaDocumento[] = [];

  const shuffledTipos = [...tiposIdentificadores].sort(
    () => Math.random() - 0.5
  );

  for (let i = 0; i < Math.min(count, shuffledTipos.length); i++) {
    const tipo = shuffledTipos[i];
    let identificador = '';

    switch (tipo) {
      case 'cpf': {
        identificador = Math.random().toString().slice(2, 13);
        break;
      }
      case 'cnpj': {
        identificador = Math.random().toString().slice(2, 16);
        break;
      }
      case 'e-mail': {
        identificador = `usuario${Math.floor(Math.random() * 1000)}@exemplo.com`;
        break;
      }
      case 'telefone': {
        identificador = `(62) 9${Math.floor(Math.random() * 90000000 + 10000000)}`;
        break;
      }
      case 'ip': {
        identificador = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        break;
      }
      case 'username': {
        identificador = `user${Math.floor(Math.random() * 10000)}`;
        break;
      }
      case 'hash': {
        identificador = generateSHA1().substring(0, 16);
        break;
      }
      case 'imei': {
        identificador = Math.random().toString().slice(2, 17);
        break;
      }
      case 'id': {
        identificador = Math.floor(Math.random() * 100000).toString();
        break;
      }
      case 'url': {
        identificador = `https://exemplo${Math.floor(Math.random() * 100)}.com`;
        break;
      }
      case 'txid': {
        identificador = generateSHA1().substring(0, 12);
        break;
      }
      case 'nome': {
        const nomes = [
          'João Silva',
          'Maria Santos',
          'Pedro Oliveira',
          'Ana Costa',
        ];
        identificador = nomes[Math.floor(Math.random() * nomes.length)];
        break;
      }
      case 'conta': {
        identificador = Math.floor(Math.random() * 100000)
          .toString()
          .padStart(6, '0');
        break;
      }
      case 'agência': {
        identificador = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0');
        break;
      }
      default: {
        identificador = Math.random().toString(36).substring(2, 15);
      }
    }

    pesquisas.push({
      tipo,
      identificador,
      ...(Math.random() > 0.7 ? { complementar: `Complemento ${i + 1}` } : {}),
    });
  }

  return pesquisas;
};

// Dados das demandas para associação (SGEDs 38145-38174)
const demandaData = [
  { id: 1, sged: '38145', analista: '100' },
  { id: 2, sged: '38146', analista: '127' },
  { id: 3, sged: '38147', analista: '142' },
  { id: 4, sged: '38148', analista: '180' },
  { id: 5, sged: '38149', analista: '198' },
  { id: 6, sged: '38150', analista: '100' },
  { id: 7, sged: '38151', analista: '127' },
  { id: 8, sged: '38152', analista: '142' },
  { id: 9, sged: '38153', analista: '180' },
  { id: 10, sged: '38154', analista: '198' },
  { id: 11, sged: '38155', analista: '100' },
  { id: 12, sged: '38156', analista: '127' },
  { id: 13, sged: '38157', analista: '142' },
  { id: 14, sged: '38158', analista: '180' },
  { id: 15, sged: '38159', analista: '198' },
  { id: 16, sged: '38160', analista: '100' },
  { id: 17, sged: '38161', analista: '127' },
  { id: 18, sged: '38162', analista: '142' },
  { id: 19, sged: '38163', analista: '180' },
  { id: 20, sged: '38164', analista: '198' },
  { id: 21, sged: '38165', analista: '100' },
  { id: 22, sged: '38166', analista: '127' },
  { id: 23, sged: '38167', analista: '142' },
  { id: 24, sged: '38168', analista: '180' },
  { id: 25, sged: '38169', analista: '198' },
  { id: 26, sged: '38170', analista: '100' },
  { id: 27, sged: '38171', analista: '127' },
  { id: 28, sged: '38172', analista: '142' },
  { id: 29, sged: '38173', analista: '180' },
  { id: 30, sged: '38174', analista: '198' },
];

// Provedores para destinatários específicos
const provedores = [
  { nomeFantasia: '99', razaoSocial: 'GRUPO 99' },
  { nomeFantasia: 'GOOGLE', razaoSocial: 'GOOGLE BRASIL INTERNET LTDA.' },
  { nomeFantasia: 'META', razaoSocial: 'META PLATFORMS, INC.' },
  { nomeFantasia: 'WHATSAPP', razaoSocial: 'WHATSAPP LLC' },
  { nomeFantasia: 'APPLE', razaoSocial: 'APPLE COMPUTER BRASIL LTDA.' },
  { nomeFantasia: 'MICROSOFT', razaoSocial: 'MICROSOFT CORPORATION' },
  { nomeFantasia: 'AMAZON', razaoSocial: 'AMAZON AWS SERVIÇOS BRASIL LTDA.' },
  {
    nomeFantasia: 'NETFLIX',
    razaoSocial: 'NETFLIX ENTRETENIMENTO BRASIL LTDA.',
  },
  { nomeFantasia: 'UBER', razaoSocial: 'UBER BRASIL TECNOLOGIA LTDA.' },
  {
    nomeFantasia: 'IFOOD',
    razaoSocial: 'IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A.',
  },
  {
    nomeFantasia: 'MERCADO LIVRE',
    razaoSocial: 'MERCADOLIVRE.COM ATIVIDADES DE INTERNET LTDA.',
  },
  {
    nomeFantasia: 'OLX',
    razaoSocial: 'BOM NEGÓCIO ATIVIDADES DE INTERNET LTDA.',
  },
  { nomeFantasia: 'SHOPEE', razaoSocial: 'SHPS TECNOLOGIA E SERVIÇOS LTDA.' },
  { nomeFantasia: 'TIKTOK', razaoSocial: 'TIKTOK PTE. LIMITED' },
  { nomeFantasia: 'X', razaoSocial: 'X INTERNET BRASIL LTDA.' },
  { nomeFantasia: 'LINKEDIN', razaoSocial: 'LINKEDIN CORPORATION' },
  { nomeFantasia: 'VIVO', razaoSocial: 'VIVO S.A.' },
  { nomeFantasia: 'CLARO', razaoSocial: 'CLARO S.A.' },
  { nomeFantasia: 'TIM', razaoSocial: 'TIM BRASIL S.A.' },
  { nomeFantasia: 'OI', razaoSocial: 'OI – BRASIL TELECOM S.A.' },
];

// Autoridades para outros destinatários
const autoridades = [
  'Dr. João Silva - Juiz de Direito',
  'Dra. Maria Santos - Desembargadora',
  'Dr. Pedro Oliveira - Promotor de Justiça',
  'Dra. Ana Costa - Procuradora da República',
  'Dr. Carlos Ferreira - Delegado de Polícia Civil',
  'Dra. Lucia Mendes - Delegada da Polícia Federal',
  'Dr. Rafael Torres - Juiz Federal',
  'Dra. Beatriz Lima - Promotora de Justiça',
  'Dr. Fernando Rocha - Procurador de Justiça',
  'Dra. Gabriela Dias - Juíza de Direito',
  'Dr. Marcos Pereira - Delegado da PF',
  'Dra. Patricia Gomes - Desembargadora Federal',
  'Dr. Leonardo Castro - Promotor Federal',
  'Dra. Camila Souza - Procuradora Federal',
  'Dr. Diego Martins - Juiz Eleitoral',
];

// Órgãos judiciais
const orgaosJudiciais = [
  '4ª Vara Criminal dos Crimes Dolosos Contra a Vida e Tribunal do Júri da comarca de Goiânia',
  '5ª Vara Criminal da comarca de Anápolis',
  '4ª Vara Criminal da comarca de Goiânia',
  'Corte Especial do Tribunal de Justiça do Estado de Goiás',
  'Corte Especial do Tribunal de Justiça do Estado de Goiás',
  '2ª Vara Criminal da comarca de Valparaíso de Goiás',
  '3ª Vara Criminal da comarca de Formosa',
  '2ª Vara Criminal da comarca de Caldas Novas',
  '2ª Vara Criminal da comarca de Formosa',
  '2ª Vara Criminal da comarca de Jataí',
];

// Tipos de mídia e configurações
const tiposMidia = [
  'DVD',
  'Pen Drive',
  'HD Externo',
  'SSD',
  'CD-ROM',
  'Cartão SD',
  'BluRay',
];
const tamanhosMidia = [
  '4.7 GB',
  '32 GB',
  '1 TB',
  '500 GB',
  '700 MB',
  '128 GB',
  '2 TB',
  '256 GB',
  '64 GB',
];
const senhasMidia = [
  'senha123',
  'acesso456',
  'forense789',
  'dados2024',
  'evidencia1',
  'prova456',
  'secureDat@2024',
  'forensic#123',
];

// Assuntos para Ofício
const assuntosOficio = [
  'Comunicação de não cumprimento de decisão judicial',
  'Encaminhamento de autos circunstanciados',
  'Encaminhamento de decisão judicial',
  'Encaminhamento de mídia',
  'Encaminhamento de relatório de inteligência',
  'Encaminhamento de relatório técnico',
  'Encaminhamento de relatório técnico e mídia',
  'Requisição de dados cadastrais',
  'Requisição de dados cadastrais e preservação de dados',
  'Solicitação de dados cadastrais',
  'Outros',
];

// Assuntos para Relatório de Inteligência
const assuntosRelatorioInteligencia = [
  'Análise de evidências',
  'Análise de vulnerabilidade',
  'Compilação de evidências',
  'Compilação e análise de evidências',
  'Investigação Cibernética',
  'Levantamentos de dados cadastrais',
  'Preservação de dados',
  'Outros',
];

// Assuntos para Relatório Técnico
const assuntosRelatorioTecnico = [
  'Análise de evidências',
  'Análise de vulnerabilidade',
  'Compilação de evidências',
  'Compilação e análise de evidências',
  'Investigação Cibernética',
  'Levantamentos de dados cadastrais',
  'Preservação de dados',
  'Outros',
];

// Array para armazenar todos os documentos (será populado pelos loops abaixo)
const mockDocumentos: DocumentoDemanda[] = [];

// Gerar Autos Circunstanciados (IDs 1-40)
for (let i = 1; i <= 40; i++) {
  const demanda = demandaData[(i - 1) % demandaData.length];
  const assunto = i % 2 === 0 ? 'Ações Virtuais Controladas' : 'Outros';
  const assuntoOutros =
    assunto === 'Outros' ? `Investigação específica ${i}` : '';
  let autoridade = autoridades[(i - 1) % autoridades.length];
  let enderecamento = orgaosJudiciais[(i - 1) % orgaosJudiciais.length];

  // Validação de segurança
  if (!autoridade) autoridade = 'Dr. João Silva - Juiz de Direito';
  if (!enderecamento)
    enderecamento = '1º Tribunal do Júri da Comarca de Goiânia';

  mockDocumentos.push({
    id: i,
    demandaId: demanda.id,
    tipoDocumento: 'Autos Circunstanciados',
    assunto,
    assuntoOutros,
    destinatario: autoridade,
    enderecamento,
    numeroDocumento: generateDocumentNumber(demanda.analista, demanda.sged),
    numeroAtena: `AT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`,
    codigoRastreio:
      Math.random() > 0.3
        ? `BR${Math.floor(Math.random() * 1000000000)
            .toString()
            .padStart(9, '0')}BR`
        : '',
    naopossuiRastreio: Math.random() > 0.7,
    anoDocumento: i % 3 === 0 ? '2025' : '2024',
    analista: demanda.analista,
    autoridade: '',
    orgaoJudicial: '',
    dataAssinatura: '',
    retificada: false,
    retificacoes: [],
    tipoMidia: '',
    tamanhoMidia: '',
    hashMidia: '',
    senhaMidia: '',
    pesquisas: [],
    dataEnvio: null, // Autos Circunstanciados não têm envio
    dataResposta: null, // Autos Circunstanciados não têm resposta
    respondido: false, // Não aplicável para este tipo
    dataFinalizacao:
      Math.random() > 0.4 ? generateRandomDate(2024, 2025) : null,
    apresentouDefeito: false,
  });
}

// Gerar Mídia (IDs 41-60)
for (let i = 41; i <= 60; i++) {
  const demanda = demandaData[(i - 41) % demandaData.length];
  let autoridade = autoridades[(i - 41) % autoridades.length];
  let enderecamento = orgaosJudiciais[(i - 41) % orgaosJudiciais.length];

  // Validação de segurança
  if (!autoridade) autoridade = 'Dr. João Silva - Juiz de Direito';
  if (!enderecamento)
    enderecamento = '1º Tribunal do Júri da Comarca de Goiânia';
  const tipoMidia = tiposMidia[(i - 41) % tiposMidia.length];
  const tamanhoMidia = tamanhosMidia[(i - 41) % tamanhosMidia.length];
  const senhaMidia = senhasMidia[(i - 41) % senhasMidia.length];

  mockDocumentos.push({
    id: i,
    demandaId: demanda.id,
    tipoDocumento: 'Mídia',
    assunto: '',
    assuntoOutros: '',
    destinatario: autoridade,
    enderecamento,
    numeroDocumento: generateDocumentNumber(demanda.analista, demanda.sged),
    numeroAtena: `AT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`,
    codigoRastreio:
      Math.random() > 0.2
        ? `BR${Math.floor(Math.random() * 1000000000)
            .toString()
            .padStart(9, '0')}BR`
        : '',
    naopossuiRastreio: Math.random() > 0.8,
    anoDocumento: i % 3 === 0 ? '2025' : '2024',
    analista: demanda.analista,
    autoridade: '',
    orgaoJudicial: '',
    dataAssinatura: '',
    retificada: false,
    retificacoes: [],
    tipoMidia,
    tamanhoMidia,
    hashMidia: generateSHA1(),
    senhaMidia,
    pesquisas: [],
    dataEnvio: null, // Mídia não tem envio
    dataResposta: null, // Mídia não tem resposta
    respondido: false, // Não aplicável para este tipo
    dataFinalizacao: null, // Mídia não tem finalização
    apresentouDefeito: Math.random() > 0.8, // 20% de chance de ter defeito
  });
}

// Gerar Ofício (IDs 61-130)
for (let i = 61; i <= 130; i++) {
  const demanda = demandaData[(i - 61) % demandaData.length];
  const assuntoIndex = (i - 61) % assuntosOficio.length;
  const assunto = assuntosOficio[assuntoIndex];

  // Determinar destinatário baseado no assunto
  let destinatario: string;
  let enderecamento: string;

  const requiresProvedor = [
    'Encaminhamento de decisão judicial',
    'Requisição de dados cadastrais',
    'Requisição de dados cadastrais e preservação de dados',
    'Solicitação de dados cadastrais',
  ].includes(assunto);

  if (requiresProvedor) {
    const provedor = provedores[(i - 61) % provedores.length];
    destinatario = provedor.nomeFantasia;
    enderecamento = provedor.razaoSocial;
  } else {
    destinatario = autoridades[(i - 61) % autoridades.length];
    enderecamento = orgaosJudiciais[(i - 61) % orgaosJudiciais.length];
  }

  // Validação para garantir que nunca fique vazio
  if (!destinatario) {
    destinatario = 'Dr. João Silva - Juiz de Direito';
  }
  if (!enderecamento) {
    enderecamento =
      '4ª Vara Criminal dos Crimes Dolosos Contra a Vida e Tribunal do Júri da comarca de Goiânia';
  }

  // Determinar seções ativas
  let autoridade = '';
  let orgaoJudicial = '';
  let dataAssinatura = '';
  let retificada = false;
  let retificacoes: RetificacaoDocumento[] = [];
  let tipoMidia = '';
  let tamanhoMidia = '';
  let hashMidia = '';
  let senhaMidia = '';
  let pesquisas: PesquisaDocumento[] = [];

  // Seção 2 - Decisão Judicial
  if (
    assunto === 'Encaminhamento de decisão judicial' ||
    assunto === 'Outros'
  ) {
    autoridade = autoridades[(i - 61) % autoridades.length];
    orgaoJudicial = orgaosJudiciais[(i - 61) % orgaosJudiciais.length];
    dataAssinatura = generateRandomDate(2024, 2024);
    retificada = Math.random() > 0.7;

    if (retificada) {
      retificacoes = [
        {
          id: `ret-${i}-1`,
          autoridade: autoridades[(i - 60) % autoridades.length],
          orgaoJudicial: orgaosJudiciais[(i - 60) % orgaosJudiciais.length],
          dataAssinatura: generateRandomDate(2024, 2025),
          retificada: false,
        },
      ];
    }
  }

  // Seção 3 - Mídia
  if (assunto === 'Outros') {
    tipoMidia = tiposMidia[(i - 61) % tiposMidia.length];
    tamanhoMidia = tamanhosMidia[(i - 61) % tamanhosMidia.length];
    hashMidia = generateSHA1();
    senhaMidia = senhasMidia[(i - 61) % senhasMidia.length];
  }

  // Seção 4 - Pesquisa
  if (
    [
      'Encaminhamento de decisão judicial',
      'Requisição de dados cadastrais',
      'Requisição de dados cadastrais e preservação de dados',
      'Solicitação de dados cadastrais',
      'Outros',
    ].includes(assunto)
  ) {
    pesquisas = generateRandomPesquisas(Math.floor(Math.random() * 5) + 10); // 10-14 pesquisas
  }

  mockDocumentos.push({
    id: i,
    demandaId: demanda.id,
    tipoDocumento: 'Ofício',
    assunto,
    assuntoOutros: assunto === 'Outros' ? `Requisição especial ${i}` : '',
    destinatario,
    enderecamento,
    numeroDocumento: generateDocumentNumber(demanda.analista, demanda.sged),
    numeroAtena: `AT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`,
    codigoRastreio:
      Math.random() > 0.25
        ? `BR${Math.floor(Math.random() * 1000000000)
            .toString()
            .padStart(9, '0')}BR`
        : '',
    naopossuiRastreio: Math.random() > 0.75,
    anoDocumento: i % 4 === 0 ? '2025' : '2024',
    analista: demanda.analista,
    autoridade,
    orgaoJudicial,
    dataAssinatura,
    retificada,
    retificacoes,
    tipoMidia,
    tamanhoMidia,
    hashMidia,
    senhaMidia,
    pesquisas,
    // Lógica correta: dataResposta só existe se houver dataEnvio
    dataEnvio: (() => {
      const temEnvio = Math.random() > 0.2;
      return temEnvio ? generateRandomDate(2024, 2025) : null;
    })(),
    dataResposta: null, // Será calculado abaixo
    respondido: false,
    dataFinalizacao: null, // Ofícios não têm finalização
    apresentouDefeito: false,
  });

  // Ajustar dataResposta e respondido baseado em dataEnvio E assunto
  const ultimoOficio = mockDocumentos[mockDocumentos.length - 1];

  // Verificar se é ofício de encaminhamento (sem resposta esperada)
  const assuntosEncaminhamento = [
    'Encaminhamento de mídia',
    'Encaminhamento de relatório técnico',
    'Encaminhamento de relatório de inteligência',
    'Encaminhamento de relatório técnico e mídia',
    'Encaminhamento de autos circunstanciados',
    'Comunicação de não cumprimento de decisão judicial',
    'Outros',
  ];

  const isEncaminhamento = assuntosEncaminhamento.includes(
    ultimoOficio.assunto
  );

  // Só pode ter resposta se NÃO for encaminhamento E tiver sido enviado
  if (ultimoOficio.dataEnvio && !isEncaminhamento && Math.random() > 0.5) {
    ultimoOficio.dataResposta = generateRandomDate(2024, 2025);
    ultimoOficio.respondido = true;
  }
}

// Gerar Ofício Circular (IDs 131-160)
for (let i = 131; i <= 160; i++) {
  const demanda = demandaData[(i - 131) % demandaData.length];
  const assuntoOptions = [
    'Encaminhamento de decisão judicial',
    'Requisição de dados cadastrais',
    'Requisição de dados cadastrais e preservação de dados',
    'Solicitação de dados cadastrais',
    'Outros',
  ];
  const assunto = assuntoOptions[(i - 131) % assuntoOptions.length];

  // Determinar destinatário baseado no assunto
  let destinatario: string;
  let enderecamento: string;

  const requiresProvedor = [
    'Encaminhamento de decisão judicial',
    'Requisição de dados cadastrais',
    'Requisição de dados cadastrais e preservação de dados',
    'Solicitação de dados cadastrais',
  ].includes(assunto);

  if (requiresProvedor) {
    // Para Ofício Circular, usar múltiplos provedores selecionados
    const numDestinatarios = Math.floor(Math.random() * 3) + 2; // 2-4 destinatários
    const destinatariosList = [];

    for (let j = 0; j < numDestinatarios; j++) {
      const provedor = provedores[(i - 131 + j) % provedores.length];
      destinatariosList.push(provedor.nomeFantasia);
    }

    destinatario = destinatariosList.join(', ');
    enderecamento = 'Respectivos departamentos jurídicos'; // Fixo para Ofício Circular
  } else {
    // Para Ofício Circular, usar múltiplas autoridades selecionadas
    const numDestinatarios = Math.floor(Math.random() * 3) + 2; // 2-4 destinatários
    const destinatariosList = [];

    for (let j = 0; j < numDestinatarios; j++) {
      destinatariosList.push(autoridades[(i - 131 + j) % autoridades.length]);
    }

    destinatario = destinatariosList.join(', ');
    enderecamento = 'Respectivos departamentos jurídicos'; // Fixo para Ofício Circular
  }

  // Validação para garantir que nunca fique vazio
  if (!destinatario) {
    destinatario = 'Dr. João Silva - Juiz de Direito';
  }
  if (!enderecamento) {
    enderecamento =
      '4ª Vara Criminal dos Crimes Dolosos Contra a Vida e Tribunal do Júri da comarca de Goiânia';
  }

  // Determinar seções ativas
  let autoridade = '';
  let orgaoJudicial = '';
  let dataAssinatura = '';
  let retificada = false;
  const retificacoes: RetificacaoDocumento[] = [];
  let tipoMidia = '';
  let tamanhoMidia = '';
  let hashMidia = '';
  let senhaMidia = '';
  let pesquisas: PesquisaDocumento[] = [];

  // Seção 2 - Decisão Judicial
  if (
    assunto === 'Encaminhamento de decisão judicial' ||
    assunto === 'Outros'
  ) {
    autoridade = autoridades[(i - 131) % autoridades.length];
    orgaoJudicial = orgaosJudiciais[(i - 131) % orgaosJudiciais.length];
    dataAssinatura = generateRandomDate(2024, 2024);
    retificada = Math.random() > 0.8;
  }

  // Seção 3 - Mídia
  if (assunto === 'Outros') {
    tipoMidia = tiposMidia[(i - 131) % tiposMidia.length];
    tamanhoMidia = tamanhosMidia[(i - 131) % tamanhosMidia.length];
    hashMidia = generateSHA1();
    senhaMidia = senhasMidia[(i - 131) % senhasMidia.length];
  }

  // Seção 4 - Pesquisa
  if (assunto !== '') {
    pesquisas = generateRandomPesquisas(Math.floor(Math.random() * 4) + 8); // 8-11 pesquisas
  }

  mockDocumentos.push({
    id: i,
    demandaId: demanda.id,
    tipoDocumento: 'Ofício Circular',
    assunto,
    assuntoOutros: assunto === 'Outros' ? `Circular especial ${i}` : '',
    destinatario,
    enderecamento,
    numeroDocumento: generateDocumentNumber(demanda.analista, demanda.sged),
    numeroAtena: `AT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`,
    codigoRastreio:
      Math.random() > 0.2
        ? `BR${Math.floor(Math.random() * 1000000000)
            .toString()
            .padStart(9, '0')}BR`
        : '',
    naopossuiRastreio: Math.random() > 0.8,
    anoDocumento: i % 3 === 0 ? '2025' : '2024',
    analista: demanda.analista,
    autoridade,
    orgaoJudicial,
    dataAssinatura,
    retificada,
    retificacoes,
    tipoMidia,
    tamanhoMidia,
    hashMidia,
    senhaMidia,
    pesquisas,
    // Lógica correta: dataResposta só existe se houver dataEnvio
    dataEnvio: (() => {
      const temEnvio = Math.random() > 0.15;
      return temEnvio ? generateRandomDate(2024, 2025) : null;
    })(),
    dataResposta: null, // Será calculado abaixo
    respondido: false,
    dataFinalizacao: null, // Ofícios Circulares não têm finalização
    apresentouDefeito: false,
    // Para Ofício Circular, criar dados individuais por destinatário
    destinatariosData: destinatario.split(', ').map(nome => {
      // Lógica correta para cada destinatário
      const temEnvioIndividual = Math.random() > 0.15;
      const dataEnvioIndividual = temEnvioIndividual
        ? generateRandomDate(2024, 2025)
        : null;
      // Só pode ter resposta se foi enviado
      const dataRespostaIndividual =
        dataEnvioIndividual && Math.random() > 0.45
          ? generateRandomDate(2024, 2025)
          : null;

      return {
        nome: nome.trim(),
        dataEnvio: dataEnvioIndividual,
        dataResposta: dataRespostaIndividual,
        codigoRastreio:
          Math.random() > 0.2
            ? `BR${Math.floor(Math.random() * 1000000000)
                .toString()
                .padStart(9, '0')}BR`
            : '',
        naopossuiRastreio: Math.random() > 0.8,
        respondido: !!dataRespostaIndividual,
      };
    }),
  });

  // Ajustar dataResposta e respondido geral baseado em dataEnvio E assunto
  const ultimoCircular = mockDocumentos[mockDocumentos.length - 1];

  // Verificar se é ofício circular de encaminhamento
  const assuntosEncaminhamentoCircular = [
    'Encaminhamento de mídia',
    'Encaminhamento de relatório técnico',
    'Encaminhamento de relatório de inteligência',
    'Encaminhamento de relatório técnico e mídia',
    'Encaminhamento de autos circunstanciados',
    'Comunicação de não cumprimento de decisão judicial',
    'Outros',
  ];

  const isEncaminhamentoCircular = assuntosEncaminhamentoCircular.includes(
    ultimoCircular.assunto
  );

  // Só pode ter resposta se NÃO for encaminhamento E tiver sido enviado
  if (
    ultimoCircular.dataEnvio &&
    !isEncaminhamentoCircular &&
    Math.random() > 0.45
  ) {
    ultimoCircular.dataResposta = generateRandomDate(2024, 2025);
    ultimoCircular.respondido = true;
  }
}

// Gerar Relatório de Inteligência (IDs 161-180)
for (let i = 161; i <= 180; i++) {
  const demanda = demandaData[(i - 161) % demandaData.length];
  const assunto =
    assuntosRelatorioInteligencia[
      (i - 161) % assuntosRelatorioInteligencia.length
    ];
  let autoridade = autoridades[(i - 161) % autoridades.length];
  let enderecamento = orgaosJudiciais[(i - 161) % orgaosJudiciais.length];

  // Validação de segurança
  if (!autoridade) autoridade = 'Dr. João Silva - Juiz de Direito';
  if (!enderecamento)
    enderecamento = '1º Tribunal do Júri da Comarca de Goiânia';

  mockDocumentos.push({
    id: i,
    demandaId: demanda.id,
    tipoDocumento: 'Relatório de Inteligência',
    assunto,
    assuntoOutros: assunto === 'Outros' ? `Análise de inteligência ${i}` : '',
    destinatario: autoridade,
    enderecamento,
    numeroDocumento: generateDocumentNumber(demanda.analista, demanda.sged),
    numeroAtena: `AT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`,
    codigoRastreio:
      Math.random() > 0.15
        ? `BR${Math.floor(Math.random() * 1000000000)
            .toString()
            .padStart(9, '0')}BR`
        : '',
    naopossuiRastreio: Math.random() > 0.85,
    anoDocumento: i % 2 === 0 ? '2025' : '2024',
    analista: demanda.analista,
    autoridade: '',
    orgaoJudicial: '',
    dataAssinatura: '',
    retificada: false,
    retificacoes: [],
    tipoMidia: '',
    tamanhoMidia: '',
    hashMidia: '',
    senhaMidia: '',
    pesquisas: [],
    dataEnvio: null, // Relatórios de Inteligência não têm envio
    dataResposta: null, // Relatórios de Inteligência não têm resposta
    respondido: false, // Não aplicável para este tipo
    dataFinalizacao:
      Math.random() > 0.3 ? generateRandomDate(2024, 2025) : null,
    apresentouDefeito: false,
  });
}

// Gerar Relatório Técnico (IDs 181-200)
for (let i = 181; i <= 200; i++) {
  const demanda = demandaData[(i - 181) % demandaData.length];
  const assunto =
    assuntosRelatorioTecnico[(i - 181) % assuntosRelatorioTecnico.length];
  let autoridade = autoridades[(i - 181) % autoridades.length];
  let enderecamento = orgaosJudiciais[(i - 181) % orgaosJudiciais.length];

  // Validação de segurança
  if (!autoridade) autoridade = 'Dr. João Silva - Juiz de Direito';
  if (!enderecamento)
    enderecamento = '1º Tribunal do Júri da Comarca de Goiânia';

  mockDocumentos.push({
    id: i,
    demandaId: demanda.id,
    tipoDocumento: 'Relatório Técnico',
    assunto,
    assuntoOutros: assunto === 'Outros' ? `Análise técnica ${i}` : '',
    destinatario: autoridade,
    enderecamento,
    numeroDocumento: generateDocumentNumber(demanda.analista, demanda.sged),
    numeroAtena: `AT${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0')}`,
    codigoRastreio:
      Math.random() > 0.1
        ? `BR${Math.floor(Math.random() * 1000000000)
            .toString()
            .padStart(9, '0')}BR`
        : '',
    naopossuiRastreio: Math.random() > 0.9,
    anoDocumento: i % 2 === 0 ? '2024' : '2025',
    analista: demanda.analista,
    autoridade: '',
    orgaoJudicial: '',
    dataAssinatura: '',
    retificada: false,
    retificacoes: [],
    tipoMidia: '',
    tamanhoMidia: '',
    hashMidia: '',
    senhaMidia: '',
    pesquisas: [],
    dataEnvio: null, // Relatórios Técnicos não têm envio
    dataResposta: null, // Relatórios Técnicos não têm resposta
    respondido: false, // Não aplicável para este tipo
    dataFinalizacao:
      Math.random() > 0.3 ? generateRandomDate(2024, 2025) : null,
    apresentouDefeito: false,
  });
}

// Exportar o array já populado
export { mockDocumentos };
export { mockDocumentos as mockDocumentosDemanda };
