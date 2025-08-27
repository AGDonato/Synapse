// src/hooks/useCrud.ts
import { useMemo, useState } from 'react';
import { useFormChanges } from './useFormChanges';

// Tipo base para entidades que têm ID
export interface BaseEntity {
  id: number;
}

// Configuração do hook
export interface UseCrudConfig<T> {
  initialData: T[];
  entityName?: string;
  generateId?: () => number;
}

// Retorno do hook
export interface UseCrudReturn<T extends BaseEntity> {
  // Estado dos dados
  items: T[];
  filteredItems: T[];

  // Estado do formulário
  isFormVisible: boolean;
  isEditing: boolean;
  currentItem: Partial<T> | null;

  // Estado de busca
  searchTerm: string;

  // Estados de loading/erro
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Estado de mudanças no formulário
  hasChanges: boolean;

  // Ações de formulário
  showCreateForm: () => void;
  showEditForm: (item: T) => void;
  hideForm: () => void;
  updateCurrentItem: (field: keyof T, value: T[keyof T]) => void;
  setCurrentItem: (item: Partial<T>) => void;

  // Ações CRUD
  saveItem: (itemData: Omit<T, 'id'>) => Promise<T>;
  updateItem: (id: number, updates: Partial<T>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;

  // Ações de busca
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;

  // Utilitários
  confirmDelete: (id: number, message?: string) => void;
  clearError: () => void;
}

export function useCrud<T extends BaseEntity>({
  initialData,
  entityName = 'item',
  generateId = () => Date.now(),
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

  // Estado computado
  const isEditing = Boolean(
    currentItem && 'id' in currentItem && currentItem.id !== undefined
  );

  // Detecção de mudanças no formulário
  const { hasChanges } = useFormChanges(
    currentItem || ({} as Partial<T>),
    originalItem,
    isEditing
  );

  // Filtro de busca (genérico - busca em campos string)
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {return items;}

    return items.filter((item) => {
      return Object.values(item).some(
        (value) =>
          typeof value === 'string' &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [items, searchTerm]);

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
      (prev) =>
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
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newItem = {
        ...itemData,
        id: generateId(),
      } as T;

      setItems((prev) => [...prev, newItem]);
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
      await new Promise((resolve) => setTimeout(resolve, 500));

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
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
      await new Promise((resolve) => setTimeout(resolve, 300));

      setItems((prev) => prev.filter((item) => item.id !== id));
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
    if (window.confirm(message || defaultMessage)) {
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
