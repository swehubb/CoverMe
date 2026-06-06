import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['recharts'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
