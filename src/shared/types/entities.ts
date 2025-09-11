/**
 * DEFINIÇÕES DE TIPOS DE ENTIDADES DO DOMÍNIO
 *
 * Este módulo define todas as interfaces TypeScript para as entidades principais do sistema.
 * Inclui definições para:
 * - Interfaces base para reutilização (BaseEntity, SimpleEntity)
 * - Entidades principais do domínio (Demanda, Orgao, Provedor, etc.)
 * - Entidades de cadastro auxiliares (Assunto, TipoDocumento, etc.)
 * - Tipos união para categorização de entidades
 * - Estruturas padronizadas com campos obrigatórios e opcionais
 * - Tipagem forte para garantir consistência de dados
 */

// Interface base para todas as entidades
/**
 * Interface base que define a estrutura fundamental para todas as entidades do sistema
 * Garante que toda entidade possua um identificador único numérico
 */
export interface BaseEntity {
  id: number;
}

// Interface simples para entidades que possuem apenas nome
/**
 * Interface para entidades simples que possuem apenas identificador e nome
 * Usada para cadastros básicos como assuntos, tipos, etc.
 */
export interface SimpleEntity extends BaseEntity {
  nome: string;
}

// Entidades do domínio principal
/**
 * Interface principal para demandas do sistema
 * Representa uma demanda investigativa com todos os campos necessários
 * para controle e acompanhamento de processos administrativos ou judiciais
 */
export interface Demanda extends BaseEntity {
  sged: string;
  tipoDemanda: string;
  autosAdministrativos?: string;
  pic?: string;
  autosJudiciais?: string;
  autosExtrajudiciais?: string;
  alvos: string | number;
  identificadores: string | number;
  distribuidor: string;
  descricao: string;
  orgao: string;
  status: 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';
  analista: string;
  dataInicial: string; // Formato: YYYY-MM-DD
  dataFinal: string | null;
  dataReabertura?: string | null; // Formato: YYYY-MM-DD
  novaDataFinal?: string | null; // Formato: YYYY-MM-DD
}

/**
 * Interface para assuntos de documentos
 * Define categorias temáticas para classificação de documentos no sistema
 */
export interface Assunto extends SimpleEntity {
  descricao?: string;
}

/**
 * Interface para tipos de demanda
 * Categoriza diferentes tipos de demandas que podem ser processadas no sistema
 */
export interface TipoDemanda extends SimpleEntity {
  descricao?: string;
}

/**
 * Interface para tipos de documento
 * Define categorias para classificação de diferentes tipos documentais
 */
export interface TipoDocumento extends SimpleEntity {
  descricao?: string;
}

/**
 * Interface para tipos de identificador
 * Define formatos de identificação para pessoas ou entidades
 * @property formato - Padrão ou máscara do formato (ex: "000.000.000-00")
 */
export interface TipoIdentificador extends SimpleEntity {
  formato?: string;
}

/**
 * Interface para distribuidores de demandas
 * Representa pessoas responsáveis pela distribuição e encaminhamento de demandas
 * @property email - Endereço eletrônico para contato com o distribuidor
 */
export interface Distribuidor extends SimpleEntity {
  email?: string;
}

/**
 * Interface para tipos de mídia
 * Categoriza diferentes tipos de arquivos e formatos de mídia
 * @property extensao - Extensão do arquivo (ex: ".pdf", ".jpg", ".mp4")
 */
export interface TipoMidia extends SimpleEntity {
  extensao?: string;
}

/**
 * Interface para autoridades
 * Representa autoridades públicas ou pessoas com cargo oficial
 * @property nome - Nome completo da autoridade
 * @property cargo - Função ou posição exercida pela autoridade
 */
export interface Autoridade extends BaseEntity {
  nome: string;
  cargo: string;
}

/**
 * Interface para órgãos públicos
 * Representa instituições públicas e suas informações de contato
 * @property abreviacao - Sigla ou forma abreviada do órgão
 * @property nomeCompleto - Denominação oficial completa do órgão
 * @property enderecamento - Endereço completo para correspondência oficial
 */
export interface Orgao extends BaseEntity {
  abreviacao: string;
  nomeCompleto: string;
  enderecamento: string;
}

/**
 * Interface para provedores de internet
 * Representa empresas prestadoras de serviços de internet e telecomunicações
 * @property nomeFantasia - Nome comercial utilizado pela empresa
 * @property razaoSocial - Denominação jurídica oficial da empresa
 * @property enderecamento - Endereço comercial para correspondência
 */
export interface Provedor extends BaseEntity {
  nomeFantasia: string;
  razaoSocial: string;
  enderecamento: string;
}

// Tipos união para diferentes categorias de entidades
/**
 * Tipo união para todas as entidades de cadastro
 * Agrupa todas as interfaces que representam dados de cadastro no sistema
 */
export type CadastroEntity =
  | Assunto
  | TipoDemanda
  | TipoDocumento
  | TipoIdentificador
  | Distribuidor
  | TipoMidia
  | Autoridade
  | Orgao
  | Provedor;

/**
 * Tipo união para entidades simples (apenas com nome)
 * Agrupa interfaces que estendem SimpleEntity para operações genéricas
 */
export type SimpleEntityType =
  | Assunto
  | TipoDemanda
  | TipoDocumento
  | TipoIdentificador
  | Distribuidor
  | TipoMidia;
