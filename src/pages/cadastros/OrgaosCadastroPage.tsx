// src/pages/cadastros/OrgaosCadastroPage.tsx
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Table, { type TableColumn } from '../../components/ui/Table';
import Form from '../../components/ui/Form';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { mockOrgaos, type Orgao } from '../../data/mockOrgaos';
import { useCrud } from '../../hooks/useCrud';
import { theme } from '../../styles/theme';

export default function OrgaosCadastroPage() {
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
  } = useCrud<Orgao>({
    initialData: mockOrgaos,
    entityName: 'órgão',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !currentItem?.nomeCompleto?.trim() ||
      !currentItem?.abreviacao?.trim()
    ) {
      return;
    }

    const itemData = {
      abreviacao: currentItem.abreviacao.trim(),
      nomeCompleto: currentItem.nomeCompleto.trim(),
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
  const columns: TableColumn<Orgao>[] = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      align: 'center',
      sortable: true,
    },
    {
      key: 'abreviacao',
      label: 'Abreviação',
      width: '150px',
      sortable: true,
    },
    {
      key: 'nomeCompleto',
      label: 'Nome Completo',
      sortable: true,
      render: (value) => (
        <span
          title={String(value)}
          style={{
            display: 'block',
            maxWidth: '400px',
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

  const formComponent = (
    <Form
      title={isEditing ? 'Editar Órgão' : 'Cadastrar Novo Órgão'}
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
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.lg,
        }}
      >
        <Input
          label='Abreviação'
          value={currentItem?.abreviacao || ''}
          onChange={(value) => updateCurrentItem('abreviacao', value)}
          placeholder='Ex: PC-GO, MP-SP...'
          required
          disabled={saving}
        />
        <Input
          label='Nome Completo'
          value={currentItem?.nomeCompleto || ''}
          onChange={(value) => updateCurrentItem('nomeCompleto', value)}
          placeholder='Nome completo do órgão...'
          required
          disabled={saving}
        />
      </div>

      <TextArea
        label='Endereçamento'
        value={currentItem?.enderecamento || ''}
        onChange={(value) => updateCurrentItem('enderecamento', value)}
        placeholder='Endereço completo do órgão...'
        rows={3}
        disabled={saving}
      />
    </Form>
  );

  return (
    <CadastroPageLayout
      title='Gerenciar Órgãos'
      searchPlaceholder='Buscar por abreviação ou nome...'
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
        emptyMessage='Nenhum órgão encontrado'
        loading={loading}
      />
    </CadastroPageLayout>
  );
}
