// src/pages/NovoDocumentoPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockTiposDocumentos } from '../data/mockTiposDocumentos';
import { mockProvedores } from '../data/mockProvedores';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockAnalistas } from '../data/mockAnalistas';
import { mockAutoridades } from '../data/mockAutoridades';
import { mockRegrasAutoridades } from '../data/mockRegrasAutoridades';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockTiposMidias } from '../data/mockTiposMidias';
import { mockTiposIdentificadores } from '../data/mockTiposIdentificadores';
import styles from './NovoDocumentoPage.module.css';

// Importando utilitários de busca
import { filterWithAdvancedSearch } from '../utils/searchUtils';

// Tipos
interface FormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: string;
  enderecamento: string;
  numeroDocumento: string;
  anoDocumento: string;
  analista: string;
  // Seção 2 - Dados da Decisão Judicial
  autoridade: string;
  orgaoJudicial: string;
  dataAssinatura: string;
  retificada: boolean;
  // Seção 3 - Dados da Mídia
  tipoMidia: string;
  tamanhoMidia: string;
  hashMidia: string;
  senhaMidia: string;
  // Seção 4 - Dados da Pesquisa
  pesquisas: PesquisaItem[];
}

interface PesquisaItem {
  tipo: string;
  identificador: string;
  complementar?: string;
}

interface RetificacaoItem {
  id: string;
  autoridade: string;
  orgaoJudicial: string;
  dataAssinatura: string;
  retificada: boolean;
}

// Configurações
const documentoAssuntoConfig: Record<string, string[]> = {
  'Autos Circunstanciados': ['Ações Virtuais Controladas', 'Outros'],
  Mídia: [],
  Ofício: [
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
  ],
  'Ofício Circular': [
    'Encaminhamento de decisão judicial',
    'Requisição de dados cadastrais',
    'Requisição de dados cadastrais e preservação de dados',
    'Solicitação de dados cadastrais',
    'Outros',
  ],
  'Relatório de Inteligência': [
    'Análise de evidências',
    'Análise de vulnerabilidade',
    'Compilação de evidências',
    'Compilação e análise de evidências',
    'Investigação Cibernética',
    'Levantamentos de dados cadastrais',
    'Preservação de dados',
    'Outros',
  ],
  'Relatório Técnico': [
    'Análise de evidências',
    'Análise de vulnerabilidade',
    'Compilação de evidências',
    'Compilação e análise de evidências',
    'Investigação Cibernética',
    'Levantamentos de dados cadastrais',
    'Preservação de dados',
    'Outros',
  ],
};

type SectionVisibility = {
  section2: boolean;
  section3: boolean;
  section4: boolean;
};

const secaoConfiguracoes: Record<string, SectionVisibility> = {
  'Autos Circunstanciados|Ações Virtuais Controladas': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Autos Circunstanciados|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Comunicação de não cumprimento de decisão judicial': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de autos circunstanciados': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de decisão judicial': {
    section2: true,
    section3: false,
    section4: true,
  },
  'Ofício|Encaminhamento de mídia': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de relatório de inteligência': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de relatório técnico': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Encaminhamento de relatório técnico e mídia': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Ofício|Requisição de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício|Requisição de dados cadastrais e preservação de dados': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício|Solicitação de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício|Outros': { section2: true, section3: true, section4: true },
  'Ofício Circular|Encaminhamento de decisão judicial': {
    section2: true,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Requisição de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Requisição de dados cadastrais e preservação de dados': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Solicitação de dados cadastrais': {
    section2: false,
    section3: false,
    section4: true,
  },
  'Ofício Circular|Outros': { section2: true, section3: true, section4: true },
  'Relatório de Inteligência|Análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Análise de vulnerabilidade': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Compilação de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Compilação e análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Investigação Cibernética': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Levantamentos de dados cadastrais': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Preservação de dados': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório de Inteligência|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Análise de vulnerabilidade': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Compilação de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Compilação e análise de evidências': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Investigação Cibernética': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Levantamentos de dados cadastrais': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Preservação de dados': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Relatório Técnico|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },
  'Mídia|SEM_ASSUNTO': { section2: false, section3: true, section4: false },
};

// Dados para busca combinando provedores e autoridades
const destinatarios = [
  ...mockProvedores.map((provedor) => provedor.nomeFantasia),
  ...mockAutoridades.map((autoridade) => autoridade.nome),
].sort();

// Listas separadas para endereçamento dinâmico
const enderecamentosProvedores = mockProvedores
  .map((provedor) => provedor.razaoSocial)
  .sort();
const enderecamentosOrgaos = mockOrgaos
  .map((orgao) => orgao.nomeCompleto)
  .sort();

// Função para obter lista de endereçamentos baseada no destinatário
const getEnderecamentos = (destinatario: string): string[] => {
  // Se não há destinatário selecionado, retorna lista vazia
  if (!destinatario || destinatario.trim() === '') {
    return [];
  }

  // Verifica se o destinatário é um provedor
  const isProvedor = mockProvedores.some(
    (provedor) => provedor.nomeFantasia === destinatario
  );

  if (isProvedor) {
    return enderecamentosProvedores;
  } else {
    // Se não é provedor, assume que é autoridade e retorna órgãos
    return enderecamentosOrgaos;
  }
};

// Autoridades judiciais baseadas nas regras
const idsAutoridadesJudiciais = mockRegrasAutoridades
  .filter((regra) => regra.isAutoridadeJudicial)
  .map((regra) => regra.autoridadeId);

const autoridades = mockAutoridades
  .filter((autoridade) => idsAutoridadesJudiciais.includes(autoridade.id))
  .map((autoridade) => `${autoridade.nome} - ${autoridade.cargo}`)
  .sort();

// Órgãos judiciais baseados nas regras
const idsOrgaosJudiciais = mockRegrasOrgaos
  .filter((regra) => regra.isOrgaoJudicial)
  .map((regra) => regra.orgaoId);

