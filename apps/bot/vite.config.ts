import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/web'),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@components': path.resolve(__dirname, '../desktop/src/presentations/components'),
      '@application': path.resolve(__dirname, '../desktop/src/application'),
      '@hooks': path.resolve(__dirname, '../desktop/src/application/hooks'),
      '@infrastructure': path.resolve(__dirname, '../desktop/src/infrastructure'),
      '@utils': path.resolve(__dirname, '../desktop/src/infrastructure/utils'),
      '@constants': path.resolve(__dirname, '../desktop/src/presentations/constants'),
      '@music/brand': path.resolve(__dirname, '../../packages/brand'),
      '@music/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@music/types': path.resolve(__dirname, '../../packages/types'),
      '@music/core': path.resolve(__dirname, '../../packages/core/src'),
      '@music/player': path.resolve(__dirname, '../../packages/player/src'),
      '@music/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
      '@music/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@music/i18n': path.resolve(__dirname, '../../packages/i18n/src'),
    },
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'public'),
    emptyOutDir: true,
  },
});
