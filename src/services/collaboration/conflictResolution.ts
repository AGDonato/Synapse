/**
 * Serviço de Resolução de Conflitos
 * Gerencia conflitos de dados em ambientes multi-usuário
 */

import type { Demanda } from '../../types/entities';
import type { DocumentoDemanda } from '../../data/mockDocumentos';

// Tipo união para todas as entidades que podem ter conflitos
type EntityData = Demanda | DocumentoDemanda | Record<string, unknown>;

// Interface para estratégia de resolução
interface ResolutionStrategy {
  canResolve(conflict: Conflict): boolean;
  resolve(conflict: Conflict, resolution: 'merge' | 'keep_current' | 'accept_incoming'): unknown;
}

interface ConflictInfo {
  path: string;
  current: unknown;
  incoming: unknown;
  base?: unknown;
}

interface ChangeInfo {
  path: string;
  value: unknown;
  operation: 'add' | 'modify' | 'delete';
}

export interface DataVersion {
  id: string;
  entityType: 'demanda' | 'documento' | 'cadastro';
  entityId: number;
  version: number;
  data: EntityData;
  userId: string;
  userName: string;
  timestamp: number;
  checksum: string;
}

export interface Conflict {
  id: string;
  entityType: string;
  entityId: number;
  fieldPath: string;
  currentVersion: DataVersion;
  incomingVersion: DataVersion;
  baseVersion?: DataVersion; // Common ancestor
  conflictType:
    | 'concurrent_edit'
    | 'version_mismatch'
    | 'deletion_conflict'
    | 'validation_conflict';
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  suggestedResolution?: 'keep_current' | 'accept_incoming' | 'merge' | 'manual';
  timestamp: number;
}

export interface MergeResult {
  success: boolean;
  mergedData: EntityData;
  remainingConflicts: Conflict[];
  autoResolvedConflicts: Conflict[];
  warnings: string[];
}

export interface ConflictResolutionStrategy {
  name: string;
  priority: number;
  canResolve: (conflict: Conflict) => boolean;
  resolve: (conflict: Conflict, strategy: 'keep_current' | 'accept_incoming' | 'merge') => any;
}

/**
 * Serviço de Resolução de Conflitos
 */
class ConflictResolutionService {
  private strategies: ConflictResolutionStrategy[] = [];
  private conflictHistory = new Map<string, Conflict[]>();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Detecta conflitos entre duas versões dos dados
   */
  detectConflicts(current: DataVersion, incoming: DataVersion, base?: DataVersion): Conflict[] {
    const conflicts: Conflict[] = [];

    // Verificação de incompatibilidade de versão
    if (current.version !== incoming.version - 1) {
      conflicts.push(this.createVersionConflict(current, incoming));
    }

    // Comparação profunda de campos
    const fieldConflicts = this.compareFields(current.data, incoming.data, base?.data);
    conflicts.push(
      ...fieldConflicts.map(fc => this.createFieldConflict(fc, current, incoming, base))
    );

    // Verificação de integridade dos dados
    const integrityConflicts = this.checkDataIntegrity(current, incoming);
    conflicts.push(...integrityConflicts);

    return conflicts;
  }

  /**
   * Tenta resolver conflitos automaticamente
   */
  async autoResolveConflicts(conflicts: Conflict[]): Promise<MergeResult> {
    const autoResolved: Conflict[] = [];
    const remaining: Conflict[] = [];
    const warnings: string[] = [];
    const mergedData = {};

    for (const conflict of conflicts) {
      if (!conflict.autoResolvable) {
        remaining.push(conflict);
        continue;
      }

      try {
        const strategy = this.findBestStrategy(conflict);
        if (strategy && strategy.canResolve(conflict)) {
          const resolutionType =
            conflict.suggestedResolution === 'manual'
              ? 'merge'
              : conflict.suggestedResolution || 'merge';
          const resolution = strategy.resolve(conflict, resolutionType);
          this.applyResolution(mergedData, conflict.fieldPath, resolution);
          autoResolved.push(conflict);
        } else {
          remaining.push(conflict);
          warnings.push(
            `Nenhuma estratégia adequada encontrada para conflito em ${conflict.fieldPath}`
          );
        }
      } catch (error) {
        remaining.push(conflict);
        warnings.push(`Resolução automática falhou para ${conflict.fieldPath}: ${error}`);
      }
    }

    return {
      success: remaining.length === 0,
      mergedData,
      remainingConflicts: remaining,
      autoResolvedConflicts: autoResolved,
      warnings,
    };
  }

