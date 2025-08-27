// src/pages/cadastros/TiposMidiasCadastroPage.tsx
import SimpleCrudPage from '../../components/pages/SimpleCrudPage';
import { type TipoMidia, mockTiposMidias } from '../../data/mockTiposMidias';

export default function TiposMidiasCadastroPage() {
  return (
    <SimpleCrudPage<TipoMidia>
      title='Gerenciar Tipos de Mídias'
      searchPlaceholder='Buscar por tipo de mídia...'
      entityName='tipo de mídia'
      createTitle='Novo Tipo de Mídia'
      editTitle='Editar Tipo de Mídia'
      initialData={mockTiposMidias}
      nameLabel='Tipo de Mídia'
      namePlaceholder='Digite o tipo de mídia...'
    />
  );
}
