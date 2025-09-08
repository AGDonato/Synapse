// src/pages/cadastros/OrgaosCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import { type Orgao, mockOrgaos } from '../../shared/data/mockOrgaos';

export default function OrgaosCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<Orgao>[] = [
    {
      key: 'abreviacao',
      label: 'Abreviação',
      type: 'text',
      placeholder: 'Ex: PC-GO, MP-SP...',
      required: true,
      gridColumn: '1 / 2',
    },
    {
      key: 'nomeCompleto',
      label: 'Nome Completo',
      type: 'text',
      placeholder: 'Nome completo do órgão...',
      required: true,
      gridColumn: '2 / 3',
    },
    {
      key: 'enderecamento',
      label: 'Endereçamento',
      type: 'textarea',
      placeholder: 'Endereço completo do órgão...',
      rows: 3,
      gridColumn: '1 / -1',
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<Orgao>[] = [
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
      render: value => (
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

  return (
    <SimpleCrudPage<Orgao>
      title='Gerenciar Órgãos'
      searchPlaceholder='Buscar por abreviação ou nome...'
      entityName='órgão'
      createTitle='Cadastrar Novo Órgão'
      editTitle='Editar Órgão'
      initialData={mockOrgaos}
      fields={fields}
      columns={columns}
      searchFields={['abreviacao', 'nomeCompleto']}
    />
  );
}
