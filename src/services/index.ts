// src/services/index.ts

// Base service
export { 
  BaseService, 
  type ServiceResponse, 
  type ServiceListResponse, 
  type SearchOptions 
} from './BaseService';

// Specific services
export { AssuntosService, assuntosService } from './AssuntosService';
export { OrgaosService, orgaosService } from './OrgaosService';

// You can add more services here as they are created
// export { TiposDocumentosService, tiposDocumentosService } from './TiposDocumentosService';
// export { TiposDemandasService, tiposDemandasService } from './TiposDemandasService';
// etc...