const orgaosJudiciais = mockOrgaos
  .filter((orgao) => idsOrgaosJudiciais.includes(orgao.id))
  .map((orgao) => orgao.nomeCompleto)
  .sort();

// Analistas vindos do mock
const analistas = mockAnalistas.map((analista) => analista.nome).sort();

// Tipos de pesquisa vindos do mock
const tiposPesquisa = mockTiposIdentificadores
  .map((tipo) => ({ value: tipo.nome.toLowerCase(), label: tipo.nome }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function NovoDocumentoPage() {
  const navigate = useNavigate();
  const { demandaId } = useParams();
  const [searchParams] = useSearchParams();
  const demandaIdFromQuery = searchParams.get('demandaId');
  const tipoDocumentoRef = useRef<HTMLSelectElement>(null);
  const [documentSaved, setDocumentSaved] = useState(false);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    {
      section2: false,
      section3: false,
      section4: false,
    }
  );
  const [retificacoes, setRetificacoes] = useState<RetificacaoItem[]>([]);
  const [showNotification, setShowNotification] = useState<{
    message: string;
    type: string;
  } | null>(null);

  // Estado para controlar dropdowns customizados
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({
    analista: false,
    tipoMidia: false,
  });

  const [formData, setFormData] = useState<FormData>({
    tipoDocumento: '',
    assunto: '',
    assuntoOutros: '',
    destinatario: '',
    enderecamento: '',
    numeroDocumento: '',
    anoDocumento: new Date().getFullYear().toString(),
    analista: '',
    autoridade: '',
    orgaoJudicial: '',
    dataAssinatura: '',
    retificada: false,
    tipoMidia: '',
    tamanhoMidia: '',
    hashMidia: '',
    senhaMidia: '',
    pesquisas: [{ tipo: '', identificador: '' }],
  });

  // Estado para campos de busca
  const [searchResults, setSearchResults] = useState<{
    destinatario: string[];
    enderecamento: string[];
    autoridade: string[];
    orgaoJudicial: string[];
    [key: string]: string[]; // Para campos dinâmicos das retificações
  }>({
    destinatario: [],
    enderecamento: [],
    autoridade: [],
    orgaoJudicial: [],
  });

  const [showResults, setShowResults] = useState<{
    destinatario: boolean;
    enderecamento: boolean;
    autoridade: boolean;
    orgaoJudicial: boolean;
    [key: string]: boolean; // Para campos dinâmicos das retificações
  }>({
    destinatario: false,
    enderecamento: false,
    autoridade: false,
    orgaoJudicial: false,
  });

  // Estado para navegação por teclado
  const [selectedIndex, setSelectedIndex] = useState<{
    [key: string]: number;
  }>({});

  // Atualizar visibilidade das seções
  useEffect(() => {
    const { tipoDocumento, assunto } = formData;
    let configKey: string;

    if (tipoDocumento === 'Mídia') {
      configKey = 'Mídia|SEM_ASSUNTO';
    } else if (tipoDocumento && assunto) {
      configKey = `${tipoDocumento}|${assunto}`;
    } else {
      const newVisibility = {
        section2: false,
        section3: false,
        section4: false,
      };
      setSectionVisibility(newVisibility);
      // Limpar campos de todas as seções quando não há configuração válida
      clearAllHiddenFields(newVisibility);
      return;
    }

    const newConfig = secaoConfiguracoes[configKey] || {
      section2: false,
      section3: false,
      section4: false,
    };
    setSectionVisibility(newConfig);

    // Limpar campos das seções que estão ocultas na nova configuração
    clearAllHiddenFields(newConfig);
  }, [formData.tipoDocumento, formData.assunto, formData]);

  // Foco automático no primeiro campo ao carregar
  useEffect(() => {
    if (tipoDocumentoRef.current) {
      tipoDocumentoRef.current.focus();
    }
  }, []);

  // UseEffect para fechar resultados de busca e dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Verifica se o clique foi fora de qualquer container de busca
      if (!target.closest(`.${styles.searchContainer}`)) {
        setShowResults((prev) => ({
          ...prev,
          destinatario: false,
          enderecamento: false,
          autoridade: false,
          orgaoJudicial: false,
        }));
      }

      // Fechar dropdowns customizados
      if (!target.closest(`[class*='multiSelectContainer']`)) {
        setDropdownOpen((prev) => {
          const newState: Record<string, boolean> = {};
          Object.keys(prev).forEach((key) => {
            newState[key] = false;
          });
          return newState;
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Função para limpar campos de todas as seções ocultas
  const clearAllHiddenFields = (visibility: SectionVisibility) => {
    setFormData((prev) => {
      const newData = { ...prev };

      // Se seção 2 está oculta, limpar seus campos
      if (!visibility.section2) {
        newData.autoridade = '';
        newData.orgaoJudicial = '';
        newData.dataAssinatura = '';
        newData.retificada = false;
      }

      // Se seção 3 está oculta, limpar seus campos
      if (!visibility.section3) {
        newData.tipoMidia = '';
        newData.tamanhoMidia = '';
        newData.hashMidia = '';
        newData.senhaMidia = '';
      }

      // Se seção 4 está oculta, limpar seus campos
      if (!visibility.section4) {
        newData.pesquisas = [{ tipo: '', identificador: '' }];
      }

      return newData;
    });

    // Limpar retificações se seção 2 está oculta
    if (!visibility.section2) {
      setRetificacoes([]);
    }
  };

  // Handlers
  const handleInputChange = (
    field: keyof FormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (documentSaved) {
      setDocumentSaved(false);
    }
  };

  const handleTipoDocumentoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tipoDocumento: value,
      assunto: '',
      assuntoOutros: '',
    }));
    if (documentSaved) setDocumentSaved(false);
  };

  const handleAssuntoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      assunto: value,
      assuntoOutros: value === 'Outros' ? prev.assuntoOutros : '',
    }));
    if (documentSaved) setDocumentSaved(false);
  };

  // Busca filtrada com busca avançada
  const handleSearch = (
    field: 'destinatario' | 'enderecamento' | 'autoridade' | 'orgaoJudicial',
    query: string
  ) => {
    let dataToSearch: string[] = [];

    if (field === 'destinatario') {
      dataToSearch = destinatarios;
    } else if (field === 'enderecamento') {
      // Para endereçamento, usa lista dinâmica baseada no destinatário atual
      dataToSearch = getEnderecamentos(formData.destinatario);
    } else if (field === 'autoridade') {
      dataToSearch = autoridades;
    } else if (field === 'orgaoJudicial') {
      dataToSearch = orgaosJudiciais;
    }

    const filtered = filterWithAdvancedSearch(dataToSearch, query);

    setSearchResults((prev) => ({ ...prev, [field]: filtered }));
    setShowResults((prev) => ({
      ...prev,
      [field]: query.length > 0 && filtered.length > 0,
    }));
    setSelectedIndex((prev) => ({ ...prev, [field]: -1 })); // Reset seleção
  };

  // Função generalizada para busca em campos dinâmicos (incluindo retificações) com busca avançada
  const handleSearchInput = (
    fieldId: string,
    query: string,
    dataList: string[]
  ) => {
    const filtered = filterWithAdvancedSearch(dataList, query);

    setSearchResults((prev) => ({ ...prev, [fieldId]: filtered }));
    setShowResults((prev) => ({
      ...prev,
      [fieldId]: query.length > 0 && filtered.length > 0,
    }));
    setSelectedIndex((prev) => ({ ...prev, [fieldId]: -1 })); // Reset seleção
  };

  // Função para scroll automático do item selecionado
  const scrollToSelectedItem = (fieldId: string, index: number) => {
    setTimeout(() => {
      // Busca o container de resultados pela estrutura do DOM
      const searchContainers = document.querySelectorAll(
        `[data-field="${fieldId}"]`
      );
      let resultsContainer: Element | null = null;

      // Encontra o container que tem resultados visíveis
      searchContainers.forEach((container) => {
        const results = container.querySelector(
          '.searchResults, [class*="searchResults"]'
        );
        if (results && results.children.length > 0) {
          resultsContainer = results;
        }
      });

      if (!resultsContainer) {
        // Fallback: busca por qualquer elemento com a classe de resultados visível
        const allResults = document.querySelectorAll(
          '[class*="searchResults"]'
        );
        for (let i = 0; i < allResults.length; i++) {
          const element = allResults[i] as HTMLElement;
          if (
            element.style.display !== 'none' &&
            element.children.length > index
          ) {
            resultsContainer = element;
            break;
          }
        }
      }

      const selectedItem = resultsContainer?.children[index] as HTMLElement;

      if (selectedItem && resultsContainer) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 0);
  };

  // Função para navegação por teclado
  const handleKeyDown = (
    e: React.KeyboardEvent,
    fieldId: string,
    callback: (value: string) => void
  ) => {
    const results = searchResults[fieldId] || [];
    if (results.length === 0) return;

    const currentIndex = selectedIndex[fieldId] ?? -1;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex =
          currentIndex < results.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedIndex((prev) => ({ ...prev, [fieldId]: nextIndex }));
        scrollToSelectedItem(fieldId, nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        setSelectedIndex((prev) => ({ ...prev, [fieldId]: prevIndex }));
        scrollToSelectedItem(fieldId, prevIndex);
        break;
      }

      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < results.length) {
          const selectedValue = results[currentIndex];
          callback(selectedValue);
          setShowResults((prev) => ({ ...prev, [fieldId]: false }));
          setSelectedIndex((prev) => ({ ...prev, [fieldId]: -1 }));
        }
        break;

      case 'Escape':
        setShowResults((prev) => ({ ...prev, [fieldId]: false }));
        setSelectedIndex((prev) => ({ ...prev, [fieldId]: -1 }));
        break;
    }
  };

  const selectSearchResult = (
    field: 'destinatario' | 'enderecamento' | 'autoridade' | 'orgaoJudicial',
    value: string
  ) => {
    handleInputChange(field, value);
    setShowResults((prev) => ({ ...prev, [field]: false }));

    // Se selecionou um destinatário, verifica se é um provedor para autocompletar o endereçamento
    if (field === 'destinatario') {
      // Busca o provedor correspondente pelo nomeFantasia
      const provedorEncontrado = mockProvedores.find(
        (provedor) => provedor.nomeFantasia === value
      );

      if (provedorEncontrado) {
        // Se encontrou o provedor, preenche o endereçamento com a razaoSocial
        handleInputChange('enderecamento', provedorEncontrado.razaoSocial);
      } else {
        // Se não é um provedor (é uma autoridade), não preenche o endereçamento
        handleInputChange('enderecamento', '');
      }
    }
  };

  // Função para formatar o tamanho da mídia no padrão brasileiro
  const formatTamanhoMidia = (value: string): string => {
    return value; // Retorna direto já que mantemos formato brasileiro
  };

  // Função para formatar data com máscara DD/MM/YYYY
  const formatDateMask = (value: string): string => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara progressivamente
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Função para converter data DD/MM/YYYY para YYYY-MM-DD (formato HTML date)
  const convertToHTMLDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length < 10) return '';

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

  // Função para converter data YYYY-MM-DD para DD/MM/YYYY
  const convertFromHTMLDate = (dateStr: string): string => {
    if (!dateStr) return '';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return '';
  };

  // Função para tratar mudança no campo de data com máscara
  const handleDateChange = (field: 'dataAssinatura', value: string) => {
    const formatted = formatDateMask(value);
    handleInputChange(field, formatted);
  };

  // Função para tratar mudança no campo de data via calendário
  const handleCalendarChange = (field: 'dataAssinatura', value: string) => {
    const formatted = convertFromHTMLDate(value);
    handleInputChange(field, formatted);
  };

  // Função para tratar mudança no campo de data das retificações
  const handleRetificacaoDateChange = (id: string, value: string) => {
    const formatted = formatDateMask(value);
    updateRetificacao(id, 'dataAssinatura', formatted);
  };

  // Função para tratar mudança no campo de data das retificações via calendário
  const handleRetificacaoCalendarChange = (id: string, value: string) => {
    const formatted = convertFromHTMLDate(value);
    updateRetificacao(id, 'dataAssinatura', formatted);
  };

  // Função para tratar a mudança no campo tamanho da mídia
  const handleTamanhoMidiaChange = (inputValue: string) => {
    // Remove espaços em branco
    let cleanValue = inputValue.trim();

    // Se estiver vazio, define como string vazia
    if (!cleanValue) {
      handleInputChange('tamanhoMidia', '');
      return;
    }

    // Remove caracteres não numéricos, exceto vírgula e ponto
    cleanValue = cleanValue.replace(/[^\d.,]/g, '');

    // Normaliza para formato brasileiro
    // Exemplos de conversão:
    // "123.45" -> "123,45" (converte ponto americano para vírgula)
    // "1.234,5" -> "1.234,5" (mantém formato brasileiro)
    // "1234,5" -> "1.234,5" (adiciona separador de milhares)

    let formattedValue: string;

    // Se contém vírgula, é formato brasileiro ou misto
    if (cleanValue.includes(',')) {
      const parts = cleanValue.split(',');
      
      if (parts.length === 2) {
        // Formato brasileiro: parte inteira + vírgula + decimal
        let integerPart = parts[0].replace(/\./g, ''); // Remove pontos
        const decimalPart = parts[1].substring(0, 2); // Máximo 2 casas decimais
        
        // Adiciona separadores de milhares na parte inteira
        if (integerPart.length > 3) {
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        
        formattedValue = `${integerPart},${decimalPart}`;
      } else {
        // Múltiplas vírgulas, pega apenas a primeira parte
        let integerPart = parts[0].replace(/\./g, '');
        if (integerPart.length > 3) {
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        formattedValue = integerPart;
      }
    } else {
      // Se não há vírgula, pode ser:
      // - Número inteiro: "1234" -> "1.234"
      // - Formato americano: "123.45" -> "123,45"
      
      if (cleanValue.includes('.') && cleanValue.split('.').length === 2) {
        const parts = cleanValue.split('.');
        const lastPart = parts[parts.length - 1];
        
        // Se a última parte tem 1-2 dígitos, trata como decimal
        if (lastPart.length <= 2) {
          const allButLast = parts.slice(0, -1).join('');
          let integerPart = allButLast;
          
          if (integerPart.length > 3) {
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }
          
          formattedValue = `${integerPart},${lastPart}`;
        } else {
          // Trata como separadores de milhares
          let integerPart = cleanValue.replace(/\./g, '');
          if (integerPart.length > 3) {
            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }
          formattedValue = integerPart;
        }
      } else {
        // Número sem ponto, adiciona separadores de milhares
        if (cleanValue.length > 3) {
          formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        } else {
          formattedValue = cleanValue;
        }
      }
    }

    // Atualiza o estado com o valor formatado em padrão brasileiro
    handleInputChange('tamanhoMidia', formattedValue);
  };

  // Pesquisas
  const addPesquisa = () => {
    setFormData((prev) => ({
      ...prev,
      pesquisas: [...prev.pesquisas, { tipo: '', identificador: '' }],
    }));
  };

  const removePesquisa = () => {
    if (formData.pesquisas.length > 1) {
      setFormData((prev) => ({
        ...prev,
        pesquisas: prev.pesquisas.slice(0, -1),
      }));
    } else {
      showNotificationMsg(
        'Deve haver pelo menos uma linha de pesquisa.',
        'error'
      );
    }
  };

  const updatePesquisa = (
    index: number,
    field: 'tipo' | 'identificador' | 'complementar',
    value: string
  ) => {
    const updatedPesquisas = [...formData.pesquisas];
    updatedPesquisas[index] = { ...updatedPesquisas[index], [field]: value };
    setFormData((prev) => ({ ...prev, pesquisas: updatedPesquisas }));
  };

  const togglePesquisaComplementar = (index: number) => {
    const updatedPesquisas = [...formData.pesquisas];
    if (updatedPesquisas[index].complementar !== undefined) {
      delete updatedPesquisas[index].complementar;
    } else {
      updatedPesquisas[index].complementar = '';
    }
    setFormData((prev) => ({ ...prev, pesquisas: updatedPesquisas }));
  };

  // Funções para controlar dropdowns customizados
  const toggleDropdown = (field: string) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAnalistaSelect = (analista: string) => {
    setFormData((prev) => ({ ...prev, analista }));
    setDropdownOpen((prev) => ({ ...prev, analista: false }));
  };

  const handleTipoMidiaSelect = (tipo: string) => {
    setFormData((prev) => ({ ...prev, tipoMidia: tipo }));
    setDropdownOpen((prev) => ({ ...prev, tipoMidia: false }));
  };

  const handleTipoPesquisaSelect = (index: number, tipo: string) => {
    const updatedPesquisas = [...formData.pesquisas];
    updatedPesquisas[index].tipo = tipo;
    setFormData((prev) => ({ ...prev, pesquisas: updatedPesquisas }));
    setDropdownOpen((prev) => ({ ...prev, [`tipoPesquisa_${index}`]: false }));
  };

  // Funcionalidade de paste múltiplo
  const handlePasteMultipleValues = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;

    // Divide os valores por quebra de linha, vírgula ou ponto e vírgula
    const values = pastedData
      .split(/[\n,;]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) return;

    // Pega o tipo de pesquisa da linha atual
    const currentTipoPesquisa = formData.pesquisas[index].tipo;

    // Cria um array com as pesquisas existentes
    const updatedPesquisas = [...formData.pesquisas];

    // Para cada valor, atualiza ou cria nova linha
    values.forEach((value, valueIndex) => {
      if (valueIndex === 0) {
        // Primeiro valor vai na linha atual
        updatedPesquisas[index] = {
          ...updatedPesquisas[index],
          identificador: value,
          tipo: currentTipoPesquisa || updatedPesquisas[index].tipo,
        };
      } else {
        // Outros valores criam novas linhas
        const targetIndex = index + valueIndex;
        if (targetIndex < updatedPesquisas.length) {
          // Se já existe uma linha, atualiza
          updatedPesquisas[targetIndex] = {
            ...updatedPesquisas[targetIndex],
            identificador: value,
            tipo: currentTipoPesquisa,
          };
        } else {
          // Se não existe, cria nova linha
          updatedPesquisas.push({
            tipo: currentTipoPesquisa,
            identificador: value,
          });
        }
      }
    });

    setFormData((prev) => ({ ...prev, pesquisas: updatedPesquisas }));

    // Exibe notificação de sucesso
    showNotificationMsg(
      `${values.length} itens foram distribuídos com sucesso!`,
      'success'
    );
  };

  // Retificações
  const addRetificacao = () => {
    const newRetificacao: RetificacaoItem = {
      id: Date.now().toString(),
      autoridade: '',
      orgaoJudicial: '',
      dataAssinatura: '',
      retificada: false,
    };
    setRetificacoes((prev) => [...prev, newRetificacao]);
  };

  // const removeRetificacao = (id: string) => {
  //   setRetificacoes(prev => prev.filter(ret => ret.id !== id));
  // };

  const updateRetificacao = (
    id: string,
    field: keyof RetificacaoItem,
    value: string | boolean
  ) => {
    setRetificacoes((prev) =>
      prev.map((ret) => (ret.id === id ? { ...ret, [field]: value } : ret))
    );
  };

  // Função para lidar com checkbox de retificação em cadeia
  const handleRetificacaoCheckboxChange = (
    retificacaoId: string,
    checked: boolean
  ) => {
    updateRetificacao(retificacaoId, 'retificada', checked);

    if (checked) {
      // Adiciona nova retificação após esta
      addRetificacao();
    } else {
      // Remove todas as retificações posteriores a esta
      const currentIndex = retificacoes.findIndex(
        (ret) => ret.id === retificacaoId
      );
      if (currentIndex !== -1) {
        setRetificacoes((prev) => prev.slice(0, currentIndex + 1));
      }
    }
  };

  // Notificações
  const showNotificationMsg = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Submissão
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDocumentSaved(true);
    showNotificationMsg('Documento criado com sucesso!', 'success');
  };

  const handleGenerate = () => {
    if (!documentSaved) {
      showNotificationMsg('Salve o documento antes de gerar.', 'error');
      return;
    }
    showNotificationMsg('Documento gerado com sucesso!', 'success');
  };

  // Gerar anos para select
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formContainer}>
        {/* Header */}
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>
            Novo Documento - SGED {demandaId || demandaIdFromQuery || '23412'}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
            type="button"
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path
                fillRule='evenodd'
                d='M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z'
              />
            </svg>
            Voltar
          </button>
        </div>

        <div className={styles.formContent}>
          <form onSubmit={handleSubmit} className={styles.form}>
          {/* Seção 1 - Informações do Documento */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <span className={styles.sectionIcon}>01</span>
                <h2 className={styles.sectionTitle}>Informações do Documento</h2>
              </div>
              <span
                className={`${styles.statusIndicator} ${documentSaved ? styles.statusSaved : styles.statusUnsaved}`}
              >
                {documentSaved ? 'Salvo' : 'Não Salvo'}
              </span>
            </div>

            <div className={styles.sectionContent}>
              <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Tipo de Documento <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    ref={tipoDocumentoRef}
                    value={formData.tipoDocumento}
                    onChange={(e) => handleTipoDocumentoChange(e.target.value)}
                    className={styles.formSelect}
                    required
                  >
                    <option value=''></option>
                    {mockTiposDocumentos.map((tipo) => (
                      <option key={tipo.id} value={tipo.nome}>
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.tipoDocumento !== 'Mídia' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Assunto <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.assuntoWrapper}>
                    <div className={styles.selectWrapper}>
                      <select
                        value={formData.assunto}
                        onChange={(e) => handleAssuntoChange(e.target.value)}
                        className={styles.formSelect}
                        disabled={!formData.tipoDocumento}
                        required
                      >
                      <option value=''>
                        {formData.tipoDocumento
                          ? ''
                          : 'Selecione primeiro o tipo de documento'}
                      </option>
                      {formData.tipoDocumento &&
                        documentoAssuntoConfig[formData.tipoDocumento]?.map(
                          (assunto) => (
                            <option key={assunto} value={assunto}>
                              {assunto}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    {formData.assunto === 'Outros' && (
                      <input
                        type='text'
                        value={formData.assuntoOutros}
                        onChange={(e) =>
                          handleInputChange('assuntoOutros', e.target.value)
                        }
                        className={styles.formInput}
                        placeholder='Especifique o assunto'
                        required
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formGrid1}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Destinatário <span className={styles.required}>*</span>
                </label>
                <div
                  className={styles.searchContainer}
                  data-field='destinatario'
                >
                  <input
                    type='text'
                    value={formData.destinatario}
                    onChange={(e) => {
                      handleInputChange('destinatario', e.target.value);
                      handleSearch('destinatario', e.target.value);
                    }}
                    onKeyDown={(e) =>
                      handleKeyDown(e, 'destinatario', (value) =>
                        selectSearchResult('destinatario', value)
                      )
                    }
                    className={styles.formInput}
                    placeholder='Digite para pesquisar...'
                    required
                  />
                  {showResults.destinatario && (
                    <div className={styles.searchResults}>
                      {searchResults.destinatario.map((item, index) => (
                        <div
                          key={index}
                          className={`${styles.searchResultItem} ${
                            (selectedIndex.destinatario ?? -1) === index
                              ? styles.searchResultItemSelected
                              : ''
                          }`}
                          onClick={() =>
                            selectSearchResult('destinatario', item)
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formGrid1}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Endereçamento <span className={styles.required}>*</span>
                </label>
                <div
                  className={styles.searchContainer}
                  data-field='enderecamento'
                >
                  <input
                    type='text'
                    value={formData.enderecamento}
                    onChange={(e) => {
                      handleInputChange('enderecamento', e.target.value);
                      handleSearch('enderecamento', e.target.value);
                    }}
                    onKeyDown={(e) =>
                      handleKeyDown(e, 'enderecamento', (value) =>
                        selectSearchResult('enderecamento', value)
                      )
                    }
                    className={styles.formInput}
                    placeholder={formData.destinatario ? 'Digite para pesquisar...' : 'Selecione primeiro um destinatário'}
                    disabled={!formData.destinatario}
                    required
                  />
                  {showResults.enderecamento && (
                    <div className={styles.searchResults}>
                      {searchResults.enderecamento.map((item, index) => (
                        <div
                          key={index}
                          className={`${styles.searchResultItem} ${
                            (selectedIndex.enderecamento ?? -1) === index
                              ? styles.searchResultItemSelected
                              : ''
                          }`}
                          onClick={() =>
                            selectSearchResult('enderecamento', item)
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.formGridCustom}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Número do Documento <span className={styles.required}>*</span>
                </label>
                <input
                  type='text'
                  value={formData.numeroDocumento}
                  onChange={(e) =>
                    handleInputChange('numeroDocumento', e.target.value)
                  }
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Ano <span className={styles.required}>*</span>
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    value={formData.anoDocumento}
                    onChange={(e) =>
                      handleInputChange('anoDocumento', e.target.value)
                    }
                    className={styles.formSelect}
                    required
                  >
                    {generateYears().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Analista <span className={styles.required}>*</span>
                </label>
                <div className={styles.multiSelectContainer}>
                  <div
                    className={styles.multiSelectTrigger}
                    onClick={() => toggleDropdown('analista')}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown('analista');
                      }
                    }}
                  >
                    <span>{formData.analista || ''}</span>
                    <span className={styles.dropdownArrow}>
                      {dropdownOpen.analista ? '▲' : '▼'}
                    </span>
                  </div>
                  {dropdownOpen.analista && (
                    <div className={styles.multiSelectDropdown}>
                      {analistas.map((analista) => (
                        <label
                          key={analista}
                          className={styles.checkboxLabel}
                          onClick={() => handleAnalistaSelect(analista)}
                        >
                          <span className={styles.checkboxText}>{analista}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </section>

          {/* Seção 2 - Dados da Decisão Judicial */}
          {sectionVisibility.section2 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.sectionIcon}>02</span>
                  <h2 className={styles.sectionTitle}>
                    Dados da Decisão Judicial
                  </h2>
                </div>
              </div>

              <div className={styles.sectionContent}>
                <div className={styles.formGrid1}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Autoridade <span className={styles.required}>*</span>
                  </label>
                  <div
                    className={styles.searchContainer}
                    data-field='autoridade'
                  >
                    <input
                      type='text'
                      value={formData.autoridade}
                      onChange={(e) => {
                        handleInputChange('autoridade', e.target.value);
                        handleSearch('autoridade', e.target.value);
                      }}
                      onKeyDown={(e) =>
                        handleKeyDown(e, 'autoridade', (value) =>
                          selectSearchResult('autoridade', value)
                        )
                      }
                      className={styles.formInput}
                      placeholder='Digite para pesquisar...'
                      required
                    />
                    {showResults.autoridade && (
                      <div className={styles.searchResults}>
                        {searchResults.autoridade.map((item, index) => (
                          <div
                            key={index}
                            className={`${styles.searchResultItem} ${
                              (selectedIndex.autoridade ?? -1) === index
                                ? styles.searchResultItemSelected
                                : ''
                            }`}
                            onClick={() =>
                              selectSearchResult('autoridade', item)
                            }
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGrid1}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Órgão Judicial <span className={styles.required}>*</span>
                  </label>
                  <div
                    className={styles.searchContainer}
                    data-field='orgaoJudicial'
                  >
                    <input
                      type='text'
                      value={formData.orgaoJudicial}
                      onChange={(e) => {
                        handleInputChange('orgaoJudicial', e.target.value);
                        handleSearch('orgaoJudicial', e.target.value);
                      }}
                      onKeyDown={(e) =>
                        handleKeyDown(e, 'orgaoJudicial', (value) =>
                          selectSearchResult('orgaoJudicial', value)
                        )
                      }
                      className={styles.formInput}
                      placeholder='Digite para pesquisar...'
                      required
                    />
                    {showResults.orgaoJudicial && (
                      <div className={styles.searchResults}>
                        {searchResults.orgaoJudicial.map((item, index) => (
                          <div
                            key={index}
                            className={`${styles.searchResultItem} ${
                              (selectedIndex.orgaoJudicial ?? -1) === index
                                ? styles.searchResultItemSelected
                                : ''
                            }`}
                            onClick={() =>
                              selectSearchResult('orgaoJudicial', item)
                            }
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Data da Assinatura{' '}
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.dateInputWrapper}>
                    <input
                      type='text'
                      value={formData.dataAssinatura}
                      onChange={(e) =>
                        handleDateChange('dataAssinatura', e.target.value)
                      }
                      className={styles.formInput}
                      placeholder='dd/mm/aaaa'
                      maxLength={10}
                      required
                    />
                    <input
                      type='date'
                      value={convertToHTMLDate(formData.dataAssinatura)}
                      onChange={(e) =>
                        handleCalendarChange('dataAssinatura', e.target.value)
                      }
                      className={styles.hiddenDateInput}
                      tabIndex={-1}
                    />
                    <button
                      type='button'
                      className={styles.calendarButton}
                      onClick={(e) => {
                        const wrapper = e.currentTarget.parentElement;
                        const dateInput = wrapper?.querySelector(
                          'input[type="date"]'
                        ) as HTMLInputElement;
                        if (dateInput && dateInput.showPicker) {
                          dateInput.showPicker();
                        }
                      }}
                      title='Abrir calendário'
                    >
                      📅
                    </button>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.flexCenter}`}>
                  <div className={styles.checkboxGroup}>
                    <input
                      type='checkbox'
                      id='retificada'
                      checked={formData.retificada}
                      onChange={(e) => {
                        handleInputChange('retificada', e.target.checked);
                        if (e.target.checked && retificacoes.length === 0) {
                          addRetificacao();
                        } else if (!e.target.checked) {
                          setRetificacoes([]);
                        }
                      }}
                      className={styles.checkboxInput}
                    />
                    <label
                      htmlFor='retificada'
                      className={styles.checkboxLabel}
                    >
                      Retificada
                    </label>
                  </div>
                </div>
              </div>

              {/* Seções de Retificação */}
              {retificacoes.map((retificacao, index) => (
                <div key={retificacao.id} className={styles.retificacaoSection}>
                  <div className={styles.retificacaoHeader}>
                    <span>Decisão Retificadora {index + 1}</span>
                  </div>

                  <div className={styles.sectionContent}>
                    <div className={styles.formGrid1}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Autoridade <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.searchContainer}>
                        <input
                          type='text'
                          value={retificacao.autoridade}
                          onChange={(e) => {
                            updateRetificacao(
                              retificacao.id,
                              'autoridade',
                              e.target.value
                            );
                            handleSearchInput(
                              `ret-autoridade-${retificacao.id}`,
                              e.target.value,
                              autoridades
                            );
                          }}
                          onFocus={() => {
                            if (retificacao.autoridade) {
                              handleSearchInput(
                                `ret-autoridade-${retificacao.id}`,
                                retificacao.autoridade,
                                autoridades
                              );
                            }
                          }}
                          className={styles.formInput}
                          placeholder='Digite para pesquisar...'
                          autoComplete='off'
                          required
                        />
                        {showResults[`ret-autoridade-${retificacao.id}`] && (
                          <div className={styles.searchResults}>
                            {searchResults[
                              `ret-autoridade-${retificacao.id}`
                            ]?.map((item, idx) => (
                              <div
                                key={idx}
                                className={styles.searchResultItem}
                                onClick={() => {
                                  updateRetificacao(
                                    retificacao.id,
                                    'autoridade',
                                    item
                                  );
                                  setShowResults((prev) => ({
                                    ...prev,
                                    [`ret-autoridade-${retificacao.id}`]: false,
                                  }));
                                }}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid1}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Órgão Judicial{' '}
                        <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.searchContainer}>
                        <input
                          type='text'
                          value={retificacao.orgaoJudicial}
                          onChange={(e) => {
                            updateRetificacao(
                              retificacao.id,
                              'orgaoJudicial',
                              e.target.value
                            );
                            handleSearchInput(
                              `ret-orgao-${retificacao.id}`,
                              e.target.value,
                              orgaosJudiciais
                            );
                          }}
                          onFocus={() => {
                            if (retificacao.orgaoJudicial) {
                              handleSearchInput(
                                `ret-orgao-${retificacao.id}`,
                                retificacao.orgaoJudicial,
                                orgaosJudiciais
                              );
                            }
                          }}
                          className={styles.formInput}
                          placeholder='Digite para pesquisar...'
                          autoComplete='off'
                          required
                        />
                        {showResults[`ret-orgao-${retificacao.id}`] && (
                          <div className={styles.searchResults}>
                            {searchResults[`ret-orgao-${retificacao.id}`]?.map(
                              (item, idx) => (
                                <div
                                  key={idx}
                                  className={styles.searchResultItem}
                                  onClick={() => {
                                    updateRetificacao(
                                      retificacao.id,
                                      'orgaoJudicial',
                                      item
                                    );
                                    setShowResults((prev) => ({
                                      ...prev,
                                      [`ret-orgao-${retificacao.id}`]: false,
                                    }));
                                  }}
                                >
                                  {item}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Data da Assinatura{' '}
                        <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.dateInputWrapper}>
                        <input
                          type='text'
                          value={retificacao.dataAssinatura}
                          onChange={(e) =>
                            handleRetificacaoDateChange(
                              retificacao.id,
                              e.target.value
                            )
                          }
                          className={styles.formInput}
                          placeholder='dd/mm/aaaa'
                          maxLength={10}
                          required
                        />
                        <input
                          type='date'
                          value={convertToHTMLDate(retificacao.dataAssinatura)}
                          onChange={(e) =>
                            handleRetificacaoCalendarChange(
                              retificacao.id,
                              e.target.value
                            )
                          }
                          className={styles.hiddenDateInput}
                          tabIndex={-1}
                        />
                        <button
                          type='button'
                          className={styles.calendarButton}
                          onClick={(e) => {
                            const wrapper = e.currentTarget.parentElement;
                            const dateInput = wrapper?.querySelector(
                              'input[type="date"]'
                            ) as HTMLInputElement;
                            if (dateInput && dateInput.showPicker) {
                              dateInput.showPicker();
                            }
                          }}
                          title='Abrir calendário'
                        >
                          📅
                        </button>
                      </div>
                    </div>

                    <div className={`${styles.formGroup} ${styles.flexCenter}`}>
                      <div className={styles.checkboxGroup}>
                        <input
                          type='checkbox'
                          id={`retificada-${retificacao.id}`}
                          checked={retificacao.retificada}
                          onChange={(e) =>
                            handleRetificacaoCheckboxChange(
                              retificacao.id,
                              e.target.checked
                            )
                          }
                          className={styles.checkboxInput}
                        />
                        <label
                          htmlFor={`retificada-${retificacao.id}`}
                          className={styles.checkboxLabel}
                        >
                          Retificada
                        </label>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
              </div>
            </section>
          )}

          {/* Seção 3 - Dados da Mídia */}
          {sectionVisibility.section3 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.sectionIcon}>03</span>
                  <h2 className={styles.sectionTitle}>Dados da Mídia</h2>
                </div>
              </div>

              <div className={styles.sectionContent}>
                <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Tipo de Mídia <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.multiSelectContainer}>
                    <div
                      className={styles.multiSelectTrigger}
                      onClick={() => toggleDropdown('tipoMidia')}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDropdown('tipoMidia');
                        }
                      }}
                    >
                      <span>{formData.tipoMidia || ''}</span>
                      <span className={styles.dropdownArrow}>
                        {dropdownOpen.tipoMidia ? '▲' : '▼'}
                      </span>
                    </div>
                    {dropdownOpen.tipoMidia && (
                      <div className={styles.multiSelectDropdown}>
                        {mockTiposMidias.map((tipo) => (
                          <label
                            key={tipo.id}
                            className={styles.checkboxLabel}
                            onClick={() => handleTipoMidiaSelect(tipo.nome)}
                          >
                            <span className={styles.checkboxText}>{tipo.nome}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Tamanho (MB) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type='text'
                    value={formatTamanhoMidia(formData.tamanhoMidia)}
                    onChange={(e) => handleTamanhoMidiaChange(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Hash <span className={styles.required}>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.hashMidia}
                    onChange={(e) =>
                      handleInputChange('hashMidia', e.target.value)
                    }
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Senha de Acesso <span className={styles.required}>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.senhaMidia}
                    onChange={(e) =>
                      handleInputChange('senhaMidia', e.target.value)
                    }
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>
              </div>
            </section>
          )}

          {/* Seção 4 - Dados da Pesquisa */}
          {sectionVisibility.section4 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.sectionIcon}>04</span>
                  <h2 className={styles.sectionTitle}>Dados da Pesquisa</h2>
                </div>
              </div>

              <div className={styles.sectionContent}>
                <div className={styles.pesquisaList}>
                {formData.pesquisas.map((pesquisa, index) => (
                  <div
                    key={index}
                    className={`${styles.pesquisaGrid} ${pesquisa.complementar !== undefined ? styles.expanded : ''}`}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Tipo <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.multiSelectContainer}>
                        <div
                          className={styles.multiSelectTrigger}
                          onClick={() => toggleDropdown(`tipoPesquisa_${index}`)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleDropdown(`tipoPesquisa_${index}`);
                            }
                          }}
                        >
                          <span>{tiposPesquisa.find(t => t.value === pesquisa.tipo)?.label || ''}</span>
                          <span className={styles.dropdownArrow}>
                            {dropdownOpen[`tipoPesquisa_${index}`] ? '▲' : '▼'}
                          </span>
                        </div>
                        {dropdownOpen[`tipoPesquisa_${index}`] && (
                          <div className={styles.multiSelectDropdown}>
                            {tiposPesquisa.map((tipo) => (
                              <label
                                key={tipo.value}
                                className={styles.checkboxLabel}
                                onClick={() => handleTipoPesquisaSelect(index, tipo.value)}
                              >
                                <span className={styles.checkboxText}>{tipo.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Identificador <span className={styles.required}>*</span>
                      </label>
                      <input
                        type='text'
                        value={pesquisa.identificador}
                        onChange={(e) =>
                          updatePesquisa(index, 'identificador', e.target.value)
                        }
                        onPaste={(e) => handlePasteMultipleValues(e, index)}
                        className={styles.formInput}
                        required
                      />
                    </div>

                    {pesquisa.complementar !== undefined && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Complementar{' '}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type='text'
                          value={pesquisa.complementar}
                          onChange={(e) =>
                            updatePesquisa(
                              index,
                              'complementar',
                              e.target.value
                            )
                          }
                          className={styles.formInput}
                          required
                        />
                      </div>
                    )}

                    <div className={styles.pesquisaControls}>
                      <button
                        type='button'
                        onClick={() => togglePesquisaComplementar(index)}
                        className={styles.btnExpand}
                        title={
                          pesquisa.complementar !== undefined
                            ? 'Remover coluna'
                            : 'Adicionar coluna'
                        }
                      >
                        {pesquisa.complementar !== undefined ? '⊖' : '⊕'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.pesquisaAddControls}>
                <button
                  type='button'
                  onClick={removePesquisa}
                  className={styles.btnRemove}
                  title='Remover última linha'
                >
                  −
                </button>
                <button
                  type='button'
                  onClick={addPesquisa}
                  className={styles.btnAdd}
                  title='Adicionar linha'
                >
                  +
                </button>
              </div>
              </div>
            </section>
          )}

          {/* Footer - Botões de Ação */}
          <footer className={styles.formActions}>
            <button
              type='submit'
              disabled={documentSaved}
              className={styles.btnSubmit}
            >
              Criar Documento
            </button>
            <button
              type='button'
              onClick={handleGenerate}
              disabled={!documentSaved}
              className={styles.btnGenerate}
            >
              Gerar Documento
            </button>
          </footer>
        </form>
        </div>
      </div>

      {/* Notificação */}
      {showNotification && (
        <div
          className={`${styles.notification} ${styles[`notification${showNotification.type.charAt(0).toUpperCase() + showNotification.type.slice(1)}`]}`}
        >
          {showNotification.message}
        </div>
      )}
    </div>
  );
}
