// src/pages/cadastros/AutoridadesCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../components/pages/SimpleCrudPage';
import { type Autoridade, mockAutoridades } from '../../data/mockAutoridades';

export default function AutoridadesCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<Autoridade>[] = [
    {
      key: 'nome',
      label: 'Nome',
      type: 'text',
      placeholder: 'Digite o nome da autoridade...',
      required: true,
      gridColumn: '1 / 2',
    },
    {
      key: 'cargo',
      label: 'Cargo',
      type: 'text',
      placeholder: 'Digite o cargo da autoridade...',
      required: true,
      gridColumn: '2 / 3',
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<Autoridade>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'cargo',
      label: 'Cargo',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<Autoridade>
      title='Gerenciar Autoridades'
      searchPlaceholder='Buscar por nome ou cargo...'
      entityName='autoridade'
      createTitle='Nova Autoridade'
      editTitle='Editar Autoridade'
      initialData={mockAutoridades}
      fields={fields}
      columns={columns}
      searchFields={['nome', 'cargo']}
    />
  );
}
