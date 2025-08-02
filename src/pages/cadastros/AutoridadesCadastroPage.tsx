// src/pages/cadastros/AutoridadesCadastroPage.tsx
import Input from '../../components/ui/Input';
import Table, { type TableColumn } from '../../components/ui/Table';
import Form from '../../components/ui/Form';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockAutoridades, type Autoridade } from '../../data/mockAutoridades';
import { useCrud } from '../../hooks/useCrud';
import { theme } from '../../styles/theme';

export default function AutoridadesCadastroPage() {
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
  } = useCrud<Autoridade>({
    initialData: mockAutoridades,
    entityName: 'autoridade',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem?.nome?.trim() || !currentItem?.cargo?.trim()) return;

    const itemData = {
      nome: currentItem.nome.trim(),
      cargo: currentItem.cargo.trim(),
    };

    try {
      if (isEditing && currentItem.id) {
        await updateItem(currentItem.id, itemData);
      } else {
        await saveItem(itemData);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  // Configuração das colunas da tabela
  const columns: TableColumn<Autoridade>[] = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      align: 'center',
    },
    {
      key: 'nome',
      label: 'Nome',
    },
    {
      key: 'cargo',
      label: 'Cargo',
    },
  ];

  // Componente do formulário
  const formComponent = (
    <Form
      title={isEditing ? 'Editar Autoridade' : 'Nova Autoridade'}
      onSubmit={handleSave}
      onCancel={hideForm}
      isEditing={isEditing}
      loading={saving}
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
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.lg,
        }}
      >
        <Input
          label='Nome'
          value={currentItem?.nome || ''}
          onChange={(value) => updateCurrentItem('nome', value)}
          placeholder='Digite o nome da autoridade...'
          required
          disabled={saving}
        />
        <Input
          label='Cargo'
          value={currentItem?.cargo || ''}
          onChange={(value) => updateCurrentItem('cargo', value)}
          placeholder='Digite o cargo da autoridade...'
          required
          disabled={saving}
        />
      </div>
    </Form>
  );

  return (
    <CadastroPageLayout
      title='Gerenciar Autoridades'
      searchPlaceholder='Buscar por nome ou cargo...'
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
        emptyMessage='Nenhuma autoridade encontrada'
        loading={loading}
      />
    </CadastroPageLayout>
  );
}
