import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReactDOM from 'react-dom/client';

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

    originalCreateRoot = ReactDOM.createRoot;

    mockRoot = {
      render: vi.fn(),
    };

    (ReactDOM.createRoot as unknown) = vi.fn(() => mockRoot as unknown as ReactDOM.Root);

    const existingRoot = document.getElementById('root');
    if (existingRoot) {
      document.body.removeChild(existingRoot);
    }
  });

  afterEach(() => {

    ReactDOM.createRoot = originalCreateRoot;

    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
    vi.restoreAllMocks();
  });

  it('debe crear el root y renderizar App cuando el elemento root existe', async () => {

    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    await import('./main');

    expect(ReactDOM.createRoot).toHaveBeenCalledWith(rootElement);

    expect(mockRoot.render).toHaveBeenCalled();
  });

  it('no debe hacer nada cuando el elemento root no existe', async () => {

    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
    expect(document.getElementById('root')).toBeNull();

    vi.resetModules();

    mockRoot = {
      render: vi.fn(),
    };
    (ReactDOM.createRoot as unknown) = vi.fn(() => mockRoot as unknown as ReactDOM.Root);

    await import('./main');

    expect(ReactDOM.createRoot).not.toHaveBeenCalled();
  });
});

