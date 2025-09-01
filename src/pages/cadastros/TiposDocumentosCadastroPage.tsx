// src/pages/cadastros/TiposDocumentosCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../components/pages/SimpleCrudPage';
import { type TipoDocumento, mockTiposDocumentos } from '../../data/mockTiposDocumentos';

export default function TiposDocumentosCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<TipoDocumento>[] = [
    {
      key: 'nome',
      label: 'Tipo de Documento',
      type: 'text',
      placeholder: 'Digite o nome do tipo de documento...',
      required: true,
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<TipoDocumento>[] = [
    {
      key: 'nome',
      label: 'Tipo de Documento',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<TipoDocumento>
      title='Gerenciar Tipos de Documentos'
      searchPlaceholder='Buscar por tipo de documento...'
      entityName='tipo de documento'
      createTitle='Novo Tipo de Documento'
      editTitle='Editar Tipo de Documento'
      initialData={mockTiposDocumentos}
      fields={fields}
      columns={columns}
      searchFields={['nome']}
    />
  );
}
