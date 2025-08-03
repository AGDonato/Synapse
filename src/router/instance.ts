import App from '../App';
import { routeGroups } from './config';
import { createAppRouter } from './factory';

// Instância única do router
export const router = createAppRouter(routeGroups, App);