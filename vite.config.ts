import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('three')) return 'three';
          if (id.includes('@react-three') || id.includes('postprocessing')) return 'r3f';
          if (id.includes('gsap') || id.includes('lenis')) return 'motion';
          return undefined;
        },
      },
    },
  },
});
