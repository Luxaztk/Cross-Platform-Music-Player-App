import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'packages/core/src/services/LibraryService.ts',
        'packages/player/src/AudioEngine.ts',
        'apps/desktop/src/infrastructure/repositories/ElectronLibraryRepository.ts',
        'packages/hooks/src/providers/PlayerProvider.tsx',
        'packages/hooks/src/usePlayer.ts',
      ],
    },
  },
});
