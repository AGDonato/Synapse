// src/pages/cadastros/DistribuidoresCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import { type Distribuidor, mockDistribuidores } from '../../shared/data/mockDistribuidores';

export default function DistribuidoresCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<Distribuidor>[] = [
    {
      key: 'nome',
      label: 'Nome do Distribuidor',
      type: 'text',
      placeholder: 'Digite o nome do distribuidor...',
      required: true,
      gridColumn: '1 / -1',
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<Distribuidor>[] = [
    {
      key: 'nome',
      label: 'Nome do Distribuidor',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<Distribuidor>
      title='Gerenciar Distribuidores'
      searchPlaceholder='Buscar por distribuidor...'
      entityName='distribuidor'
      createTitle='Novo Distribuidor'
      editTitle='Editar Distribuidor'
      initialData={mockDistribuidores}
      fields={fields}
      columns={columns}
      searchFields={['nome']}
    />
  );
}
