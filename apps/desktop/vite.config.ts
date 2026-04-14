import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { builtinModules } from 'node:module'

import electron from 'vite-plugin-electron/simple'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@music/brand': path.resolve(__dirname, '../../packages/brand'),
      '@music/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@music/types': path.resolve(__dirname, '../../packages/types'),
      '@music/core': path.resolve(__dirname, '../../packages/core/src'),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'electron',
                'music-metadata',
                '@ffmpeg-installer/ffmpeg',
                'youtube-dl-exec',
                'node-id3',
                'electron-store',
                'axios',
                ...builtinModules,
                ...builtinModules.map(m => `node:${m}`),
              ],
              platform: 'node',
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
      },
    }),
  ],
})
