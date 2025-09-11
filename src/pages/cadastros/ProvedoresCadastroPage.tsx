// src/pages/cadastros/ProvedoresCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import { type Provedor, mockProvedores } from '../../shared/data/mockProvedores';

export default function ProvedoresCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<Provedor>[] = [
    {
      key: 'nomeFantasia',
      label: 'Nome Fantasia',
      type: 'text',
      placeholder: 'Digite o nome fantasia...',
      required: true,
      gridColumn: '1 / 2',
    },
    {
      key: 'razaoSocial',
      label: 'Razão Social',
      type: 'text',
      placeholder: 'Digite a razão social...',
      required: true,
      gridColumn: '2 / 3',
    },
    {
      key: 'enderecamento',
      label: 'Endereçamento',
      type: 'textarea',
      placeholder: 'Digite o endereçamento completo...',
      rows: 3,
      gridColumn: '1 / -1',
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<Provedor>[] = [
    {
      key: 'nomeFantasia',
      label: 'Nome Fantasia',
      width: '200px',
      sortable: true,
    },
    {
      key: 'razaoSocial',
      label: 'Razão Social',
      sortable: true,
      render: value => (
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

  return (
    <SimpleCrudPage<Provedor>
      title='Gerenciar Provedores'
      searchPlaceholder='Buscar por nome fantasia ou razão social...'
      entityName='provedor'
      createTitle='Novo Provedor'
      editTitle='Editar Provedor'
      initialData={mockProvedores}
      fields={fields}
      columns={columns}
      searchFields={['nomeFantasia', 'razaoSocial']}
    />
  );
}
