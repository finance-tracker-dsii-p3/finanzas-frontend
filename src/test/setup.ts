import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0] || '');

    if (message.includes('Not implemented: navigation')) {
      return;
    }

    if (message.includes('The current testing environment is not configured to support act(...)')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || '');

    if (message.includes('Not implemented: navigation')) {
      return;
    }

    if (message.includes('The current testing environment is not configured to support act(...)')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

afterEach(() => {
  cleanup();
});