  /**
   * Resolve conflito manualmente
   */
  manualResolveConflict(
    conflict: Conflict,
    resolution: 'keep_current' | 'accept_incoming' | 'custom',
    customData?: Partial<EntityData>
  ): EntityData {
    switch (resolution) {
      case 'keep_current':
        return this.getFieldValue(conflict.currentVersion.data, conflict.fieldPath) as EntityData;

      case 'accept_incoming':
        return this.getFieldValue(conflict.incomingVersion.data, conflict.fieldPath) as EntityData;

      case 'custom':
        if (customData === undefined) {
          throw new Error('Dados customizados são necessários para resolução personalizada');
        }
        return customData;

      default:
        throw new Error(`Tipo de resolução desconhecido: ${resolution}`);
    }
  }

  /**
   * Gera merge de três vias
   */
  performThreeWayMerge(
    current: DataVersion,
    incoming: DataVersion,
    base: DataVersion
  ): MergeResult {
    const conflicts = this.detectConflicts(current, incoming, base);

    // Inicia com os dados base
    const mergedData = JSON.parse(JSON.stringify(base.data));

    // Aplica mudanças sem conflito da versão atual
    const currentChanges = this.getChanges(base.data, current.data);
    const incomingChanges = this.getChanges(base.data, incoming.data);

    // Encontra mudanças sem conflito
    const safeCurrentChanges = currentChanges.filter(
      change => !incomingChanges.some(inc => inc.path === change.path)
    );
    const safeIncomingChanges = incomingChanges.filter(
      change => !currentChanges.some(cur => cur.path === change.path)
    );

    // Aplica mudanças seguras
    safeCurrentChanges.forEach(change => {
      this.applyChange(mergedData, change);
    });
    safeIncomingChanges.forEach(change => {
      this.applyChange(mergedData, change);
    });

    return {
      success: conflicts.length === 0,
      mergedData,
      remainingConflicts: conflicts,
      autoResolvedConflicts: [],
      warnings:
        conflicts.length > 0 ? [`${conflicts.length} conflitos requerem resolução manual`] : [],
    };
  }

  /**
   * Cria versão dos dados com checksum
   */
  createDataVersion(
    entityType: string,
    entityId: number,
    data: EntityData,
    userId: string,
    userName: string,
    version?: number
  ): DataVersion {
    const timestamp = Date.now();
    const checksum = this.calculateChecksum(data);

    return {
      id: `${entityType}_${entityId}_${timestamp}_${userId}`,
      entityType: entityType as any,
      entityId,
      version: version || 1,
      data: JSON.parse(JSON.stringify(data)), // Clone profundo
      userId,
      userName,
      timestamp,
      checksum,
    };
  }

  /**
   * Valida integridade da versão dos dados
   */
  validateDataVersion(version: DataVersion): boolean {
    const calculatedChecksum = this.calculateChecksum(version.data);
    return calculatedChecksum === version.checksum;
  }

  /**
   * Obtém histórico de conflitos para uma entidade
   */
  getConflictHistory(entityType: string, entityId: number): Conflict[] {
    const key = `${entityType}:${entityId}`;
    return this.conflictHistory.get(key) || [];
  }

  /**
   * Adiciona conflito ao histórico
   */
  addToHistory(conflict: Conflict): void {
    const key = `${conflict.entityType}:${conflict.entityId}`;
    const history = this.conflictHistory.get(key) || [];
    history.push(conflict);

    // Mantém apenas os últimos 50 conflitos por entidade
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    this.conflictHistory.set(key, history);
  }

