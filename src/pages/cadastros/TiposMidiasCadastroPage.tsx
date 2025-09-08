// src/pages/cadastros/TiposMidiasCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import { type TipoMidia, mockTiposMidias } from '../../shared/data/mockTiposMidias';

export default function TiposMidiasCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<TipoMidia>[] = [
    {
      key: 'nome',
      label: 'Tipo de Mídia',
      type: 'text',
      placeholder: 'Digite o tipo de mídia...',
      required: true,
      gridColumn: '1 / -1',
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<TipoMidia>[] = [
    {
      key: 'nome',
      label: 'Tipo de Mídia',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<TipoMidia>
      title='Gerenciar Tipos de Mídias'
      searchPlaceholder='Buscar por tipo de mídia...'
      entityName='tipo de mídia'
      createTitle='Novo Tipo de Mídia'
      editTitle='Editar Tipo de Mídia'
      initialData={mockTiposMidias}
      fields={fields}
      columns={columns}
      searchFields={['nome']}
    />
  );
}
