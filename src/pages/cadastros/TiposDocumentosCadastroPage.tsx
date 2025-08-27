// src/pages/cadastros/TiposDocumentosCadastroPage.tsx
import SimpleCrudPage from '../../components/pages/SimpleCrudPage';
import {
  type TipoDocumento,
  mockTiposDocumentos,
} from '../../data/mockTiposDocumentos';

export default function TiposDocumentosCadastroPage() {
  return (
    <SimpleCrudPage<TipoDocumento>
      title='Gerenciar Tipos de Documentos'
      searchPlaceholder='Buscar por tipo de documento...'
      entityName='tipo de documento'
      createTitle='Novo Tipo de Documento'
      editTitle='Editar Tipo de Documento'
      initialData={mockTiposDocumentos}
      nameLabel='Tipo de Documento'
      namePlaceholder='Digite o nome do tipo de documento...'
    />
  );
}
