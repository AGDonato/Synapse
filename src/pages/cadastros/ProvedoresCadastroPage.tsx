// src/pages/cadastros/ProvedoresCadastroPage.tsx
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Table, { type TableColumn } from '../../components/ui/Table';
import Form from '../../components/ui/Form';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockProvedores, type Provedor } from '../../data/mockProvedores';
import { useCrud } from '../../hooks/useCrud';
import { theme } from '../../styles/theme';

export default function ProvedoresCadastroPage() {
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
  } = useCrud<Provedor>({
    initialData: mockProvedores,
    entityName: 'provedor',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem?.nomeFantasia?.trim() || !currentItem?.razaoSocial?.trim())
      return;

    const itemData = {
      nomeFantasia: currentItem.nomeFantasia.trim(),
      razaoSocial: currentItem.razaoSocial.trim(),
      enderecamento: currentItem.enderecamento?.trim() || '',
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
  const columns: TableColumn<Provedor>[] = [
    {
      key: 'nomeFantasia',
      label: 'Nome Fantasia',
      width: '200px',
    },
    {
      key: 'razaoSocial',
      label: 'Razão Social',
      render: (value) => (
        <span
          title={String(value)}
          style={{
            display: 'block',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {String(value)}
        </span>
      ),
    },
  ];

  // Componente do formulário
  const formComponent = (
    <Form
      title={isEditing ? 'Editar Provedor' : 'Cadastrar Novo Provedor'}
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
          label='Nome Fantasia'
          value={currentItem?.nomeFantasia || ''}
          onChange={(value) => updateCurrentItem('nomeFantasia', value)}
          placeholder='Digite o nome fantasia...'
          required
          disabled={saving}
        />
        <Input
          label='Razão Social'
          value={currentItem?.razaoSocial || ''}
          onChange={(value) => updateCurrentItem('razaoSocial', value)}
          placeholder='Digite a razão social...'
          required
          disabled={saving}
        />
      </div>

      <TextArea
        label='Endereçamento'
        value={currentItem?.enderecamento || ''}
        onChange={(value) => updateCurrentItem('enderecamento', value)}
        placeholder='Digite o endereçamento completo...'
        rows={3}
        disabled={saving}
      />
    </Form>
  );

  return (
    <CadastroPageLayout
      title='Gerenciar Provedores'
      searchPlaceholder='Buscar por nome fantasia ou razão social...'
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
        emptyMessage='Nenhum provedor encontrado'
        loading={loading}
      />
    </CadastroPageLayout>
  );
}
