// src/hooks/useValidatedCrud.ts

import { useMemo, useState } from 'react';
import type { z } from 'zod';
import { generateId, searchItems } from '../utils/helpers';
import { useFormValidation } from './useFormValidation';
import type { BaseEntity } from '../types/entities';

export interface UseValidatedCrudConfig<T extends BaseEntity> {
  initialData: T[];
  entityName?: string;
  generateId?: () => number;
  createSchema: z.ZodSchema<Partial<T>>;
  updateSchema: z.ZodSchema<Partial<T>>;
  searchFields?: (keyof T)[];
}

export interface UseValidatedCrudReturn<T extends BaseEntity> {
  // Data state
  items: T[];
  filteredItems: T[];

  // Form state
  isFormVisible: boolean;
  isEditing: boolean;
  currentItem: Partial<T> | null;

  // Search state
  searchTerm: string;

  // Loading/error states
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Validation
  formErrors: Record<string, string | undefined>;
  isFormValid: boolean;

  // Form actions
  showCreateForm: () => void;
  showEditForm: (item: T) => void;
  hideForm: () => void;
  updateCurrentItem: (field: keyof T, value: T[keyof T]) => void;
  setCurrentItem: (item: Partial<T>) => void;

  // CRUD actions
  saveItem: () => Promise<T | null>;
  updateItem: (id: number) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;

  // Search actions
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;

  // Utilities
  confirmDelete: (id: number, message?: string) => void;
  clearError: () => void;
  validateForm: () => boolean;
}

/* eslint-disable max-lines-per-function */
export function useValidatedCrud<T extends BaseEntity>({
  initialData,
  entityName = 'item',
  generateId: customGenerateId = generateId,
  createSchema,
  updateSchema,
  searchFields,
}: UseValidatedCrudConfig<T>): UseValidatedCrudReturn<T> {
  // Main state
  const [items, setItems] = useState<T[]>(initialData);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<T> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isEditing = Boolean(
    currentItem && 'id' in currentItem && currentItem.id !== undefined
  );
  const activeSchema = isEditing ? updateSchema : createSchema;
  const validation = useFormValidation<Partial<T>>(activeSchema);

  // Computed state
  const filteredItems = useMemo(() => {
    return searchItems(items, searchTerm, searchFields);
  }, [items, searchTerm, searchFields]);

  // Form actions
  const showCreateForm = () => {
    setCurrentItem({} as Partial<T>);
    setIsFormVisible(true);
    validation.clearErrors();
  };

  const showEditForm = (item: T) => {
    setCurrentItem({ ...item });
    setIsFormVisible(true);
    validation.clearErrors();
  };

  const hideForm = () => {
    setIsFormVisible(false);
    setCurrentItem(null);
    validation.clearErrors();
    setError(null);
  };

  const updateCurrentItem = (field: keyof T, value: T[keyof T]) => {
    setCurrentItem((prev) => {
      const updated = { ...prev, [field]: value } as Partial<T>;

      // Validate field on change (simplified)
      // validation.validateField(field, value);

      return updated;
    });
  };

  const validateForm = (): boolean => {
    if (!currentItem) {return false;}

    try {
      return validation.validate(currentItem);
    } catch {
      return false;
    }
  };

  // CRUD actions
  const saveItem = async (): Promise<T | null> => {
    if (!currentItem) {return null;}

    setSaving(true);
    setError(null);

    try {
      // Validate before saving
      if (!validateForm()) {
        setSaving(false);
        return null;
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newItem = {
        ...currentItem,
        id: customGenerateId(),
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

  const updateItem = async (id: number): Promise<void> => {
    if (!currentItem) {return;}

    setSaving(true);
    setError(null);

    try {
      // Validate before updating
      if (!validateForm()) {
        setSaving(false);
        return;
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? ({ ...item, ...currentItem } as T) : item
        )
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
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(`Erro ao excluir ${entityName}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search actions
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Utilities
  const confirmDelete = async (id: number, message?: string) => {
    const defaultMessage = `Tem certeza que deseja excluir este ${entityName}?`;
    // eslint-disable-next-line no-alert
    if (window.confirm(message ?? defaultMessage)) {
      await deleteItem(id);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Data state
    items,
    filteredItems,

    // Form state
    isFormVisible,
    isEditing,
    currentItem,

    // Search state
    searchTerm,

    // Loading/error states
    loading,
    saving,
    error,

    // Validation
    formErrors: validation.errors,
    isFormValid: validation.isValid && !!currentItem,

    // Form actions
    showCreateForm,
    showEditForm,
    hideForm,
    updateCurrentItem,
    setCurrentItem,

    // CRUD actions
    saveItem,
    updateItem,
    deleteItem,

    // Search actions
    setSearchTerm,
    clearSearch,

    // Utilities
    confirmDelete,
    clearError,
    validateForm,
  };
}
