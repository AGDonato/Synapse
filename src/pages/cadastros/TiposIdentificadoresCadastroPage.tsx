// src/pages/cadastros/TiposIdentificadoresCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import {
  type TipoIdentificador,
  mockTiposIdentificadores,
} from '../../shared/data/mockTiposIdentificadores';

export default function TiposIdentificadoresCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<TipoIdentificador>[] = [
    {
      key: 'nome',
      label: 'Tipo de Identificador',
      type: 'text',
      placeholder: 'Digite o tipo de identificador...',
      required: true,
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<TipoIdentificador>[] = [
    {
      key: 'nome',
      label: 'Tipo de Identificador',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<TipoIdentificador>
      title='Gerenciar Tipos de Identificadores'
      searchPlaceholder='Buscar por tipo de identificador...'
      entityName='tipo de identificador'
      createTitle='Novo Tipo de Identificador'
      editTitle='Editar Tipo de Identificador'
      initialData={mockTiposIdentificadores}
      fields={fields}
      columns={columns}
      searchFields={['nome']}
    />
  );
}