  /**
   * Registra estratégia de resolução de conflitos
   */
  registerStrategy(strategy: ConflictResolutionStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Métodos privados
   */
  private initializeStrategies(): void {
    // Estratégia último-escritor-vence
    this.registerStrategy({
      name: 'last_writer_wins',
      priority: 1,
      canResolve: conflict =>
        conflict.conflictType === 'concurrent_edit' && conflict.severity === 'low',
      resolve: conflict => this.getFieldValue(conflict.incomingVersion.data, conflict.fieldPath),
    });

    // Estratégia baseada em timestamp
    this.registerStrategy({
      name: 'timestamp_based',
      priority: 2,
      canResolve: conflict => conflict.conflictType === 'concurrent_edit',
      resolve: conflict => {
        const currentTime = conflict.currentVersion.timestamp;
        const incomingTime = conflict.incomingVersion.timestamp;

        if (incomingTime > currentTime) {
          return this.getFieldValue(conflict.incomingVersion.data, conflict.fieldPath);
        } else {
          return this.getFieldValue(conflict.currentVersion.data, conflict.fieldPath);
        }
      },
    });

    // Estratégia de merge não-destrutivo (para arrays/listas)
    this.registerStrategy({
      name: 'non_destructive_merge',
      priority: 5,
      canResolve: conflict => {
        const currentValue = this.getFieldValue(conflict.currentVersion.data, conflict.fieldPath);
        const incomingValue = this.getFieldValue(conflict.incomingVersion.data, conflict.fieldPath);
        return Array.isArray(currentValue) && Array.isArray(incomingValue);
      },
      resolve: conflict => {
        const currentValue = this.getFieldValue(conflict.currentVersion.data, conflict.fieldPath);
        const incomingValue = this.getFieldValue(conflict.incomingVersion.data, conflict.fieldPath);

        // Faz merge dos arrays, removendo duplicatas
        const currentArray = currentValue as unknown[];
        const incomingArray = incomingValue as unknown[];
        const merged = [...currentArray];
        incomingArray.forEach((item: unknown) => {
          if (!merged.some(existing => JSON.stringify(existing) === JSON.stringify(item))) {
            merged.push(item);
          }
        });

        return merged;
      },
    });

    // Estratégia de campo status (prioriza certas mudanças de status)
    this.registerStrategy({
      name: 'status_priority',
      priority: 10,
      canResolve: conflict =>
        conflict.fieldPath.includes('status') && conflict.conflictType === 'concurrent_edit',
      resolve: conflict => {
        const currentStatus = this.getFieldValue(conflict.currentVersion.data, conflict.fieldPath);
        const incomingStatus = this.getFieldValue(
          conflict.incomingVersion.data,
          conflict.fieldPath
        );

        // Prioridade: finalizado > em_andamento > pendente > rascunho
        const statusPriority = {
          finalizado: 4,
          em_andamento: 3,
          pendente: 2,
          rascunho: 1,
        };

        const currentPriority = statusPriority[currentStatus as keyof typeof statusPriority] || 0;
        const incomingPriority = statusPriority[incomingStatus as keyof typeof statusPriority] || 0;

        return incomingPriority >= currentPriority ? incomingStatus : currentStatus;
      },
    });
  }

  private compareFields(
    current: unknown,
    incoming: unknown,
    base?: unknown,
    path = ''
  ): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    const currentObj =
      current && typeof current === 'object' ? (current as Record<string, unknown>) : {};
    const incomingObj =
      incoming && typeof incoming === 'object' ? (incoming as Record<string, unknown>) : {};
    const baseObj = base && typeof base === 'object' ? (base as Record<string, unknown>) : {};

    const currentKeys = new Set(Object.keys(currentObj));
    const incomingKeys = new Set(Object.keys(incomingObj));
    const allKeys = new Set([...currentKeys, ...incomingKeys]);

    for (const key of allKeys) {
      const fieldPath = path ? `${path}.${key}` : key;
      const currentValue = currentObj[key];
      const incomingValue = incomingObj[key];
      const baseValue = baseObj[key];

      if (currentValue === incomingValue) {
        continue; // Sem conflito
      }

      if (
        typeof currentValue === 'object' &&
        typeof incomingValue === 'object' &&
        currentValue !== null &&
        incomingValue !== null &&
        !Array.isArray(currentValue) &&
        !Array.isArray(incomingValue)
      ) {
        // Recursão em objetos aninhados
        const nestedConflicts = this.compareFields(
          currentValue,
          incomingValue,
          baseValue,
          fieldPath
        );
        conflicts.push(...nestedConflicts);
      } else {
        // Conflito de valor direto
        conflicts.push({
          path: fieldPath,
          current: currentValue,
          incoming: incomingValue,
          base: baseValue,
        });
      }
    }

    return conflicts;
  }

  private createVersionConflict(current: DataVersion, incoming: DataVersion): Conflict {
    return {
      id: `version_${current.entityType}_${current.entityId}_${Date.now()}`,
      entityType: current.entityType,
      entityId: current.entityId,
      fieldPath: '__version__',
      currentVersion: current,
      incomingVersion: incoming,
      conflictType: 'version_mismatch',
      severity: 'high',
      autoResolvable: false,
      suggestedResolution: 'manual',
      timestamp: Date.now(),
    };
  }

  private createFieldConflict(
    fieldConflict: ConflictInfo,
    current: DataVersion,
    incoming: DataVersion,
    base?: DataVersion
  ): Conflict {
    const severity = this.assessConflictSeverity(
      fieldConflict.path,
      fieldConflict.current,
      fieldConflict.incoming
    );
    const autoResolvable = severity === 'low' || severity === 'medium';

    return {
      id: `field_${current.entityType}_${current.entityId}_${fieldConflict.path}_${Date.now()}`,
      entityType: current.entityType,
      entityId: current.entityId,
      fieldPath: fieldConflict.path,
      currentVersion: current,
      incomingVersion: incoming,
      baseVersion: base,
      conflictType: 'concurrent_edit',
      severity,
      autoResolvable,
      suggestedResolution: autoResolvable ? 'merge' : 'manual',
      timestamp: Date.now(),
    };
  }

