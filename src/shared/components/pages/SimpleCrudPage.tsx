// src/components/pages/SimpleCrudPage.tsx
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Table, { type TableColumn } from '../ui/Table';
import Form from '../ui/Form';
import CadastroPageLayout from '../layout/CadastroPageLayout';
import { type BaseEntity, useCrud } from '../../../shared/hooks/useCrud';

// Configuração de campo dinâmico
export interface FieldConfig<T = any> {
  key: keyof T;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number; // Para textarea
  gridColumn?: string; // Para layout CSS Grid
}

// Configuração de coluna da tabela
export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

// Interface expandida para suportar qualquer entidade
export interface SimpleCrudPageProps<T extends BaseEntity> {
  title: string;
  searchPlaceholder: string;
  entityName: string;
  createTitle: string;
  editTitle: string;
  initialData: T[];
  fields: FieldConfig<T>[];
  columns: ColumnConfig<T>[];
  searchFields?: (keyof T)[]; // Campos para busca
  validate?: (item: Partial<T>) => boolean;
}

export default function SimpleCrudPage<T extends BaseEntity>({
  title,
  searchPlaceholder,
  entityName,
  createTitle,
  editTitle,
  initialData,
  fields,
  columns,
  searchFields,
  validate,
}: SimpleCrudPageProps<T>) {
  const {
    filteredItems,
    isFormVisible,
    isEditing,
    currentItem,
    searchTerm,
    loading,
    saving,
    error,
    hasChanges,
    showCreateForm,
    showEditForm,
    hideForm,
    updateCurrentItem,
    saveItem,
    updateItem,
    setSearchTerm,
    clearSearch,
    confirmDelete,
    clearError,
  } = useCrud<T>({
    initialData,
    entityName,
    searchFields,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica dos campos obrigatórios
    const requiredFields = fields.filter(field => field.required);
    const hasEmptyRequiredField = requiredFields.some(field => {
      const value = currentItem?.[field.key];
      return !value || (typeof value === 'string' && !value.trim());
    });

    if (hasEmptyRequiredField) {
      return;
    }

    // Validação customizada se fornecida
    if (validate && !validate(currentItem || {})) {
      return;
    }

    // Construir dados do item baseado nos campos configurados
    const itemData: any = {};
    fields.forEach(field => {
      const value = currentItem?.[field.key];
      if (value !== undefined) {
        itemData[field.key] = typeof value === 'string' ? value.trim() : value;
      }
    });

    try {
      if (isEditing && currentItem?.id) {
        await updateItem(currentItem.id, itemData as Partial<T>);
      } else {
        await saveItem(itemData as Omit<T, 'id'>);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  // Conversão das configurações de coluna para formato do Table
  const tableColumns: TableColumn<T>[] = [
    {
      key: 'id' as keyof T,
      label: 'ID',
      width: '80px',
      align: 'center',
      sortable: true,
    },
    ...(columns || []).map(col => ({
      key: col.key,
      label: col.label,
      width: col.width,
      align: col.align,
      sortable: col.sortable,
      render: col.render,
    })),
  ];

  // Renderização dinâmica de campos do formulário
  const renderField = (field: FieldConfig<T>) => {
    const key = String(field.key);
    const value = currentItem?.[field.key] || '';

    if (field.type === 'textarea') {
      return (
        <div key={key} style={{ gridColumn: field.gridColumn }}>
          <TextArea
            label={field.label}
            value={String(value)}
            onChange={val => updateCurrentItem(field.key, val as T[keyof T])}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows}
            disabled={saving}
          />
        </div>
      );
    }

    return (
      <div key={key} style={{ gridColumn: field.gridColumn }}>
        <Input
          label={field.label}
          value={String(value)}
          onChange={val => updateCurrentItem(field.key, val as T[keyof T])}
          placeholder={field.placeholder}
          required={field.required}
          disabled={saving}
        />
      </div>
    );
  };

  // Componente do formulário
  const formComponent = (
    <Form
      title={isEditing ? editTitle : createTitle}
      onSubmit={handleSave}
      isEditing={isEditing}
      loading={saving}
      hasChanges={hasChanges}
    >
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {error}
          <button
            onClick={clearError}
            style={{
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {(fields || []).map(renderField)}
      </div>
    </Form>
  );

  return (
    <CadastroPageLayout
      title={title}
      searchPlaceholder={searchPlaceholder}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSearch={clearSearch}
      isFormVisible={isFormVisible}
      onToggleForm={isFormVisible ? hideForm : showCreateForm}
      formComponent={formComponent}
    >
      <Table
        data={filteredItems}
        columns={tableColumns}
        onEdit={showEditForm}
        onDelete={item => confirmDelete(item.id)}
        emptyMessage={`Nenhum ${entityName.toLowerCase()} encontrado`}
        loading={loading}
        editIcon='edit'
      />
    </CadastroPageLayout>
  );
}
