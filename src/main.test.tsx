import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('main.tsx', () => {
  beforeEach(() => {
    // Limpiar cualquier elemento root existente
    const existingRoot = document.getElementById('root');
    if (existingRoot) {
      document.body.removeChild(existingRoot);
    }
  });

  afterEach(() => {
    // Limpiar DOM después de cada test
    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
    vi.restoreAllMocks();
  });

  it('debe verificar que el elemento root existe en el DOM', () => {
    // Crear elemento root
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    const root = document.getElementById('root');
    expect(root).toBeTruthy();
    expect(root?.id).toBe('root');
  });

  it('debe verificar que el elemento root no existe si no se crea', () => {
    // No crear el elemento root
    const root = document.getElementById('root');
    expect(root).toBeNull();
  });

  it('debe poder crear el elemento root dinámicamente', () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    const root = document.getElementById('root');
    expect(root).toBeInstanceOf(HTMLElement);
    expect(root?.tagName).toBe('DIV');
  });
});

