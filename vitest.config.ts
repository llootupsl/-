import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        eventemitters3: 'events',
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.tsx'],
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
      passWithNoTests: true,
    },
  })
);
