import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { builtinModules } from 'node:module'

import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
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
