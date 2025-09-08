// src/pages/cadastros/AssuntosCadastroPage.tsx
import SimpleCrudPage, {
  type FieldConfig,
  type ColumnConfig,
} from '../../shared/components/pages/SimpleCrudPage';
import { mockAssuntos } from '../../shared/data/mockAssuntos';
import type { Assunto } from '../../types/entities';

export default function AssuntosCadastroPage() {
  // Configuração dos campos do formulário
  const fields: FieldConfig<Assunto>[] = [
    {
      key: 'nome',
      label: 'Nome do Assunto',
      type: 'text',
      placeholder: 'Digite o nome do assunto...',
      required: true,
    },
  ];

  // Configuração das colunas da tabela
  const columns: ColumnConfig<Assunto>[] = [
    {
      key: 'nome',
      label: 'Nome do Assunto',
      sortable: true,
    },
  ];

  return (
    <SimpleCrudPage<Assunto>
      title='Gerenciar Assuntos'
      searchPlaceholder='Buscar por assunto...'
      entityName='assunto'
      createTitle='Novo Assunto'
      editTitle='Editar Assunto'
      initialData={mockAssuntos}
      fields={fields}
      columns={columns}
      searchFields={['nome']}
    />
  );
}
