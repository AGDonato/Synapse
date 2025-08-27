// src/pages/cadastros/TiposDemandasCadastroPage.tsx
import SimpleCrudPage from '../../components/pages/SimpleCrudPage';
import {
  type TipoDemanda,
  mockTiposDemandas,
} from '../../data/mockTiposDemandas';

export default function TiposDemandasCadastroPage() {
  return (
    <SimpleCrudPage<TipoDemanda>
      title='Gerenciar Tipos de Demandas'
      searchPlaceholder='Buscar por tipo de demanda...'
      entityName='tipo de demanda'
      createTitle='Novo Tipo de Demanda'
      editTitle='Editar Tipo de Demanda'
      initialData={mockTiposDemandas}
      nameLabel='Tipo de Demanda'
      namePlaceholder='Digite o nome do tipo de demanda...'
    />
  );
}
