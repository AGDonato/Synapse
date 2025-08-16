// src/pages/NovoDocumentoPage.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MultiSelectDropdown, {
  type MultiSelectOption,
} from '../components/forms/MultiSelectDropdown';
import Toast from '../components/ui/Toast';
import { useDocumentos } from '../contexts/DocumentosContext';
import { mockAnalistas } from '../data/mockAnalistas';
import { mockAutoridades } from '../data/mockAutoridades';
import { mockOrgaos } from '../data/mockOrgaos';
import { mockProvedores } from '../data/mockProvedores';
import { mockRegrasAutoridades } from '../data/mockRegrasAutoridades';
import { mockRegrasOrgaos } from '../data/mockRegrasOrgaos';
import { mockTiposDocumentos } from '../data/mockTiposDocumentos';
import { mockTiposIdentificadores } from '../data/mockTiposIdentificadores';
import { mockTiposMidias } from '../data/mockTiposMidias';
import { useDemandas } from '../hooks/useDemandas';
import styles from './NovoDocumentoPage.module.css';

// Importando utilitários de busca
import { filterWithAdvancedSearch } from '../utils/searchUtils';

// Tipos
interface FormData {
  tipoDocumento: string;
  assunto: string;
  assuntoOutros: string;
  destinatario: string;
  destinatarios: MultiSelectOption[]; // Para multi-seleção em Ofício Circular
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

type SectionRequired = {
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

const secaoObrigatoriedade: Record<string, SectionRequired> = {
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
  'Ofício|Outros': { section2: false, section3: false, section4: false },
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
  'Ofício Circular|Outros': {
    section2: false,
    section3: false,
    section4: false,
  },
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
  ...mockProvedores.map(provedor => provedor.nomeFantasia),
  ...mockAutoridades.map(autoridade => autoridade.nome),
].sort();

// Opções para multi-seleção (Ofício Circular)
const destinatariosOptions: MultiSelectOption[] = [
  ...mockProvedores.map(provedor => ({
    id: `provedor-${provedor.id}`,
    nome: provedor.nomeFantasia,
  })),
  ...mockAutoridades.map(autoridade => ({
    id: `autoridade-${autoridade.id}`,
    nome: autoridade.nome,
  })),
].sort((a, b) => a.nome.localeCompare(b.nome));

// Listas separadas para endereçamento dinâmico
const enderecamentosProvedores = mockProvedores
  .map(provedor => provedor.razaoSocial)
  .sort();
const enderecamentosOrgaos = mockOrgaos.map(orgao => orgao.nomeCompleto).sort();

// Função para obter lista de endereçamentos baseada no destinatário
const getEnderecamentos = (destinatario: string): string[] => {
  // Se não há destinatário selecionado, retorna lista vazia
  if (!destinatario || destinatario.trim() === '') {
    return [];
  }

  // Verifica se o destinatário é um provedor
  const isProvedor = mockProvedores.some(
    provedor => provedor.nomeFantasia === destinatario
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
  .filter(regra => regra.isAutoridadeJudicial)
  .map(regra => regra.autoridadeId);

const autoridades = mockAutoridades
  .filter(autoridade => idsAutoridadesJudiciais.includes(autoridade.id))
  .map(autoridade => `${autoridade.nome} - ${autoridade.cargo}`)
  .sort();

// Órgãos judiciais baseados nas regras
const idsOrgaosJudiciais = mockRegrasOrgaos
  .filter(regra => regra.isOrgaoJudicial)
  .map(regra => regra.orgaoId);

const orgaosJudiciais = mockOrgaos
  .filter(orgao => idsOrgaosJudiciais.includes(orgao.id))
  .map(orgao => orgao.nomeCompleto)
  .sort();

// Analistas vindos do mock
const analistas = mockAnalistas.map(analista => analista.nome).sort();

// Tipos de pesquisa vindos do mock
const tiposPesquisa = mockTiposIdentificadores
  .map(tipo => ({ value: tipo.nome.toLowerCase(), label: tipo.nome }))
  .sort((a, b) => a.label.localeCompare(b.label));

export default function NovoDocumentoPage() {
  const navigate = useNavigate();
  const { demandaId, documentoId } = useParams();
  const [searchParams] = useSearchParams();
  const demandaIdFromQuery = searchParams.get('demandaId');
  const { getDocumento, addDocumento, updateDocumento } = useDocumentos();
  const { demandas } = useDemandas();

  // Estados para Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  // Detectar se está em modo de edição
  const isEditMode = Boolean(documentoId);

  // Buscar documento para edição se necessário
  const documentoToEdit =
    isEditMode && documentoId ? getDocumento(parseInt(documentoId)) : null;
  const tipoDocumentoRef = useRef<HTMLSelectElement>(null);
  const [documentSaved, setDocumentSaved] = useState(false);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    {
      section2: false,
      section3: false,
      section4: false,
    }
  );
  const [sectionRequired, setSectionRequired] = useState<SectionRequired>({
    section2: false,
    section3: false,
    section4: false,
  });
  const [retificacoes, setRetificacoes] = useState<RetificacaoItem[]>([]);

  // Estado para controlar dropdowns customizados
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({
    analista: false,
    tipoMidia: false,
    tipoDocumento: false,
    assunto: false,
    anoDocumento: false,
  });

  // Função para dividir string de destinatários (tratando formato com "e")
  const parseDestinatarios = (destinatarioString: string): string[] => {
    if (!destinatarioString) return [];

    // Se contém " e ", tratar o formato "A, B e C"
    if (destinatarioString.includes(' e ')) {
      const parts = destinatarioString.split(' e ');
      const ultimoNome = parts.pop()?.trim();
      const primeirosNomes = parts
        .join(' e ')
        .split(', ')
        .map(nome => nome.trim());

      if (ultimoNome) {
        return [...primeirosNomes, ultimoNome];
      }
      return primeirosNomes;
    }

    // Formato simples com apenas vírgulas "A, B, C"
    return destinatarioString
      .split(',')
      .map(nome => nome.trim())
      .filter(nome => nome.length > 0);
  };

  // Função para criar dados iniciais do formulário
  const createInitialFormData = (): FormData => {
    if (isEditMode && documentoToEdit) {
      // Converter dados do documento para o formato do formulário
      return {
        tipoDocumento: documentoToEdit.tipoDocumento,
        assunto: documentoToEdit.assunto || '',
        assuntoOutros: documentoToEdit.assuntoOutros || '',
        destinatario: documentoToEdit.destinatario,
        destinatarios:
          documentoToEdit.tipoDocumento === 'Ofício Circular'
            ? documentoToEdit.destinatario
              ? (() => {
                  const nomesDestinatarios = parseDestinatarios(
                    documentoToEdit.destinatario
                  );

                  console.log(
                    'Destinatários no documento:',
                    nomesDestinatarios
                  );
                  console.log(
                    'Opções disponíveis:',
                    destinatariosOptions.map(opt => opt.nome)
                  );

                  return nomesDestinatarios.map((nome, index) => {
                    const opcaoEncontrada = destinatariosOptions.find(
                      opt => opt.nome === nome
                    );
                    console.log(
                      `Procurando "${nome}":`,
                      opcaoEncontrada ? 'Encontrado' : 'NÃO ENCONTRADO'
                    );

                    return (
                      opcaoEncontrada || {
                        id: `dest_${index}`,
                        nome: nome,
                      }
                    );
                  });
                })()
              : []
            : [],
        enderecamento: documentoToEdit.enderecamento || '',
        numeroDocumento: documentoToEdit.numeroDocumento,
        anoDocumento:
          documentoToEdit.anoDocumento || new Date().getFullYear().toString(),
        analista: documentoToEdit.analista || '',
        autoridade: documentoToEdit.autoridade || '',
        orgaoJudicial: documentoToEdit.orgaoJudicial || '',
        dataAssinatura: documentoToEdit.dataAssinatura || '',
        retificada: documentoToEdit.retificada || false,
        tipoMidia: documentoToEdit.tipoMidia || '',
        tamanhoMidia: documentoToEdit.tamanhoMidia || '',
        hashMidia: documentoToEdit.hashMidia || '',
        senhaMidia: documentoToEdit.senhaMidia || '',
        pesquisas:
          documentoToEdit.pesquisas && documentoToEdit.pesquisas.length > 0
            ? documentoToEdit.pesquisas
            : [{ tipo: '', identificador: '' }],
      };
    } else {
      // Dados padrão para novo documento
      return {
        tipoDocumento: '',
        assunto: '',
        assuntoOutros: '',
        destinatario: '',
        destinatarios: [],
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
      };
    }
  };

  const [formData, setFormData] = useState<FormData>(createInitialFormData());

  // Carregar retificações quando em modo de edição
  useEffect(() => {
    if (isEditMode && documentoToEdit && documentoToEdit.retificacoes) {
      const retificacoesFormatadas = documentoToEdit.retificacoes.map(
        (ret: {
          id: string;
          autoridade: string;
          orgaoJudicial: string;
          dataAssinatura: string;
          retificada: boolean;
        }) => ({
          id: ret.id,
          autoridade: ret.autoridade,
          orgaoJudicial: ret.orgaoJudicial,
          dataAssinatura: ret.dataAssinatura,
          retificada: ret.retificada,
        })
      );
      setRetificacoes(retificacoesFormatadas);
    }
  }, [isEditMode, documentoToEdit]);

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

  // Atualizar visibilidade e obrigatoriedade das seções quando formData muda ou no modo de edição
  useEffect(() => {
    const { tipoDocumento, assunto } = formData;
    let configKey: string;

    if (tipoDocumento === 'Mídia') {
      configKey = 'Mídia|SEM_ASSUNTO';
    } else if (tipoDocumento && assunto) {
      configKey = `${tipoDocumento}|${assunto}`;
    } else {
      const defaultSectionState = {
        section2: false,
        section3: false,
        section4: false,
      };
      setSectionVisibility(defaultSectionState);
      setSectionRequired(defaultSectionState);
      // Limpar campos de todas as seções quando não há configuração válida
      clearAllHiddenFields(defaultSectionState);
      return;
    }

    const newVisibilityConfig = secaoConfiguracoes[configKey] || {
      section2: false,
      section3: false,
      section4: false,
    };
    setSectionVisibility(newVisibilityConfig);

    const newRequiredConfig = secaoObrigatoriedade[configKey] || {
      section2: false,
      section3: false,
      section4: false,
    };
    setSectionRequired(newRequiredConfig);

    // Limpar campos das seções que estão ocultas na nova configuração apenas se não estiver em modo de edição
    if (!isEditMode) {
      clearAllHiddenFields(newVisibilityConfig);
    }
  }, [formData.tipoDocumento, formData.assunto, isEditMode]);

  // Foco automático no primeiro campo ao carregar
  useEffect(() => {
    if (tipoDocumentoRef.current) {
      tipoDocumentoRef.current.focus();
    }
  }, []);

  // Função para fechar outras listas quando um campo específico recebe foco
  const closeOtherSearchResults = (currentFieldId: string) => {
    setShowResults(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (key !== currentFieldId) {
          newState[key] = false;
        }
      });
      return newState;
    });
    setSelectedIndex(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (!key.includes(currentFieldId)) {
          delete newState[key];
        }
      });
      return newState;
    });

    // Fechar também dropdowns customizados quando campo de busca recebe foco
    setDropdownOpen({
      analista: false,
      tipoMidia: false,
      tipoDocumento: false,
      assunto: false,
      anoDocumento: false,
    });
  };

  // UseEffect para fechar resultados de busca e dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Verifica se o clique foi fora de qualquer container de busca
      if (!target.closest(`.${styles.searchContainer}`)) {
        // Fechar todas as listas de busca (principais e retificação)
        setShowResults(prev => {
          const newState: Record<string, boolean> = {};
          Object.keys(prev).forEach(key => {
            newState[key] = false;
          });
          return newState;
        });
        setSelectedIndex({});
      }

      // Fechar dropdowns customizados
      if (
        !target.closest(`[class*='multiSelectContainer']`) &&
        !target.closest(`[class*='customDropdownContainer']`)
      ) {
        setDropdownOpen(prev => {
          const newState: Record<string, boolean> = {};
          Object.keys(prev).forEach(key => {
            newState[key] = false;
          });
          return newState;
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Validação: Verificar se a demanda está finalizada
  useEffect(() => {
    const currentDemandaId = demandaId || demandaIdFromQuery;

    if (currentDemandaId && !isEditMode) {
      const demanda = demandas.find(d => d.id === parseInt(currentDemandaId));

      if (demanda?.status === 'Finalizada') {
        setToastMessage(
          'Não é possível criar documentos em demandas finalizadas.'
        );
        setToastType('error');
        setShowToast(true);

        // Navegar de volta após 2 segundos
        setTimeout(() => {
          navigate(`/demandas/${currentDemandaId}`);
        }, 2000);
      }
    }
  }, [demandaId, demandaIdFromQuery, isEditMode, demandas, navigate]);

  // Função para limpar campos de todas as seções ocultas
  const clearAllHiddenFields = (visibility: SectionVisibility) => {
    setFormData(prev => {
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
    value: string | number | boolean | MultiSelectOption[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Para Ofício Circular, definir endereçamento fixo quando destinatários mudarem
      ...(field === 'destinatarios' && prev.tipoDocumento === 'Ofício Circular'
        ? { enderecamento: 'Respectivos departamentos jurídicos' }
        : {}),
    }));
    if (documentSaved) {
      setDocumentSaved(false);
    }
  };

  const handleTipoDocumentoChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      tipoDocumento: value,
      assunto: '',
      assuntoOutros: '',
      // Limpar campos de destinatário ao mudar tipo
      destinatario: '',
      destinatarios: [],
      enderecamento: '',
    }));
    if (documentSaved) setDocumentSaved(false);
  };

  const handleAssuntoChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      assunto: value,
      assuntoOutros: value === 'Outros' ? prev.assuntoOutros : '',
      // Auto-preencher endereçamento para Ofício Circular
      enderecamento:
        prev.tipoDocumento === 'Ofício Circular'
          ? 'Respectivos departamentos jurídicos'
          : prev.enderecamento,
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

    setSearchResults(prev => ({ ...prev, [field]: filtered }));
    setShowResults(prev => ({
      ...prev,
      [field]: query.length > 0 && filtered.length > 0,
    }));
    setSelectedIndex(prev => ({ ...prev, [field]: -1 })); // Reset seleção
  };

  // Função generalizada para busca em campos dinâmicos (incluindo retificações) com busca avançada
  const handleSearchInput = (
    fieldId: string,
    query: string,
    dataList: string[]
  ) => {
    const filtered = filterWithAdvancedSearch(dataList, query);

    setSearchResults(prev => ({ ...prev, [fieldId]: filtered }));
    setShowResults(prev => ({
      ...prev,
      [fieldId]: query.length > 0 && filtered.length > 0,
    }));
    setSelectedIndex(prev => ({ ...prev, [fieldId]: -1 })); // Reset seleção
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
      searchContainers.forEach(container => {
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

  // Função para scroll automático em dropdowns customizados
  const scrollToDropdownItem = (dropdownKey: string, index: number) => {
    setTimeout(() => {
      // Buscar o trigger primeiro pelo data-dropdown
      const trigger = document.querySelector(
        `[data-dropdown="${dropdownKey}"]`
      );

      if (trigger) {
        // Encontrar o dropdown que é o próximo elemento irmão com multiSelectDropdown
        const dropdown = trigger.parentElement?.querySelector(
          '[class*="multiSelectDropdown"]'
        );

        if (dropdown) {
          // Buscar todos os itens do dropdown
          const items = dropdown.querySelectorAll('[class*="checkboxLabel"]');

          const focusedItem = items[index] as HTMLElement;

          if (focusedItem) {
            focusedItem.scrollIntoView({
              block: 'nearest',
              behavior: 'smooth',
            });
          }
        }
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
    const isListVisible = showResults[fieldId] || false;

    // Se seta para baixo e lista não está aberta, abrir lista filtrada pelo valor atual
    if (e.key === 'ArrowDown' && !isListVisible) {
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const currentValue = input.value;

      // Determinar qual função de busca usar baseado no fieldId
      if (fieldId === 'autoridade') {
        handleSearch('autoridade', currentValue);
      } else if (fieldId === 'orgaoJudicial') {
        handleSearch('orgaoJudicial', currentValue);
      } else if (fieldId === 'destinatario') {
        handleSearch('destinatario', currentValue);
      } else if (fieldId === 'enderecamento') {
        handleSearch('enderecamento', currentValue);
      } else if (fieldId.startsWith('ret-autoridade-')) {
        handleSearchInput(fieldId, currentValue, autoridades);
      } else if (fieldId.startsWith('ret-orgao-')) {
        handleSearchInput(fieldId, currentValue, orgaosJudiciais);
      }
      return;
    }

    // Se não há resultados, não processar navegação
    if (results.length === 0) return;

    const currentIndex = selectedIndex[fieldId] ?? -1;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex =
          currentIndex < results.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedIndex(prev => ({ ...prev, [fieldId]: nextIndex }));
        scrollToSelectedItem(fieldId, nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        setSelectedIndex(prev => ({ ...prev, [fieldId]: prevIndex }));
        scrollToSelectedItem(fieldId, prevIndex);
        break;
      }

      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex >= 0 && currentIndex < results.length) {
          const selectedValue = results[currentIndex];
          callback(selectedValue);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowResults(prev => ({ ...prev, [fieldId]: false }));
        setSelectedIndex(prev => ({ ...prev, [fieldId]: -1 }));
        // Retornar foco ao campo
        setTimeout(() => {
          const input = document.querySelector(
            `[data-field="${fieldId}"] input`
          ) as HTMLInputElement;
          if (input) {
            input.focus();
          }
        }, 0);
        break;

      case 'Tab':
        // Fechar resultados ao pressionar Tab
        setShowResults(prev => ({ ...prev, [fieldId]: false }));
        setSelectedIndex(prev => ({ ...prev, [fieldId]: -1 }));
        break;
    }
  };

  const selectSearchResult = (
    field: 'destinatario' | 'enderecamento' | 'autoridade' | 'orgaoJudicial',
    value: string
  ) => {
    handleInputChange(field, value);
    setShowResults(prev => ({ ...prev, [field]: false }));
    setSelectedIndex(prev => ({ ...prev, [field]: -1 }));

    // Retornar foco ao campo após seleção
    setTimeout(() => {
      const input = document.querySelector(
        `[data-field="${field}"] input`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);

    // Se selecionou um destinatário, verifica se é um provedor para autocompletar o endereçamento
    if (field === 'destinatario') {
      // Busca o provedor correspondente pelo nomeFantasia
      const provedorEncontrado = mockProvedores.find(
        provedor => provedor.nomeFantasia === value
      );

      if (provedorEncontrado) {
        // Para Ofício Circular, sempre usar endereçamento fixo
        if (formData.tipoDocumento === 'Ofício Circular') {
          handleInputChange(
            'enderecamento',
            'Respectivos departamentos jurídicos'
          );
        } else {
          // Se encontrou o provedor, preenche o endereçamento com a razaoSocial
          handleInputChange('enderecamento', provedorEncontrado.razaoSocial);
        }
      } else {
        // Para Ofício Circular, sempre usar endereçamento fixo
        if (formData.tipoDocumento === 'Ofício Circular') {
          handleInputChange(
            'enderecamento',
            'Respectivos departamentos jurídicos'
          );
        } else {
          // Se não é um provedor (é uma autoridade), não preenche o endereçamento
          handleInputChange('enderecamento', '');
        }
      }
    }
  };

  // Função para seleção de resultados nas retificações
  const selectRetificacaoSearchResult = (
    retificacaoId: string,
    field: 'autoridade' | 'orgaoJudicial',
    value: string
  ) => {
    updateRetificacao(retificacaoId, field, value);
    const fieldKey = `ret-${field === 'autoridade' ? 'autoridade' : 'orgao'}-${retificacaoId}`;
    setShowResults(prev => ({ ...prev, [fieldKey]: false }));
    setSelectedIndex(prev => ({ ...prev, [fieldKey]: -1 }));

    // Retornar foco ao campo após seleção
    setTimeout(() => {
      const input = document.querySelector(
        `[data-field="${fieldKey}"] input`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 0);
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
    setFormData(prev => ({
      ...prev,
      pesquisas: [...prev.pesquisas, { tipo: '', identificador: '' }],
    }));
  };

  const removePesquisa = () => {
    if (formData.pesquisas.length > 1) {
      setFormData(prev => ({
        ...prev,
        pesquisas: prev.pesquisas.slice(0, -1),
      }));
    } else {
      showToastMsg('Deve haver pelo menos uma linha de pesquisa.', 'error');
    }
  };

  const updatePesquisa = (
    index: number,
    field: 'tipo' | 'identificador' | 'complementar',
    value: string
  ) => {
    const updatedPesquisas = [...formData.pesquisas];
    updatedPesquisas[index] = { ...updatedPesquisas[index], [field]: value };
    setFormData(prev => ({ ...prev, pesquisas: updatedPesquisas }));
  };

  const togglePesquisaComplementar = (index: number) => {
    const updatedPesquisas = [...formData.pesquisas];
    if (updatedPesquisas[index].complementar !== undefined) {
      delete updatedPesquisas[index].complementar;
    } else {
      updatedPesquisas[index].complementar = '';
    }
    setFormData(prev => ({ ...prev, pesquisas: updatedPesquisas }));
  };

  // Funções para controlar dropdowns customizados
  const toggleDropdown = (field: string) => {
    const isCurrentlyOpen = dropdownOpen[field];

    // Fechar todas as listas de busca quando abrir dropdown
    setShowResults({
      destinatario: false,
      enderecamento: false,
      autoridade: false,
      orgaoJudicial: false,
    });
    setSelectedIndex(prev => {
      const newState = { ...prev };
      // Limpar índices de busca
      Object.keys(newState).forEach(key => {
        if (
          key === 'destinatario' ||
          key === 'enderecamento' ||
          key === 'autoridade' ||
          key === 'orgaoJudicial' ||
          key.startsWith('ret-')
        ) {
          delete newState[key];
        }
      });
      return newState;
    });

    // Fechar outros dropdowns e abrir/fechar o atual
    setDropdownOpen(prev => {
      const newState = {
        analista: false,
        tipoMidia: false,
        tipoDocumento: false,
        assunto: false,
        anoDocumento: false,
      };

      // Manter outros campos de pesquisa fechados
      Object.keys(prev).forEach(key => {
        if (key.startsWith('tipoPesquisa_')) {
          newState[key] = false;
        }
      });

      // Alternar o campo atual
      newState[field] = !isCurrentlyOpen;

      return newState;
    });

    // Se está abrindo, resetar índice
    if (!isCurrentlyOpen) {
      setSelectedIndex(prevIndex => ({
        ...prevIndex,
        [field]: -1,
      }));
    }
  };

  const handleAnalistaSelect = (analista: string) => {
    setFormData(prev => ({ ...prev, analista }));
    setDropdownOpen(prev => ({ ...prev, analista: false }));
    setSelectedIndex(prev => ({ ...prev, analista: -1 }));
    // Retornar foco para o trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="analista"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleTipoMidiaSelect = (tipo: string) => {
    setFormData(prev => ({ ...prev, tipoMidia: tipo }));
    setDropdownOpen(prev => ({ ...prev, tipoMidia: false }));
    setSelectedIndex(prev => ({ ...prev, tipoMidia: -1 }));
    // Retornar foco para o trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="tipoMidia"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleTipoPesquisaSelect = (index: number, tipo: string) => {
    const updatedPesquisas = [...formData.pesquisas];
    updatedPesquisas[index].tipo = tipo;
    setFormData(prev => ({ ...prev, pesquisas: updatedPesquisas }));
    const fieldKey = `tipoPesquisa_${index}`;
    setDropdownOpen(prev => ({ ...prev, [fieldKey]: false }));
    setSelectedIndex(prev => ({ ...prev, [fieldKey]: -1 }));
    // Retornar foco para o trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        `[data-dropdown="${fieldKey}"]`
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleTipoDocumentoSelect = (tipo: string) => {
    handleTipoDocumentoChange(tipo);
    setDropdownOpen(prev => ({ ...prev, tipoDocumento: false }));
    setSelectedIndex(prev => ({ ...prev, tipoDocumento: -1 }));

    // Retornar foco ao trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="tipoDocumento"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleAssuntoSelect = (assunto: string) => {
    handleAssuntoChange(assunto);
    setDropdownOpen(prev => ({ ...prev, assunto: false }));
    setSelectedIndex(prev => ({ ...prev, assunto: -1 }));

    // Retornar foco ao trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="assunto"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
  };

  const handleAnoDocumentoSelect = (ano: string) => {
    handleInputChange('anoDocumento', ano);
    setDropdownOpen(prev => ({ ...prev, anoDocumento: false }));
    setSelectedIndex(prev => ({ ...prev, anoDocumento: -1 }));

    // Retornar foco ao trigger
    setTimeout(() => {
      const trigger = document.querySelector(
        '[data-dropdown="anoDocumento"]'
      ) as HTMLElement;
      if (trigger) {
        trigger.focus();
      }
    }, 0);
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
      .map(v => v.trim())
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

    setFormData(prev => ({ ...prev, pesquisas: updatedPesquisas }));

    // Exibe notificação de sucesso
    showToastMsg(
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
    setRetificacoes(prev => [...prev, newRetificacao]);
  };

  // const removeRetificacao = (id: string) => {
  //   setRetificacoes(prev => prev.filter(ret => ret.id !== id));
  // };

  const updateRetificacao = (
    id: string,
    field: keyof RetificacaoItem,
    value: string | boolean
  ) => {
    setRetificacoes(prev =>
      prev.map(ret => (ret.id === id ? { ...ret, [field]: value } : ret))
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
        ret => ret.id === retificacaoId
      );
      if (currentIndex !== -1) {
        setRetificacoes(prev => prev.slice(0, currentIndex + 1));
      }
    }
  };

  // Função helper para mostrar Toast
  const showToastMsg = (
    message: string,
    type: 'success' | 'error' = 'error'
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Validação completa que simula comportamento HTML5
  const validateForm = (): boolean => {
    // Campos básicos obrigatórios
    if (!formData.tipoDocumento.trim()) {
      showToastMsg('Por favor, selecione o Tipo de Documento', 'error');
      // Focar no dropdown de tipo de documento
      const trigger = document.querySelector(
        '[data-dropdown="tipoDocumento"]'
      ) as HTMLElement;
      trigger?.focus();
      return false;
    }

    if (formData.tipoDocumento !== 'Mídia' && !formData.assunto.trim()) {
      showToastMsg('Por favor, selecione o Assunto', 'error');
      const trigger = document.querySelector(
        '[data-dropdown="assunto"]'
      ) as HTMLElement;
      trigger?.focus();
      return false;
    }

    if (formData.assunto === 'Outros' && !formData.assuntoOutros.trim()) {
      showToastMsg(
        'Por favor, especifique o assunto quando "Outros" é selecionado',
        'error'
      );
      return false;
    }

    // Validação de destinatário baseada no tipo
    if (formData.tipoDocumento === 'Ofício Circular') {
      if (formData.destinatarios.length === 0) {
        showToastMsg(
          'Por favor, selecione pelo menos um destinatário para Ofício Circular',
          'error'
        );
        return false;
      }
    } else {
      if (!formData.destinatario.trim()) {
        showToastMsg('Por favor, selecione o Destinatário', 'error');
        return false;
      }
    }

    if (!formData.enderecamento.trim()) {
      showToastMsg('Por favor, preencha o Endereçamento', 'error');
      return false;
    }

    if (!formData.numeroDocumento.trim()) {
      showToastMsg('Por favor, preencha o Número do Documento', 'error');
      return false;
    }

    if (!formData.anoDocumento.trim()) {
      showToastMsg('Por favor, preencha o Ano', 'error');
      return false;
    }

    if (!formData.analista.trim()) {
      showToastMsg('Por favor, selecione o Analista', 'error');
      const trigger = document.querySelector(
        '[data-dropdown="analista"]'
      ) as HTMLElement;
      trigger?.focus();
      return false;
    }

    // Validação das seções condicionais
    if (sectionRequired.section2) {
      if (!formData.autoridade.trim()) {
        showToastMsg('Por favor, preencha a Autoridade', 'error');
        return false;
      }
      if (!formData.orgaoJudicial.trim()) {
        showToastMsg('Por favor, preencha o Órgão Judicial', 'error');
        return false;
      }
      if (!formData.dataAssinatura.trim()) {
        showToastMsg('Por favor, preencha a Data da Assinatura', 'error');
        return false;
      }
    }

    if (sectionRequired.section3) {
      if (!formData.tipoMidia.trim()) {
        showToastMsg('Por favor, selecione o Tipo de Mídia', 'error');
        const trigger = document.querySelector(
          '[data-dropdown="tipoMidia"]'
        ) as HTMLElement;
        trigger?.focus();
        return false;
      }
      if (!formData.tamanhoMidia.trim()) {
        showToastMsg('Por favor, preencha o Tamanho da Mídia', 'error');
        return false;
      }
      if (!formData.hashMidia.trim()) {
        showToastMsg('Por favor, preencha o Hash', 'error');
        return false;
      }
      if (!formData.senhaMidia.trim()) {
        showToastMsg('Por favor, preencha a Senha de Acesso', 'error');
        return false;
      }
    }

    if (sectionRequired.section4) {
      if (formData.pesquisas.length === 0) {
        showToastMsg('Por favor, adicione pelo menos uma pesquisa', 'error');
        return false;
      }
      for (let i = 0; i < formData.pesquisas.length; i++) {
        const pesquisa = formData.pesquisas[i];
        if (!pesquisa.tipo.trim()) {
          showToastMsg(
            `Por favor, selecione o tipo de identificador na linha ${i + 1}`,
            'error'
          );
          return false;
        }
        if (!pesquisa.identificador.trim()) {
          showToastMsg(
            `Por favor, preencha o identificador da pesquisa na linha ${i + 1}`,
            'error'
          );
          return false;
        }
      }
    }

    return true;
  };

  // Submissão
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulário completo
    if (!validateForm()) {
      return;
    }

    // Preparar dados do documento
    const documentoData = {
      // ID será gerado automaticamente pelo contexto se for novo
      demandaId: parseInt(demandaId || demandaIdFromQuery || '1'),
      tipoDocumento: formData.tipoDocumento,
      assunto: formData.assunto,
      assuntoOutros: formData.assuntoOutros,
      // Para Ofício Circular, usar formato especial; senão usar campo normal
      destinatario:
        formData.tipoDocumento === 'Ofício Circular' &&
        formData.destinatarios.length > 0
          ? formatDestinatarios(formData.destinatarios)
          : formData.destinatario,
      enderecamento: formData.enderecamento,
      numeroDocumento: formData.numeroDocumento,
      anoDocumento: formData.anoDocumento,
      analista: formData.analista,
      autoridade: formData.autoridade,
      orgaoJudicial: formData.orgaoJudicial,
      dataAssinatura: formData.dataAssinatura,
      retificada: formData.retificada,
      retificacoes: retificacoes.map(ret => ({
        id: ret.id,
        autoridade: ret.autoridade,
        orgaoJudicial: ret.orgaoJudicial,
        dataAssinatura: ret.dataAssinatura,
        retificada: ret.retificada,
      })),
      tipoMidia: formData.tipoMidia,
      tamanhoMidia: formData.tamanhoMidia,
      hashMidia: formData.hashMidia,
      senhaMidia: formData.senhaMidia,
      pesquisas: formData.pesquisas,
      numeroAtena: '',
      codigoRastreio: '',
      naopossuiRastreio: false,
      dataEnvio: null,
      dataResposta: null,
      dataFinalizacao: null,
      apresentouDefeito: false,
      respondido: false,
      // Para Ofício Circular, criar/atualizar dados individuais por destinatário
      destinatariosData:
        formData.tipoDocumento === 'Ofício Circular' &&
        formData.destinatarios.length > 0
          ? formData.destinatarios.map(dest => {
              // Em modo de edição, preservar dados existentes se o destinatário já existia
              const documentoAtual =
                isEditMode && documentoId
                  ? getDocumento(parseInt(documentoId))
                  : null;
              const dadosExistentes = documentoAtual?.destinatariosData
                ? documentoAtual.destinatariosData.find(
                    d => d.nome === dest.nome
                  )
                : null;

              return {
                nome: dest.nome,
                dataEnvio: dadosExistentes?.dataEnvio || null,
                dataResposta: dadosExistentes?.dataResposta || null,
                codigoRastreio: dadosExistentes?.codigoRastreio || '',
                naopossuiRastreio: dadosExistentes?.naopossuiRastreio || false,
                respondido: dadosExistentes?.respondido || false,
              };
            })
          : undefined,
    };

    let documentoId_final: number;

    if (isEditMode && documentoId) {
      // Atualizar documento existente
      updateDocumento(parseInt(documentoId), documentoData);
      documentoId_final = parseInt(documentoId);
    } else {
      // Criar novo documento
      const novoDocumento = addDocumento(documentoData);
      documentoId_final = novoDocumento.id;
    }

    setDocumentSaved(true);
    const message = isEditMode
      ? 'Documento atualizado com sucesso!'
      : 'Documento criado com sucesso!';
    showToastMsg(message, 'success');

    // Navegar para a página de detalhe do documento após salvar
    setTimeout(() => {
      // Preservar parâmetros de retorno se existirem
      const returnTo = searchParams.get('returnTo');
      const demandaIdParam = searchParams.get('demandaId');
      let queryString = '';

      if (returnTo && demandaIdParam) {
        queryString = `?returnTo=${returnTo}&demandaId=${demandaIdParam}`;
      }

      navigate(`/documentos/${documentoId_final}${queryString}`);
    }, 1500); // Aguarda 1.5s para mostrar a mensagem de sucesso
  };

  // Função para formatar destinatários selecionados
  const formatDestinatarios = (destinatarios: MultiSelectOption[]): string => {
    if (destinatarios.length === 0) return '';
    if (destinatarios.length === 1) return destinatarios[0].nome;

    const nomes = destinatarios.map(d => d.nome);
    const ultimoNome = nomes.pop();
    return `${nomes.join(', ')} e ${ultimoNome}`;
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
            {isEditMode ? 'Editar Documento' : 'Novo Documento'} - SGED{' '}
            {demandaId || demandaIdFromQuery || '23412'}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
              />
            </svg>
            Voltar
          </button>
        </div>

        <div className={styles.formContent}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Seção 1 - Informações do Documento */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderLeft}>
                  <span className={styles.sectionIcon}>01</span>
                  <h2 className={styles.sectionTitle}>
                    Informações do Documento
                  </h2>
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
                      Tipo de Documento{' '}
                      <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.customDropdownContainer}>
                      <div
                        className={`${styles.customDropdownTrigger} ${dropdownOpen.tipoDocumento ? styles.customDropdownTriggerOpen : ''}`}
                        tabIndex={0}
                        data-dropdown="tipoDocumento"
                        onKeyDown={e => {
                          if (
                            dropdownOpen.tipoDocumento &&
                            e.key === 'Enter' &&
                            selectedIndex.tipoDocumento >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            const options = [
                              '',
                              ...mockTiposDocumentos.map(t => t.nome),
                            ];
                            if (selectedIndex.tipoDocumento < options.length) {
                              handleTipoDocumentoSelect(
                                options[selectedIndex.tipoDocumento]
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            e.stopPropagation();
                            toggleDropdown('tipoDocumento');
                          } else if (
                            e.key === 'ArrowDown' ||
                            e.key === 'ArrowUp'
                          ) {
                            // Navegação por setas - abre dropdown se fechado, navega se aberto
                            e.preventDefault();
                            if (!dropdownOpen.tipoDocumento) {
                              // Se dropdown fechado, abrir e ir para primeiro item
                              toggleDropdown('tipoDocumento');
                              setSelectedIndex(prev => ({
                                ...prev,
                                tipoDocumento: 0,
                              }));
                            } else {
                              // Se dropdown aberto, navegar
                              const currentIndex =
                                selectedIndex.tipoDocumento ?? -1;
                              const options = [
                                '',
                                ...mockTiposDocumentos.map(t => t.nome),
                              ];
                              let nextIndex;

                              if (e.key === 'ArrowDown') {
                                nextIndex =
                                  currentIndex < options.length - 1
                                    ? currentIndex + 1
                                    : currentIndex;
                              } else {
                                nextIndex =
                                  currentIndex > 0
                                    ? currentIndex - 1
                                    : currentIndex;
                              }

                              setSelectedIndex(prev => ({
                                ...prev,
                                tipoDocumento: nextIndex,
                              }));
                              scrollToDropdownItem('tipoDocumento', nextIndex);
                            }
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao pressionar Tab
                            setDropdownOpen(prev => ({
                              ...prev,
                              tipoDocumento: false,
                            }));
                          }
                        }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDropdown('tipoDocumento');
                        }}
                      >
                        <span className={styles.customDropdownValue}>
                          {formData.tipoDocumento || ''}
                        </span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.tipoDocumento ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.tipoDocumento && (
                        <div className={styles.multiSelectDropdown}>
                          {/* Primeira opção em branco */}
                          <label
                            key="empty"
                            className={`${styles.checkboxLabel} ${
                              selectedIndex.tipoDocumento === 0
                                ? styles.checkboxLabelFocused
                                : ''
                            }`}
                            onClick={() => handleTipoDocumentoSelect('')}
                          >
                            <span className={styles.checkboxText}>&nbsp;</span>
                          </label>
                          {mockTiposDocumentos.map((tipo, index) => (
                            <label
                              key={tipo.id}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.tipoDocumento === index + 1
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() =>
                                handleTipoDocumentoSelect(tipo.nome)
                              }
                            >
                              <span className={styles.checkboxText}>
                                {tipo.nome}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.tipoDocumento !== 'Mídia' && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Assunto <span className={styles.required}>*</span>
                      </label>
                      <div className={styles.assuntoWrapper}>
                        <div className={styles.customDropdownContainer}>
                          <div
                            className={`${styles.customDropdownTrigger} ${dropdownOpen.assunto ? styles.customDropdownTriggerOpen : ''} ${!formData.tipoDocumento ? styles.customDropdownDisabled : ''}`}
                            tabIndex={formData.tipoDocumento ? 0 : -1}
                            data-dropdown="assunto"
                            onKeyDown={e => {
                              if (!formData.tipoDocumento) return;

                              if (
                                dropdownOpen.assunto &&
                                e.key === 'Enter' &&
                                selectedIndex.assunto >= 0
                              ) {
                                // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                                e.preventDefault();
                                e.stopPropagation();
                                const options = [
                                  '',
                                  ...(documentoAssuntoConfig[
                                    formData.tipoDocumento
                                  ] || []),
                                ];
                                if (selectedIndex.assunto < options.length) {
                                  handleAssuntoSelect(
                                    options[selectedIndex.assunto]
                                  );
                                }
                              } else if (e.key === 'Enter' || e.key === ' ') {
                                // Caso contrário, abrir/fechar dropdown
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDropdown('assunto');
                              } else if (
                                e.key === 'ArrowDown' ||
                                e.key === 'ArrowUp'
                              ) {
                                // Navegação por setas - abre dropdown se fechado, navega se aberto
                                e.preventDefault();
                                if (!dropdownOpen.assunto) {
                                  // Se dropdown fechado, abrir e ir para primeiro item
                                  toggleDropdown('assunto');
                                  setSelectedIndex(prev => ({
                                    ...prev,
                                    assunto: 0,
                                  }));
                                } else {
                                  // Se dropdown aberto, navegar
                                  const currentIndex =
                                    selectedIndex.assunto ?? -1;
                                  const options = [
                                    '',
                                    ...(documentoAssuntoConfig[
                                      formData.tipoDocumento
                                    ] || []),
                                  ];
                                  let nextIndex;

                                  if (e.key === 'ArrowDown') {
                                    nextIndex =
                                      currentIndex < options.length - 1
                                        ? currentIndex + 1
                                        : currentIndex;
                                  } else {
                                    nextIndex =
                                      currentIndex > 0
                                        ? currentIndex - 1
                                        : currentIndex;
                                  }

                                  setSelectedIndex(prev => ({
                                    ...prev,
                                    assunto: nextIndex,
                                  }));
                                  scrollToDropdownItem('assunto', nextIndex);
                                }
                              } else if (e.key === 'Tab') {
                                // Fechar dropdown ao pressionar Tab
                                setDropdownOpen(prev => ({
                                  ...prev,
                                  assunto: false,
                                }));
                              }
                            }}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (formData.tipoDocumento) {
                                toggleDropdown('assunto');
                              }
                            }}
                          >
                            <span className={styles.customDropdownValue}>
                              {formData.assunto ||
                                (formData.tipoDocumento
                                  ? ''
                                  : 'Selecione primeiro o tipo de documento')}
                            </span>
                            <span className={styles.dropdownArrow}>
                              {dropdownOpen.assunto ? '▲' : '▼'}
                            </span>
                          </div>
                          {dropdownOpen.assunto && formData.tipoDocumento && (
                            <div className={styles.multiSelectDropdown}>
                              {/* Primeira opção em branco */}
                              <label
                                key="empty"
                                className={`${styles.checkboxLabel} ${
                                  selectedIndex.assunto === 0
                                    ? styles.checkboxLabelFocused
                                    : ''
                                }`}
                                onClick={() => handleAssuntoSelect('')}
                              >
                                <span className={styles.checkboxText}>
                                  &nbsp;
                                </span>
                              </label>
                              {(
                                documentoAssuntoConfig[
                                  formData.tipoDocumento
                                ] || []
                              ).map((assunto, index) => (
                                <label
                                  key={assunto}
                                  className={`${styles.checkboxLabel} ${
                                    selectedIndex.assunto === index + 1
                                      ? styles.checkboxLabelFocused
                                      : ''
                                  }`}
                                  onClick={() => handleAssuntoSelect(assunto)}
                                >
                                  <span className={styles.checkboxText}>
                                    {assunto}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {formData.assunto === 'Outros' && (
                          <input
                            type="text"
                            value={formData.assuntoOutros}
                            onChange={e =>
                              handleInputChange('assuntoOutros', e.target.value)
                            }
                            className={styles.formInput}
                            placeholder="Especifique o assunto"
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

                    {/* Renderização condicional baseada no tipo de documento */}
                    {formData.tipoDocumento === 'Ofício Circular' ? (
                      // Multi-seleção para Ofício Circular
                      <MultiSelectDropdown
                        options={destinatariosOptions}
                        selectedValues={formData.destinatarios}
                        onChange={selected =>
                          handleInputChange('destinatarios', selected)
                        }
                        placeholder="Selecione os destinatários..."
                        searchPlaceholder="Filtrar destinatários..."
                      />
                    ) : (
                      // Input normal para outros tipos de documento
                      <div
                        className={styles.searchContainer}
                        data-field="destinatario"
                      >
                        <input
                          type="text"
                          value={formData.destinatario}
                          onChange={e => {
                            handleInputChange('destinatario', e.target.value);
                            handleSearch('destinatario', e.target.value);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'destinatario', value =>
                              selectSearchResult('destinatario', value)
                            )
                          }
                          onFocus={() =>
                            closeOtherSearchResults('destinatario')
                          }
                          className={styles.formInput}
                          placeholder="Digite para pesquisar..."
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
                    )}
                  </div>
                </div>

                <div className={styles.formGrid1}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Endereçamento <span className={styles.required}>*</span>
                    </label>

                    {/* Para Ofício Circular, campo pré-preenchido e readonly */}
                    {formData.tipoDocumento === 'Ofício Circular' ? (
                      <input
                        type="text"
                        value="Respectivos departamentos jurídicos"
                        className={styles.formInput}
                        style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                        readOnly
                        required
                      />
                    ) : (
                      // Campo normal para outros tipos de documento
                      <div
                        className={styles.searchContainer}
                        data-field="enderecamento"
                      >
                        <input
                          type="text"
                          value={formData.enderecamento}
                          onChange={e => {
                            handleInputChange('enderecamento', e.target.value);
                            handleSearch('enderecamento', e.target.value);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'enderecamento', value =>
                              selectSearchResult('enderecamento', value)
                            )
                          }
                          onFocus={() =>
                            closeOtherSearchResults('enderecamento')
                          }
                          className={styles.formInput}
                          placeholder={
                            formData.destinatario
                              ? 'Digite para pesquisar...'
                              : 'Selecione primeiro um destinatário'
                          }
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
                    )}
                  </div>
                </div>

                <div className={styles.formGridCustom}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Número do Documento{' '}
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.numeroDocumento}
                      onChange={e =>
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
                    <div className={styles.customDropdownContainer}>
                      <div
                        className={`${styles.customDropdownTrigger} ${dropdownOpen.anoDocumento ? styles.customDropdownTriggerOpen : ''}`}
                        tabIndex={0}
                        data-dropdown="anoDocumento"
                        onKeyDown={e => {
                          if (
                            dropdownOpen.anoDocumento &&
                            e.key === 'Enter' &&
                            selectedIndex.anoDocumento >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            const options = [
                              '',
                              ...generateYears().map(y => y.toString()),
                            ];
                            if (selectedIndex.anoDocumento < options.length) {
                              handleAnoDocumentoSelect(
                                options[selectedIndex.anoDocumento]
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            e.stopPropagation();
                            toggleDropdown('anoDocumento');
                          } else if (
                            e.key === 'ArrowDown' ||
                            e.key === 'ArrowUp'
                          ) {
                            // Navegação por setas - abre dropdown se fechado, navega se aberto
                            e.preventDefault();
                            if (!dropdownOpen.anoDocumento) {
                              // Se dropdown fechado, abrir e ir para primeiro item
                              toggleDropdown('anoDocumento');
                              setSelectedIndex(prev => ({
                                ...prev,
                                anoDocumento: 0,
                              }));
                            } else {
                              // Se dropdown aberto, navegar
                              const currentIndex =
                                selectedIndex.anoDocumento ?? -1;
                              const options = [
                                '',
                                ...generateYears().map(y => y.toString()),
                              ];
                              let nextIndex;

                              if (e.key === 'ArrowDown') {
                                nextIndex =
                                  currentIndex < options.length - 1
                                    ? currentIndex + 1
                                    : currentIndex;
                              } else {
                                nextIndex =
                                  currentIndex > 0
                                    ? currentIndex - 1
                                    : currentIndex;
                              }

                              setSelectedIndex(prev => ({
                                ...prev,
                                anoDocumento: nextIndex,
                              }));
                              scrollToDropdownItem('anoDocumento', nextIndex);
                            }
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao pressionar Tab
                            setDropdownOpen(prev => ({
                              ...prev,
                              anoDocumento: false,
                            }));
                          }
                        }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDropdown('anoDocumento');
                        }}
                      >
                        <span className={styles.customDropdownValue}>
                          {formData.anoDocumento || ''}
                        </span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.anoDocumento ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.anoDocumento && (
                        <div className={styles.multiSelectDropdown}>
                          {/* Primeira opção em branco */}
                          <label
                            key="empty"
                            className={`${styles.checkboxLabel} ${
                              selectedIndex.anoDocumento === 0
                                ? styles.checkboxLabelFocused
                                : ''
                            }`}
                            onClick={() => handleAnoDocumentoSelect('')}
                          >
                            <span className={styles.checkboxText}>&nbsp;</span>
                          </label>
                          {generateYears().map((year, index) => (
                            <label
                              key={year}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.anoDocumento === index + 1
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() =>
                                handleAnoDocumentoSelect(year.toString())
                              }
                            >
                              <span className={styles.checkboxText}>
                                {year}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Analista <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.customDropdownContainer}>
                      <div
                        className={`${styles.customDropdownTrigger} ${dropdownOpen.analista ? styles.customDropdownTriggerOpen : ''}`}
                        onClick={() => toggleDropdown('analista')}
                        tabIndex={0}
                        data-dropdown="analista"
                        onKeyDown={e => {
                          if (
                            dropdownOpen.analista &&
                            e.key === 'Enter' &&
                            selectedIndex.analista >= 0
                          ) {
                            // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedIndex.analista < analistas.length) {
                              handleAnalistaSelect(
                                analistas[selectedIndex.analista]
                              );
                            }
                          } else if (e.key === 'Enter' || e.key === ' ') {
                            // Caso contrário, abrir/fechar dropdown
                            e.preventDefault();
                            if (!dropdownOpen.analista) {
                              e.stopPropagation();
                            }
                            toggleDropdown('analista');
                          } else if (
                            dropdownOpen.analista &&
                            (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                          ) {
                            // Navegação por setas quando dropdown está aberto
                            e.preventDefault();
                            const currentIndex = selectedIndex.analista ?? -1;
                            let nextIndex;

                            if (e.key === 'ArrowDown') {
                              nextIndex =
                                currentIndex === -1
                                  ? 0
                                  : currentIndex < analistas.length - 1
                                    ? currentIndex + 1
                                    : currentIndex;
                            } else {
                              nextIndex =
                                currentIndex === -1
                                  ? 0
                                  : currentIndex > 0
                                    ? currentIndex - 1
                                    : currentIndex;
                            }

                            setSelectedIndex(prev => ({
                              ...prev,
                              analista: nextIndex,
                            }));
                            scrollToDropdownItem('analista', nextIndex);
                          } else if (e.key === 'Tab') {
                            // Fechar dropdown ao pressionar Tab
                            setDropdownOpen(prev => ({
                              ...prev,
                              analista: false,
                            }));
                          }
                        }}
                      >
                        <span className={styles.customDropdownValue}>
                          {formData.analista || ''}
                        </span>
                        <span className={styles.dropdownArrow}>
                          {dropdownOpen.analista ? '▲' : '▼'}
                        </span>
                      </div>
                      {dropdownOpen.analista && (
                        <div className={styles.multiSelectDropdown}>
                          {analistas.map((analista, index) => (
                            <label
                              key={analista}
                              className={`${styles.checkboxLabel} ${
                                selectedIndex.analista === index
                                  ? styles.checkboxLabelFocused
                                  : ''
                              }`}
                              onClick={() => handleAnalistaSelect(analista)}
                            >
                              <span className={styles.checkboxText}>
                                {analista}
                              </span>
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
                        Autoridade{' '}
                        {sectionRequired.section2 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <div
                        className={styles.searchContainer}
                        data-field="autoridade"
                      >
                        <input
                          type="text"
                          value={formData.autoridade}
                          onChange={e => {
                            handleInputChange('autoridade', e.target.value);
                            handleSearch('autoridade', e.target.value);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'autoridade', value =>
                              selectSearchResult('autoridade', value)
                            )
                          }
                          onFocus={() => closeOtherSearchResults('autoridade')}
                          className={styles.formInput}
                          placeholder="Digite para pesquisar..."
                          required={sectionRequired.section2}
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
                        Órgão Judicial{' '}
                        {sectionRequired.section2 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <div
                        className={styles.searchContainer}
                        data-field="orgaoJudicial"
                      >
                        <input
                          type="text"
                          value={formData.orgaoJudicial}
                          onChange={e => {
                            handleInputChange('orgaoJudicial', e.target.value);
                            handleSearch('orgaoJudicial', e.target.value);
                          }}
                          onKeyDown={e =>
                            handleKeyDown(e, 'orgaoJudicial', value =>
                              selectSearchResult('orgaoJudicial', value)
                            )
                          }
                          onFocus={() =>
                            closeOtherSearchResults('orgaoJudicial')
                          }
                          className={styles.formInput}
                          placeholder="Digite para pesquisar..."
                          required={sectionRequired.section2}
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
                        {sectionRequired.section2 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <div className={styles.dateInputWrapper}>
                        <input
                          type="text"
                          value={formData.dataAssinatura}
                          onChange={e =>
                            handleDateChange('dataAssinatura', e.target.value)
                          }
                          className={styles.formInput}
                          placeholder="dd/mm/aaaa"
                          maxLength={10}
                          required={sectionRequired.section2}
                        />
                        <input
                          type="date"
                          value={convertToHTMLDate(formData.dataAssinatura)}
                          onChange={e =>
                            handleCalendarChange(
                              'dataAssinatura',
                              e.target.value
                            )
                          }
                          className={styles.hiddenDateInput}
                          tabIndex={-1}
                        />
                        <button
                          type="button"
                          className={styles.calendarButton}
                          tabIndex={-1}
                          onClick={e => {
                            const wrapper = e.currentTarget.parentElement;
                            const dateInput = wrapper?.querySelector(
                              'input[type="date"]'
                            ) as HTMLInputElement;
                            if (dateInput && dateInput.showPicker) {
                              dateInput.showPicker();
                            }
                          }}
                          title="Abrir calendário"
                        >
                          📅
                        </button>
                      </div>
                    </div>

                    <div className={`${styles.formGroup} ${styles.flexCenter}`}>
                      <div className={styles.checkboxGroup}>
                        <input
                          type="checkbox"
                          id="retificada"
                          checked={formData.retificada}
                          onChange={e => {
                            handleInputChange('retificada', e.target.checked);
                            if (e.target.checked && retificacoes.length === 0) {
                              addRetificacao();
                            } else if (!e.target.checked) {
                              setRetificacoes([]);
                            }
                          }}
                          className={styles.checkboxInput}
                        />
                        <label className={styles.retificadaLabel}>
                          Retificada
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Seções de Retificação */}
                  {retificacoes.map((retificacao, index) => (
                    <div
                      key={retificacao.id}
                      className={styles.retificacaoSection}
                    >
                      <div className={styles.retificacaoHeader}>
                        <span>Decisão Retificadora {index + 1}</span>
                      </div>

                      <div className={styles.sectionContent}>
                        <div className={styles.formGrid1}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Autoridade{' '}
                              {sectionVisibility.section2 && (
                                <span className={styles.required}>*</span>
                              )}
                            </label>
                            <div
                              className={styles.searchContainer}
                              data-field={`ret-autoridade-${retificacao.id}`}
                            >
                              <input
                                type="text"
                                value={retificacao.autoridade}
                                onChange={e => {
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
                                onKeyDown={e =>
                                  handleKeyDown(
                                    e,
                                    `ret-autoridade-${retificacao.id}`,
                                    value =>
                                      selectRetificacaoSearchResult(
                                        retificacao.id,
                                        'autoridade',
                                        value
                                      )
                                  )
                                }
                                onFocus={() =>
                                  closeOtherSearchResults(
                                    `ret-autoridade-${retificacao.id}`
                                  )
                                }
                                className={styles.formInput}
                                placeholder="Digite para pesquisar..."
                                autoComplete="off"
                                required={sectionRequired.section2}
                              />
                              {showResults[
                                `ret-autoridade-${retificacao.id}`
                              ] && (
                                <div className={styles.searchResults}>
                                  {searchResults[
                                    `ret-autoridade-${retificacao.id}`
                                  ]?.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className={`${styles.searchResultItem} ${
                                        (selectedIndex[
                                          `ret-autoridade-${retificacao.id}`
                                        ] ?? -1) === idx
                                          ? styles.searchResultItemSelected
                                          : ''
                                      }`}
                                      onClick={() => {
                                        selectRetificacaoSearchResult(
                                          retificacao.id,
                                          'autoridade',
                                          item
                                        );
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
                              {sectionVisibility.section2 && (
                                <span className={styles.required}>*</span>
                              )}
                            </label>
                            <div
                              className={styles.searchContainer}
                              data-field={`ret-orgao-${retificacao.id}`}
                            >
                              <input
                                type="text"
                                value={retificacao.orgaoJudicial}
                                onChange={e => {
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
                                onKeyDown={e =>
                                  handleKeyDown(
                                    e,
                                    `ret-orgao-${retificacao.id}`,
                                    value =>
                                      selectRetificacaoSearchResult(
                                        retificacao.id,
                                        'orgaoJudicial',
                                        value
                                      )
                                  )
                                }
                                onFocus={() =>
                                  closeOtherSearchResults(
                                    `ret-orgao-${retificacao.id}`
                                  )
                                }
                                className={styles.formInput}
                                placeholder="Digite para pesquisar..."
                                autoComplete="off"
                                required={sectionRequired.section2}
                              />
                              {showResults[`ret-orgao-${retificacao.id}`] && (
                                <div className={styles.searchResults}>
                                  {searchResults[
                                    `ret-orgao-${retificacao.id}`
                                  ]?.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className={`${styles.searchResultItem} ${
                                        (selectedIndex[
                                          `ret-orgao-${retificacao.id}`
                                        ] ?? -1) === idx
                                          ? styles.searchResultItemSelected
                                          : ''
                                      }`}
                                      onClick={() => {
                                        selectRetificacaoSearchResult(
                                          retificacao.id,
                                          'orgaoJudicial',
                                          item
                                        );
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

                        <div className={styles.formGrid2}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Data da Assinatura{' '}
                              {sectionVisibility.section2 && (
                                <span className={styles.required}>*</span>
                              )}
                            </label>
                            <div className={styles.dateInputWrapper}>
                              <input
                                type="text"
                                value={retificacao.dataAssinatura}
                                onChange={e =>
                                  handleRetificacaoDateChange(
                                    retificacao.id,
                                    e.target.value
                                  )
                                }
                                className={styles.formInput}
                                placeholder="dd/mm/aaaa"
                                maxLength={10}
                                required={sectionRequired.section2}
                              />
                              <input
                                type="date"
                                value={convertToHTMLDate(
                                  retificacao.dataAssinatura
                                )}
                                onChange={e =>
                                  handleRetificacaoCalendarChange(
                                    retificacao.id,
                                    e.target.value
                                  )
                                }
                                className={styles.hiddenDateInput}
                                tabIndex={-1}
                              />
                              <button
                                type="button"
                                className={styles.calendarButton}
                                tabIndex={-1}
                                onClick={e => {
                                  const wrapper = e.currentTarget.parentElement;
                                  const dateInput = wrapper?.querySelector(
                                    'input[type="date"]'
                                  ) as HTMLInputElement;
                                  if (dateInput && dateInput.showPicker) {
                                    dateInput.showPicker();
                                  }
                                }}
                                title="Abrir calendário"
                              >
                                📅
                              </button>
                            </div>
                          </div>

                          <div
                            className={`${styles.formGroup} ${styles.flexCenter}`}
                          >
                            <div className={styles.checkboxGroup}>
                              <input
                                type="checkbox"
                                id={`retificada-${retificacao.id}`}
                                checked={retificacao.retificada}
                                onChange={e =>
                                  handleRetificacaoCheckboxChange(
                                    retificacao.id,
                                    e.target.checked
                                  )
                                }
                                className={styles.checkboxInput}
                              />
                              <label className={styles.retificadaLabel}>
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
                        Tipo de Mídia{' '}
                        {sectionRequired.section3 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <div className={styles.customDropdownContainer}>
                        <div
                          className={`${styles.customDropdownTrigger} ${dropdownOpen.tipoMidia ? styles.customDropdownTriggerOpen : ''}`}
                          onClick={() => toggleDropdown('tipoMidia')}
                          tabIndex={0}
                          data-dropdown="tipoMidia"
                          onKeyDown={e => {
                            if (
                              dropdownOpen.tipoMidia &&
                              e.key === 'Enter' &&
                              selectedIndex.tipoMidia >= 0
                            ) {
                              // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                selectedIndex.tipoMidia < mockTiposMidias.length
                              ) {
                                handleTipoMidiaSelect(
                                  mockTiposMidias[selectedIndex.tipoMidia].nome
                                );
                              }
                            } else if (e.key === 'Enter' || e.key === ' ') {
                              // Caso contrário, abrir/fechar dropdown
                              e.preventDefault();
                              if (!dropdownOpen.tipoMidia) {
                                e.stopPropagation();
                              }
                              toggleDropdown('tipoMidia');
                            } else if (
                              dropdownOpen.tipoMidia &&
                              (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                            ) {
                              // Navegação por setas quando dropdown está aberto
                              e.preventDefault();
                              const currentIndex =
                                selectedIndex.tipoMidia ?? -1;
                              let nextIndex;

                              if (e.key === 'ArrowDown') {
                                nextIndex =
                                  currentIndex === -1
                                    ? 0
                                    : currentIndex < mockTiposMidias.length - 1
                                      ? currentIndex + 1
                                      : currentIndex;
                              } else {
                                nextIndex =
                                  currentIndex === -1
                                    ? 0
                                    : currentIndex > 0
                                      ? currentIndex - 1
                                      : currentIndex;
                              }

                              setSelectedIndex(prev => ({
                                ...prev,
                                tipoMidia: nextIndex,
                              }));
                              scrollToDropdownItem('tipoMidia', nextIndex);
                            } else if (e.key === 'Tab') {
                              // Fechar dropdown ao pressionar Tab
                              setDropdownOpen(prev => ({
                                ...prev,
                                tipoMidia: false,
                              }));
                            }
                          }}
                        >
                          <span className={styles.customDropdownValue}>
                            {formData.tipoMidia || ''}
                          </span>
                          <span className={styles.dropdownArrow}>
                            {dropdownOpen.tipoMidia ? '▲' : '▼'}
                          </span>
                        </div>
                        {dropdownOpen.tipoMidia && (
                          <div className={styles.multiSelectDropdown}>
                            {mockTiposMidias.map((tipo, index) => (
                              <label
                                key={tipo.id}
                                className={`${styles.checkboxLabel} ${
                                  selectedIndex.tipoMidia === index
                                    ? styles.checkboxLabelFocused
                                    : ''
                                }`}
                                onClick={() => handleTipoMidiaSelect(tipo.nome)}
                              >
                                <span className={styles.checkboxText}>
                                  {tipo.nome}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Tamanho (MB){' '}
                        {sectionRequired.section3 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formatTamanhoMidia(formData.tamanhoMidia)}
                        onChange={e => handleTamanhoMidiaChange(e.target.value)}
                        className={styles.formInput}
                        required={sectionRequired.section3}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Hash{' '}
                        {sectionRequired.section3 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.hashMidia}
                        onChange={e =>
                          handleInputChange('hashMidia', e.target.value)
                        }
                        className={styles.formInput}
                        required={sectionRequired.section3}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Senha de Acesso{' '}
                        {sectionRequired.section3 && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.senhaMidia}
                        onChange={e =>
                          handleInputChange('senhaMidia', e.target.value)
                        }
                        className={styles.formInput}
                        required={sectionRequired.section3}
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
                            Tipo{' '}
                            {sectionRequired.section4 && (
                              <span className={styles.required}>*</span>
                            )}
                          </label>
                          <div className={styles.customDropdownContainer}>
                            <div
                              className={`${styles.customDropdownTrigger} ${dropdownOpen[`tipoPesquisa_${index}`] ? styles.customDropdownTriggerOpen : ''}`}
                              onClick={() =>
                                toggleDropdown(`tipoPesquisa_${index}`)
                              }
                              tabIndex={0}
                              data-dropdown={`tipoPesquisa_${index}`}
                              onKeyDown={e => {
                                const fieldKey = `tipoPesquisa_${index}`;
                                if (
                                  dropdownOpen[fieldKey] &&
                                  e.key === 'Enter' &&
                                  (selectedIndex[fieldKey] ?? -1) >= 0
                                ) {
                                  // Se dropdown está aberto, Enter e há item selecionado = SELECIONAR
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const selectedIdx =
                                    selectedIndex[fieldKey] ?? -1;
                                  if (selectedIdx < tiposPesquisa.length) {
                                    handleTipoPesquisaSelect(
                                      index,
                                      tiposPesquisa[selectedIdx].value
                                    );
                                  }
                                } else if (e.key === 'Enter' || e.key === ' ') {
                                  // Caso contrário, abrir/fechar dropdown
                                  e.preventDefault();
                                  if (!dropdownOpen[fieldKey]) {
                                    e.stopPropagation();
                                  }
                                  toggleDropdown(fieldKey);
                                } else if (
                                  dropdownOpen[fieldKey] &&
                                  (e.key === 'ArrowDown' || e.key === 'ArrowUp')
                                ) {
                                  // Navegação por setas quando dropdown está aberto
                                  e.preventDefault();
                                  const currentIndex =
                                    selectedIndex[fieldKey] ?? -1;
                                  let nextIndex;

                                  if (e.key === 'ArrowDown') {
                                    nextIndex =
                                      currentIndex === -1
                                        ? 0
                                        : currentIndex <
                                            tiposPesquisa.length - 1
                                          ? currentIndex + 1
                                          : currentIndex;
                                  } else {
                                    nextIndex =
                                      currentIndex === -1
                                        ? 0
                                        : currentIndex > 0
                                          ? currentIndex - 1
                                          : currentIndex;
                                  }

                                  setSelectedIndex(prev => ({
                                    ...prev,
                                    [fieldKey]: nextIndex,
                                  }));
                                  scrollToDropdownItem(fieldKey, nextIndex);
                                } else if (e.key === 'Tab') {
                                  // Fechar dropdown ao pressionar Tab
                                  setDropdownOpen(prev => ({
                                    ...prev,
                                    [fieldKey]: false,
                                  }));
                                }
                              }}
                            >
                              <span className={styles.customDropdownValue}>
                                {tiposPesquisa.find(
                                  t => t.value === pesquisa.tipo
                                )?.label || ''}
                              </span>
                              <span className={styles.dropdownArrow}>
                                {dropdownOpen[`tipoPesquisa_${index}`]
                                  ? '▲'
                                  : '▼'}
                              </span>
                            </div>
                            {dropdownOpen[`tipoPesquisa_${index}`] && (
                              <div className={styles.multiSelectDropdown}>
                                {tiposPesquisa.map((tipo, tipoIndex) => (
                                  <label
                                    key={tipo.value}
                                    className={`${styles.checkboxLabel} ${
                                      selectedIndex[`tipoPesquisa_${index}`] ===
                                      tipoIndex
                                        ? styles.checkboxLabelFocused
                                        : ''
                                    }`}
                                    onClick={() =>
                                      handleTipoPesquisaSelect(
                                        index,
                                        tipo.value
                                      )
                                    }
                                  >
                                    <span className={styles.checkboxText}>
                                      {tipo.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            Identificador{' '}
                            {sectionRequired.section4 && (
                              <span className={styles.required}>*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={pesquisa.identificador}
                            onChange={e =>
                              updatePesquisa(
                                index,
                                'identificador',
                                e.target.value
                              )
                            }
                            onPaste={e => handlePasteMultipleValues(e, index)}
                            className={styles.formInput}
                            required={sectionRequired.section4}
                          />
                        </div>

                        {pesquisa.complementar !== undefined && (
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Complementar{' '}
                              {sectionVisibility.section2 && (
                                <span className={styles.required}>*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={pesquisa.complementar}
                              onChange={e =>
                                updatePesquisa(
                                  index,
                                  'complementar',
                                  e.target.value
                                )
                              }
                              className={styles.formInput}
                              required={sectionRequired.section2}
                            />
                          </div>
                        )}

                        <div className={styles.pesquisaControls}>
                          <button
                            type="button"
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
                      type="button"
                      onClick={removePesquisa}
                      className={styles.btnRemove}
                      title="Remover última linha"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={addPesquisa}
                      className={styles.btnAdd}
                      title="Adicionar linha"
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
                type="submit"
                disabled={documentSaved}
                className={styles.btnSubmit}
              >
                {isEditMode ? 'Salvar Alterações' : 'Criar Documento'}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Toast de Validação */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
