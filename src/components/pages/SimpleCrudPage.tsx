// src/components/pages/SimpleCrudPage.tsx
import Input from '../ui/Input';
import Table, { type TableColumn } from '../ui/Table';
import Form from '../ui/Form';
import CadastroPageLayout from '../layout/CadastroPageLayout';
import { useCrud, type BaseEntity } from '../../hooks/useCrud';
import sharedStyles from '../../styles/shared.module.css';

// Tipo para entidades simples (apenas nome)
export interface SimpleEntity extends BaseEntity {
  nome: string;
}

export type SimpleCrudPageProps<T extends SimpleEntity> = {
  title: string;
  searchPlaceholder: string;
  entityName: string;
  createTitle: string;
  editTitle: string;
  initialData: T[];
  nameLabel?: string;
  namePlaceholder?: string;
};

export default function SimpleCrudPage<T extends SimpleEntity>({
  title,
  searchPlaceholder,
  entityName,
  createTitle,
  editTitle,
  initialData,
  nameLabel = 'Nome',
  namePlaceholder = 'Digite o nome...',
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
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem?.nome?.trim()) return;

    const itemData = { nome: currentItem.nome.trim() };

    try {
      if (isEditing && currentItem.id) {
        await updateItem(currentItem.id, itemData as Partial<T>);
      } else {
        await saveItem(itemData as Omit<T, 'id'>);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  // Configuração das colunas da tabela
  const columns: TableColumn<T>[] = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      align: 'center',
    },
    {
      key: 'nome',
      label: nameLabel,
    },
  ];

  // Componente do formulário
  const formComponent = (
    <Form
      title={isEditing ? editTitle : createTitle}
      onSubmit={handleSave}
      onCancel={hideForm}
      isEditing={isEditing}
      loading={saving}
    >
      {error && (
        <div className={sharedStyles.errorMessage}>
          {error}
          <button
            onClick={clearError}
            className={sharedStyles.errorDismiss}
          >
            ✕
          </button>
        </div>
      )}

      <Input
        label={nameLabel}
        value={currentItem?.nome || ''}
        onChange={(value) => updateCurrentItem('nome', value as T[keyof T])}
        placeholder={namePlaceholder}
        required
        disabled={saving}
      />
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
        columns={columns}
        onEdit={showEditForm}
        onDelete={(item) => confirmDelete(item.id)}
        emptyMessage={`Nenhum ${entityName.toLowerCase()} encontrado`}
        loading={loading}
      />
    </CadastroPageLayout>
  );
}
