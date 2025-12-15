import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactDOM from 'react-dom/client';

// Mock de App y CSS
vi.mock('./App', async () => {
  const react = await import('react');
  return {
    default: () => {
      return react.createElement('div', { 'data-testid': 'app' }, 'App');
    },
  };
});

vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  let originalCreateRoot: typeof ReactDOM.createRoot;
  let mockRoot: { render: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Guardar la implementación original
    originalCreateRoot = ReactDOM.createRoot;
    
    // Mock de createRoot
    mockRoot = {
      render: vi.fn(),
    };
    
    // Mock de createRoot
    (ReactDOM.createRoot as unknown) = vi.fn(() => mockRoot as unknown as ReactDOM.Root);
    
    // Limpiar cualquier elemento root existente
    const existingRoot = document.getElementById('root');
    if (existingRoot) {
      document.body.removeChild(existingRoot);
    }
  });

  afterEach(() => {
    // Restaurar implementación original
    ReactDOM.createRoot = originalCreateRoot;
    
    // Limpiar DOM después de cada test
    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
    vi.restoreAllMocks();
  });

  it('debe crear el root y renderizar App cuando el elemento root existe', async () => {
    // Crear elemento root
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    // Importar y ejecutar main.tsx
    await import('./main');

    // Verificar que se llamó createRoot
    expect(ReactDOM.createRoot).toHaveBeenCalledWith(rootElement);
    
    // Verificar que se llamó render
    expect(mockRoot.render).toHaveBeenCalled();
  });

  it('no debe hacer nada cuando el elemento root no existe', async () => {
    // No crear el elemento root
    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
    expect(document.getElementById('root')).toBeNull();

    // Limpiar el módulo para que se pueda importar de nuevo
    vi.resetModules();
    
    // Reconfigurar el mock
    mockRoot = {
      render: vi.fn(),
    };
    (ReactDOM.createRoot as unknown) = vi.fn(() => mockRoot as unknown as ReactDOM.Root);

    // Importar y ejecutar main.tsx
    await import('./main');

    // Verificar que NO se llamó createRoot
    expect(ReactDOM.createRoot).not.toHaveBeenCalled();
  });
});

