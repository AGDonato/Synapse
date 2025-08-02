// src/pages/cadastros/DistribuidoresCadastroPage.tsx
import SimpleCrudPage from '../../components/pages/SimpleCrudPage';
import {
  mockDistribuidores,
  type Distribuidor,
} from '../../data/mockDistribuidores';

export default function DistribuidoresCadastroPage() {
  return (
    <SimpleCrudPage<Distribuidor>
      title='Gerenciar Distribuidores'
      searchPlaceholder='Buscar por distribuidor...'
      entityName='distribuidor'
      createTitle='Novo Distribuidor'
      editTitle='Editar Distribuidor'
      initialData={mockDistribuidores}
      nameLabel='Nome do Distribuidor'
      namePlaceholder='Digite o nome do distribuidor...'
    />
  );
}
