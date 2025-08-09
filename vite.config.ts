import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // GitPod precisa escutar em todas as interfaces
    port: 5173,
    allowedHosts: [
      '5173-agdonato-synapse-a3qqw2zcpsr.ws-us120.gitpod.io',
      '.gitpod.io' // Permite qualquer subdomínio do GitPod
    ]
  }
});
