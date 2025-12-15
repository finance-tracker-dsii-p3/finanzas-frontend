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
      if (type === 'error' && typeof log === 'string' && log.includes('Not implemented: navigation')) {
        return false;
      }
      if (type === 'error' && typeof log === 'string' && log.includes('act(...)')) {
        return false;
      }
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
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});








