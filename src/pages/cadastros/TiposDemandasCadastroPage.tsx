// src/pages/cadastros/TiposDemandasCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import { type TipoDemanda, mockTiposDemandas } from '../../shared/data/mockTiposDemandas';

export default function TiposDemandasCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<TipoDemanda>[] = [
    {
      key: 'nome',
      label: 'Tipo de Demanda',
      type: 'text',
      placeholder: 'Digite o nome do tipo de demanda...',
      required: true,
      gridColumn: '1 / -1',
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<TipoDemanda>[] = [
    {
      key: 'nome',
      label: 'Tipo de Demanda',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<TipoDemanda>
      title='Gerenciar Tipos de Demandas'
      searchPlaceholder='Buscar por tipo de demanda...'
      entityName='tipo de demanda'
      createTitle='Novo Tipo de Demanda'
      editTitle='Editar Tipo de Demanda'
      initialData={mockTiposDemandas}
      fields={fields}
      columns={columns}
      searchFields={['nome']}
    />
  );
}
