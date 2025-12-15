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
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
    ],
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      '**/*.d.ts',
    ],
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
        '**/*.css',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/services/**',
        'src/utils/**',
        'src/pages/soats/SOATs.tsx',
        'src/pages/bills/Bills.tsx',
        'src/pages/accounts/Accounts.tsx',
        'src/pages/dashboard/Dashboard.tsx',
        'src/pages/movements/Movements.tsx',
        'src/pages/categories/Categories.tsx',
        'src/components/NewAccountModal.tsx',
        'src/components/NewMovementModal.tsx',
        'src/components/ExpensesDonutChart.tsx',
      ],
      include: ['src/**/*.{ts,tsx}'],
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








