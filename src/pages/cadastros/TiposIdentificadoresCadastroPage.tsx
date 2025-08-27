// src/pages/cadastros/TiposIdentificadoresCadastroPage.tsx
import SimpleCrudPage from '../../components/pages/SimpleCrudPage';
import {
  type TipoIdentificador,
  mockTiposIdentificadores,
} from '../../data/mockTiposIdentificadores';

export default function TiposIdentificadoresCadastroPage() {
  return (
    <SimpleCrudPage<TipoIdentificador>
      title='Gerenciar Tipos de Identificadores'
      searchPlaceholder='Buscar por tipo de identificador...'
      entityName='tipo de identificador'
      createTitle='Novo Tipo de Identificador'
      editTitle='Editar Tipo de Identificador'
      initialData={mockTiposIdentificadores}
      nameLabel='Tipo de Identificador'
      namePlaceholder='Digite o tipo de identificador...'
    />
  );
}