  private checkDataIntegrity(current: DataVersion, incoming: DataVersion): Conflict[] {
    const conflicts: Conflict[] = [];

    // Verifica conflitos de exclusão
    if (current.data && !incoming.data) {
      conflicts.push({
        id: `deletion_${current.entityType}_${current.entityId}_${Date.now()}`,
        entityType: current.entityType,
        entityId: current.entityId,
        fieldPath: '__entity__',
        currentVersion: current,
        incomingVersion: incoming,
        conflictType: 'deletion_conflict',
        severity: 'critical',
        autoResolvable: false,
        suggestedResolution: 'manual',
        timestamp: Date.now(),
      });
    }

    return conflicts;
  }

  private assessConflictSeverity(
    fieldPath: string,
    currentValue: unknown,
    incomingValue: unknown
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Campos críticos que nunca devem ter resolução automática
    const criticalFields = ['id', 'status', 'tipo'];
    if (criticalFields.some(field => fieldPath.includes(field))) {
      return 'critical';
    }

    // Alta severidade para mudanças significativas
    const highSeverityFields = ['numero', 'titulo', 'data_vencimento'];
    if (highSeverityFields.some(field => fieldPath.includes(field))) {
      return 'high';
    }

    // Média severidade para mudanças de conteúdo
    const contentFields = ['descricao', 'observacoes', 'conteudo'];
    if (contentFields.some(field => fieldPath.includes(field))) {
      return 'medium';
    }

    // Baixa severidade para metadados e timestamps
    return 'low';
  }

  private findBestStrategy(conflict: Conflict): ConflictResolutionStrategy | null {
    return this.strategies.find(strategy => strategy.canResolve(conflict)) || null;
  }

  private applyResolution(data: EntityData, fieldPath: string, value: unknown): void {
    const keys = fieldPath.split('.');
    let current = data as Record<string, any>;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, any>;
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  private getFieldValue(data: EntityData, fieldPath: string): unknown {
    const keys = fieldPath.split('.');
    let current = data as Record<string, any>;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key] as Record<string, any>;
      } else {
        return undefined;
      }
    }

    return current;
  }

  private getChanges(base: EntityData, current: EntityData): ChangeInfo[] {
    const changes: ChangeInfo[] = [];

    const findChanges = (baseObj: unknown, currentObj: unknown, path = '') => {
      const baseRecord =
        baseObj && typeof baseObj === 'object' ? (baseObj as Record<string, unknown>) : {};
      const currentRecord =
        currentObj && typeof currentObj === 'object' ? (currentObj as Record<string, unknown>) : {};

      const baseKeys = new Set(Object.keys(baseRecord));
      const currentKeys = new Set(Object.keys(currentRecord));
      const allKeys = new Set([...baseKeys, ...currentKeys]);

      for (const key of allKeys) {
        const fieldPath = path ? `${path}.${key}` : key;
        const baseValue = baseRecord[key];
        const currentValue = currentRecord[key];

        if (!baseKeys.has(key)) {
          changes.push({ path: fieldPath, value: currentValue, operation: 'add' });
        } else if (!currentKeys.has(key)) {
          changes.push({ path: fieldPath, value: undefined, operation: 'delete' });
        } else if (baseValue !== currentValue) {
          if (
            typeof baseValue === 'object' &&
            typeof currentValue === 'object' &&
            baseValue !== null &&
            currentValue !== null
          ) {
            findChanges(baseValue, currentValue, fieldPath);
          } else {
            changes.push({ path: fieldPath, value: currentValue, operation: 'modify' });
          }
        }
      }
    };

    findChanges(base, current);
    return changes;
  }

  private applyChange(data: EntityData, change: ChangeInfo): void {
    if (change.operation === 'delete') {
      // Lida com exclusão
      const keys = change.path.split('.');
      const lastKey = keys.pop()!;
      let current = data as Record<string, any>;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key] as Record<string, any>;
        } else {
          return; // Caminho não existe
        }
      }

      if (current && typeof current === 'object') {
        delete current[lastKey];
      }
    } else {
      // Lida com adição/modificação
      this.applyResolution(data, change.path, change.value);
    }
  }

  private calculateChecksum(data: EntityData): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;

    if (str.length === 0) {
      return hash.toString();
    }

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Converte para inteiro de 32 bits
    }

    return Math.abs(hash).toString(36);
  }
}

// Cria instância singleton
export const conflictResolutionService = new ConflictResolutionService();

export default conflictResolutionService;
