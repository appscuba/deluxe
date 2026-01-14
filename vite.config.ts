
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto asegura que process.env.API_KEY funcione en el navegador
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
  }
});
