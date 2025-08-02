// src/pages/cadastros/AssuntosCadastroPage.tsx
import React, { useState, useMemo } from 'react';
import Input from '../../components/ui/Input';
import Table, { type TableColumn } from '../../components/ui/Table';
import Form from '../../components/ui/Form';
import CadastroPageLayout from '../../components/layout/CadastroPageLayout';
import { useAssuntos } from '../../hooks/useAssuntos';
import { useFormValidation } from '../../hooks/useFormValidation';
import { CreateAssuntoSchema, UpdateAssuntoSchema } from '../../schemas/entities';
import type { Assunto } from '../../types/entities';
import type { CreateDTO, UpdateDTO } from '../../types/api';

export default function AssuntosCadastroPage() {
  const {
    items,
    loading,
    saving,
    error,
    create,
    update,
    deleteItem,
    clearError,
    clearCurrentItem,
  } = useAssuntos({ autoLoad: true });

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Assunto>>({});

  // Form validation
  const { validateField, validate, errors: formErrors, clearErrors } = useFormValidation(
    isEditing ? UpdateAssuntoSchema : CreateAssuntoSchema
  );

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Form handlers
  const showCreateForm = () => {
    setFormData({});
    setIsEditing(false);
    setIsFormVisible(true);
    clearErrors();
    clearCurrentItem();
  };

  const showEditForm = (item: Assunto) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsFormVisible(true);
    clearErrors();
  };

  const hideForm = () => {
    setIsFormVisible(false);
    setFormData({});
    setIsEditing(false);
    clearErrors();
  };

  const updateFormData = (field: 'nome', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate(formData);
    if (!isValid) {
      return;
    }

    try {
      if (isEditing && formData.id) {
        const updateData: UpdateDTO<Assunto> = { nome: formData.nome };
        await update(formData.id, updateData);
      } else {
        const createData: CreateDTO<Assunto> = { nome: formData.nome! };
        await create(createData);
      }
      hideForm();
    } catch {
      // Error is handled by the service hook
    }
  };

  const confirmDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este assunto?')) {
      await deleteItem(id);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Configuração das colunas da tabela (memoizada)
  const columns = useMemo((): TableColumn<Assunto>[] => [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      align: 'center',
    },
    {
      key: 'nome',
      label: 'Nome do Assunto',
    },
  ], []);

  // Componente do formulário (memoizado)
  const formComponent = useMemo(() => (
    <Form
      title={isEditing ? 'Editar Assunto' : 'Novo Assunto'}
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

      <Input
        label='Nome do Assunto'
        value={formData?.nome || ''}
        onChange={(value) => updateFormData('nome', value)}
        placeholder='Digite o nome do assunto...'
        required
        disabled={saving}
        error={formErrors.nome}
      />
    </Form>
  ), [isEditing, handleSave, hideForm, saving, error, clearError, formData.nome, formErrors.nome, updateFormData]);

  return (
    <CadastroPageLayout
      title='Gerenciar Assuntos'
      searchPlaceholder='Buscar por assunto...'
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
        emptyMessage='Nenhum assunto encontrado'
        loading={loading}
      />
    </CadastroPageLayout>
  );
}
