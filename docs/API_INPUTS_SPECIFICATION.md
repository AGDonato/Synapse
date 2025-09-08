# Especificação Real de Inputs para Backend - Synapse

## 📋 Visão Geral

Este documento é baseado **exclusivamente** no código real do frontend existente. Nada foi inventado - todas as estruturas, campos e validações são extraídos diretamente do código TypeScript em produção.

**Status**: ✅ Frontend Maduro (256+ arquivos TypeScript) | ⏳ Backend a ser Implementado
**Fonte**: `src/shared/types/entities.ts` + `src/shared/data/mock*.ts`
**Última Atualização**: Janeiro 2025

---

## 🏗️ Entidades Principais (Código Real)

### **Demanda**
*Fonte: `src/shared/types/entities.ts:38`*

#### **Interface TypeScript Exata**
```typescript
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
```

#### **Exemplo Real dos Mock Data**
*Fonte: `src/shared/data/mockDemandas.ts:8`*
```json
{
  "id": 1,
  "sged": "38145",
  "tipoDemanda": "Quebra e interceptação",
  "autosJudiciais": "148032-91.2009.8.09.002",
  "alvos": 3,
  "identificadores": 8,
  "distribuidor": "CARLOS WOLF",
  "descricao": "Interceptação telefônica - organização criminosa",
  "orgao": "Grupo de Atuação Especial de Combate ao Crime Organizado - Núcleo 02",
  "status": "Em Andamento",
  "analista": "100",
  "dataInicial": "15/03/2024",
  "dataFinal": null
}
```

---

### **DocumentoDemanda** (Documento Real)
*Fonte: `src/shared/data/mockDocumentos.ts:51`*

#### **Interface TypeScript Exata**
```typescript
export interface DocumentoDemanda {
  id: number;
  demandaId: number;
  sged: string;
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
}
```

#### **Interfaces Relacionadas**
```typescript
export interface RetificacaoDocumento {
  id: string;
  autoridade: string;
  dataAssinatura: string;
}

export interface PesquisaDocumento {
  dataInicio: string;
  dataFim: string;
  provedores: string[];
}

export interface DestinatarioDocumento {
  destinatario: string;
  enderecamento: string;
  dataEnvio: string | null;
  codigoRastreio: string;
  dataResposta: string | null;
  respondido: boolean;
}
```

---

### **Orgao**
*Fonte: `src/shared/types/entities.ts:127`*

```typescript
export interface Orgao extends BaseEntity {
  abreviacao: string;
  nomeCompleto: string;
  enderecamento: string;
}
```

### **Autoridade**
*Fonte: `src/shared/types/entities.ts:115`*

```typescript
export interface Autoridade extends BaseEntity {
  nome: string;
  cargo: string;
}
```

### **Provedor**
*Fonte: `src/shared/types/entities.ts:140`*

```typescript
export interface Provedor extends BaseEntity {
  nomeFantasia: string;
  razaoSocial: string;
  enderecamento: string;
}
```

---

## 🔧 Entidades Auxiliares (SimpleEntity)

### **Base para Entidades Simples**
*Fonte: `src/shared/types/entities.ts:28`*
```typescript
export interface SimpleEntity extends BaseEntity {
  nome: string;
}
```

### **Tipos que Estendem SimpleEntity:**

#### **Assunto**
```typescript
export interface Assunto extends SimpleEntity {
  descricao?: string;
}
```

#### **TipoDemanda**
```typescript
export interface TipoDemanda extends SimpleEntity {
  descricao?: string;
}
```

#### **TipoDocumento**
```typescript
export interface TipoDocumento extends SimpleEntity {
  descricao?: string;
}
```

#### **TipoIdentificador**
```typescript
export interface TipoIdentificador extends SimpleEntity {
  formato?: string;
}
```

#### **Distribuidor**
```typescript
export interface Distribuidor extends SimpleEntity {
  email?: string;
}
```

#### **TipoMidia**
```typescript
export interface TipoMidia extends SimpleEntity {
  extensao?: string;
}
```

---

## 📊 Dados Mock Reais (Para Referência)

### **Tipos de Demanda Existentes**
*Fonte: `src/shared/data/mockTiposDemandas.ts`*
- "Quebra e interceptação"
- "Investigação cibernética"
- "Preservação de dados"
- "Análise pericial"

### **Tipos de Documento Existentes**
*Fonte: `src/shared/data/mockTiposDocumentos.ts`*
- "Ofício"
- "Relatório Técnico"
- "Relatório de Inteligência"
- "Auto Circunstanciado"
- "Decisão"
- "Mídia"
- "Ofício Circular"

