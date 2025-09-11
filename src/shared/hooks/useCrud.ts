/**
 * Hook genérico para operações CRUD (Create, Read, Update, Delete)
 *
 * @description
 * Fornece funcionalidades completas de CRUD para qualquer entidade:
 * - Gerenciamento de estado de formulário (criar/editar)
 * - Busca e filtragem de dados
 * - Detecção de mudanças no formulário
 * - Estados de loading e erro
 * - Validações e confirmações
 *
 * @example
 * const crud = useCrud<Usuario>({
 *   initialData: usuarios,
 *   entityName: 'usuário',
 *   searchFields: ['nome', 'email']
 * });
 *
 * // Criar novo
 * crud.showCreateForm();
 * crud.saveItem({ nome: 'João', email: 'joao@email.com' });
 *
 * // Editar existente
 * crud.showEditForm(usuario);
 * crud.updateItem(usuario.id, { nome: 'João Silva' });
 *
 * @module hooks/useCrud
 */

import { useMemo, useState } from 'react';
import { useFormChanges } from './useFormChanges';

// Tipo base para entidades que têm ID
export interface BaseEntity {
  id: number;
}

// Configuração do hook CRUD
export interface UseCrudConfig<T> {
  initialData: T[];
  entityName?: string;
  generateId?: () => number;
  searchFields?: (keyof T)[];
}

// Interface de retorno com todas as funcionalidades CRUD
export interface UseCrudReturn<T extends BaseEntity> {
  // Estado dos dados
  items: T[]; // Lista completa de itens
  filteredItems: T[]; // Lista filtrada pela busca

  // Estado do formulário
  isFormVisible: boolean; // Formulário visível ou não
  isEditing: boolean; // Modo edição (true) ou criação (false)
  currentItem: Partial<T> | null; // Item sendo editado/criado

  // Estado de busca
  searchTerm: string; // Termo de busca atual

  // Estados de loading/erro
  loading: boolean; // Carregando dados
  saving: boolean; // Salvando mudanças
  error: string | null; // Mensagem de erro

  // Estado de mudanças no formulário
  hasChanges: boolean; // Detecta se há mudanças não salvas

  // Ações de formulário
  showCreateForm: () => void; // Abre formulário para criar novo item
  showEditForm: (item: T) => void; // Abre formulário para editar item
  hideForm: () => void; // Fecha formulário
  updateCurrentItem: (field: keyof T, value: T[keyof T]) => void; // Atualiza campo do item
  setCurrentItem: (item: Partial<T>) => void; // Define item completo

  // Ações CRUD
  saveItem: (itemData: Omit<T, 'id'>) => Promise<T>; // Cria novo item
  updateItem: (id: number, updates: Partial<T>) => Promise<void>; // Atualiza item existente
  deleteItem: (id: number) => Promise<void>; // Remove item

  // Ações de busca
  setSearchTerm: (term: string) => void; // Define termo de busca
  clearSearch: () => void; // Limpa busca

  // Utilitários
  confirmDelete: (id: number, message?: string) => void; // Confirma exclusão com dialog
  clearError: () => void; // Limpa mensagem de erro
}

/**
 * Hook principal para operações CRUD
 *
 * @param config - Configuração do hook:
 *   - initialData: Dados iniciais
 *   - entityName: Nome da entidade (para mensagens)
 *   - generateId: Função para gerar IDs
 *   - searchFields: Campos para busca
 * @returns Objeto com estados e métodos CRUD
 */
export function useCrud<T extends BaseEntity>({
  initialData,
  entityName = 'item',
  generateId = () => Date.now(),
  searchFields,
}: UseCrudConfig<T>): UseCrudReturn<T> {
  // Estados principais
  const [items, setItems] = useState<T[]>(initialData);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<T> | null>(null);
  const [originalItem, setOriginalItem] = useState<Partial<T>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado computado - verifica se está editando (tem ID) ou criando
  const isEditing = Boolean(currentItem && 'id' in currentItem && currentItem.id !== undefined);

  // Detecção automática de mudanças no formulário
  const { hasChanges } = useFormChanges(currentItem ?? ({} as Partial<T>), originalItem, isEditing);

  // Filtro de busca inteligente (configurável por campos ou busca global)
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }

    return items.filter(item => {
      if (searchFields && searchFields.length > 0) {
        // Busca otimizada apenas nos campos especificados
        return searchFields.some(field => {
          const value = item[field];
          return (
            typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      } else {
        // Busca global em todos os campos do tipo string
        return Object.values(item).some(
          value =>
            typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    });
  }, [items, searchTerm, searchFields]);

  // Ações de formulário
  const showCreateForm = () => {
    const emptyItem = {} as Partial<T>;
    setCurrentItem(emptyItem);
    setOriginalItem(emptyItem);
    setIsFormVisible(true);
  };

  const showEditForm = (item: T) => {
    const itemData = { ...item } as Partial<T>;
    setCurrentItem(itemData);
    setOriginalItem(itemData);
    setIsFormVisible(true);
  };

  const hideForm = () => {
    setIsFormVisible(false);
    setCurrentItem(null);
    setOriginalItem({} as Partial<T>);
  };

  const updateCurrentItem = (field: keyof T, value: T[keyof T]) => {
    setCurrentItem(
      prev =>
        ({
          ...prev,
          [field]: value,
        }) as Partial<T>
    );
  };

  // Ações CRUD
  const saveItem = async (itemData: Omit<T, 'id'>): Promise<T> => {
    setSaving(true);
    setError(null);

    try {
      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

      const newItem = {
        ...itemData,
        id: generateId(),
      } as T;

      setItems(prev => [...prev, newItem]);
      hideForm();
      return newItem;
    } catch (err) {
      setError(`Erro ao criar ${entityName}`);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: number, updates: Partial<T>): Promise<void> => {
    setSaving(true);
    setError(null);

    try {
      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

      setItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
      hideForm();
    } catch (err) {
      setError(`Erro ao atualizar ${entityName}`);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simula delay de API
      await new Promise(resolve => setTimeout(resolve, 300));

      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(`Erro ao excluir ${entityName}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Ações de busca
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Utilitário para confirmação de exclusão
  const confirmDelete = async (id: number, message?: string) => {
    const defaultMessage = `Tem certeza que deseja excluir este ${entityName}?`;
    // eslint-disable-next-line no-alert
    if (window.confirm(message ?? defaultMessage)) {
      await deleteItem(id);
    }
  };

  // Utilitário para limpar erro
  const clearError = () => {
    setError(null);
  };

  return {
    // Estado dos dados
    items,
    filteredItems,

    // Estado do formulário
    isFormVisible,
    isEditing,
    currentItem,

    // Estado de busca
    searchTerm,

    // Estados de loading/erro
    loading,
    saving,
    error,

    // Estado de mudanças no formulário
    hasChanges,

    // Ações de formulário
    showCreateForm,
    showEditForm,
    hideForm,
    updateCurrentItem,
    setCurrentItem,

    // Ações CRUD
    saveItem,
    updateItem,
    deleteItem,

    // Ações de busca
    setSearchTerm,
    clearSearch,

    // Utilitários
    confirmDelete,
    clearError,
  };
}
