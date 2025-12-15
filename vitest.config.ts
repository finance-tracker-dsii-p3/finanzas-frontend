import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    onConsoleLog: (log, type) => {
      // Suprimir warnings conocidos de jsdom sobre navigation
      if (type === 'error' && typeof log === 'string' && log.includes('Not implemented: navigation')) {
        return false;
      }
      // Suprimir warnings sobre act() si vienen de stderr
      if (type === 'error' && typeof log === 'string' && log.includes('act(...)')) {
        return false;
      }
      // Suprimir warnings sobre testing environment
      if (type === 'error' && typeof log === 'string' && log.includes('The current testing environment is not configured to support act(...)')) {
        return false;
      }
      return true;
    },
    silent: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'dist/',
      ],
      thresholds: {
        // Umbral mínimo: 40% del total general (global)
        // Estos thresholds se aplican al total general, no por archivo individual
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});