### **Status de Demanda (Valores Exatos)**
```typescript
type StatusDemanda = 'Em Andamento' | 'Finalizada' | 'Fila de Espera' | 'Aguardando';
```

---

## 🗄️ Estrutura de Banco Sugerida (Baseada no Real)

### **Tabela demandas**
```sql
CREATE TABLE demandas (
  id SERIAL PRIMARY KEY,
  sged VARCHAR(20) UNIQUE NOT NULL,
  tipo_demanda VARCHAR(100) NOT NULL,
  autos_administrativos VARCHAR(100),
  pic VARCHAR(100),
  autos_judiciais VARCHAR(100),
  autos_extrajudiciais VARCHAR(100),
  alvos TEXT NOT NULL,
  identificadores TEXT NOT NULL,
  distribuidor VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  orgao VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Em Andamento', 'Finalizada', 'Fila de Espera', 'Aguardando')),
  analista VARCHAR(100) NOT NULL,
  data_inicial DATE NOT NULL,
  data_final DATE,
  data_reabertura DATE,
  nova_data_final DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabela documentos**
```sql
CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  demanda_id INTEGER REFERENCES demandas(id),
  sged VARCHAR(20) NOT NULL,
  tipo_documento VARCHAR(100) NOT NULL,
  assunto VARCHAR(200) NOT NULL,
  assunto_outros TEXT,
  destinatario VARCHAR(200) NOT NULL,
  enderecamento TEXT NOT NULL,
  numero_documento VARCHAR(100),
  numero_atena VARCHAR(100),
  codigo_rastreio VARCHAR(100),
  nao_possui_rastreio BOOLEAN DEFAULT FALSE,
  ano_documento VARCHAR(4),
  analista VARCHAR(100),
  autoridade VARCHAR(200),
  orgao_judicial VARCHAR(200),
  data_assinatura DATE,
  retificada BOOLEAN DEFAULT FALSE,
  tipo_midia VARCHAR(100),
  tamanho_midia VARCHAR(50),
  hash_midia VARCHAR(100),
  senha_midia VARCHAR(100),
  data_envio DATE,
  data_resposta DATE,
  respondido BOOLEAN DEFAULT FALSE,
  data_finalizacao DATE,
  apresentou_defeito BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 Endpoints Necessários (Baseados no Frontend Real)

### **Demandas**
```
GET    /api/demandas                 # Lista paginada
POST   /api/demandas                 # Criar nova
GET    /api/demandas/{id}            # Buscar por ID
PUT    /api/demandas/{id}            # Atualizar
DELETE /api/demandas/{id}            # Deletar
```

### **Documentos**
```
GET    /api/documentos               # Lista paginada
POST   /api/documentos               # Criar novo
GET    /api/documentos/{id}          # Buscar por ID
PUT    /api/documentos/{id}          # Atualizar
DELETE /api/documentos/{id}          # Deletar
```

### **Cadastros (SimpleEntity)**
```
GET    /api/assuntos
GET    /api/tipos-demanda
GET    /api/tipos-documento
GET    /api/orgaos
GET    /api/autoridades
GET    /api/provedores
GET    /api/distribuidores
```

---

## ⚠️ Importante: O que NÃO Existe

### **Campos Inexistentes (que podem parecer óbvios mas não estão no código):**
- ❌ `prioridade` na Demanda (há infraestrutura preparada mas não implementada)
- ❌ `createdAt`/`updatedAt` nas interfaces (apenas nos dados mock)
- ❌ Validações complexas de negócio (apenas validações básicas de formato)

### **Funcionalidades Não Implementadas:**
- ❌ Upload real de arquivos
- ❌ Sistema de permissões
- ❌ Auditoria de alterações
- ❌ Workflow de aprovação

---

## 📝 Notas Técnicas

### **Formato de Datas**
- Mock data usa `DD/MM/YYYY`
- Interfaces definem `YYYY-MM-DD`
- Backend deve padronizar formato

### **Campos Opcionais vs Obrigatórios**
- Interfaces mostram `?` para opcionais
- Mock data pode ter `null` para campos não utilizados
- Validar se frontend trata `null` vs `undefined`

### **Relacionamentos**
- Relacionamentos são por string (nome) não por FK
- Exemplo: `orgao: "Nome do Órgão"` não `orgaoId: 1`

---

**📝 Nota Final**: Esta especificação reflete **exatamente** o que existe no código atual. Nada foi inventado ou assumido. Use este documento como base fiel para implementação do backend.

**Versão**: 2.0.0-real-code-only
**Fonte**: Código TypeScript verificado
