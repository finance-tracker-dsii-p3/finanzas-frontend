# Guía de Testing

Esta guía explica cómo ejecutar y escribir tests para el proyecto.

## 🧪 Framework de Testing

El proyecto usa:
- **Vitest**: Framework de testing rápido y moderno
- **React Testing Library**: Para testing de componentes React
- **@testing-library/user-event**: Para simular interacciones del usuario

## 📋 Comandos de Testing

```bash
# Ejecutar tests en modo watch (se re-ejecutan al cambiar archivos)
npm run test

# Ejecutar tests una vez (útil para CI)
npm run test:run

# Ejecutar tests con interfaz gráfica
npm run test:ui

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## 📁 Estructura de Tests

Los tests están organizados junto a los componentes que prueban:

```
src/
  pages/
    login/
      Login.tsx
      Login.test.tsx    ← Test del componente Login
    register/
      Register.tsx
      Register.test.tsx ← Test del componente Register
```

## ✍️ Escribir Tests

### Ejemplo Básico

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import MiComponente from './MiComponente';

describe('MiComponente', () => {
  it('debe renderizar correctamente', () => {
    render(<MiComponente />);
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });
});
```

### Testing de Formularios

```typescript
import userEvent from '@testing-library/user-event';

it('debe permitir escribir en el input', async () => {
  const user = userEvent.setup();
  render(<MiFormulario />);
  
  const input = screen.getByLabelText(/email/i);
  await user.type(input, 'test@example.com');
  
  expect(input).toHaveValue('test@example.com');
});
```

### Testing de Interacciones Asíncronas

```typescript
import { waitFor } from '@testing-library/react';

it('debe mostrar mensaje después de submit', async () => {
  const user = userEvent.setup();
  render(<MiFormulario />);
  
  const button = screen.getByRole('button', { name: /enviar/i });
  await user.click(button);
  
  await waitFor(() => {
    expect(screen.getByText(/éxito/i)).toBeInTheDocument();
  });
});
```

## 🎯 Tests Implementados

### Login (`Login.test.tsx`)

- ✅ Renderiza el formulario correctamente
- ✅ Valida campos requeridos
- ✅ Permite escribir en los campos
- ✅ Muestra/oculta contraseña
- ✅ Maneja errores de login
- ✅ Llama a la función de login con credenciales correctas
- ✅ Muestra estado de carga
- ✅ Enlaces a registro y recuperación de contraseña

### Register (`Register.test.tsx`)

- ✅ Renderiza el formulario completo
- ✅ Valida todos los campos requeridos
- ✅ Validación de contraseña en tiempo real
- ✅ Valida requisitos de contraseña (mayúscula, minúscula, número, especial)
- ✅ Valida que las contraseñas coincidan
- ✅ Registra usuario exitosamente
- ✅ Maneja errores de registro
- ✅ Muestra estado de carga
- ✅ Muestra/oculta contraseñas
- ✅ Enlace a login

## 🔧 Utilidades de Testing

### `test-utils.tsx`

Proporciona un wrapper personalizado que incluye:
- `BrowserRouter` para testing de rutas
- `AuthProvider` para testing con contexto de autenticación

```typescript
import { render } from '../../test/utils/test-utils';

render(<MiComponente />);
```

## 🎭 Mocking

### Mock de Contexto

```typescript
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mocked(authContext.useAuth).mockReturnValue({
  user: null,
  isAuthenticated: false,
  login: mockLogin,
});
```

### Mock de Servicios

```typescript
const mockRegister = vi.fn();
vi.mock('../../services/authService', () => ({
  authService: {
    register: mockRegister,
  },
}));
```

### Mock de Componentes

```typescript
vi.mock('../../components/FinanceAnimation', () => ({
  FinanceAnimation: () => <div>Animation</div>,
}));
```

## 📊 Cobertura de Código

Para ver el reporte de cobertura:

```bash
npm run test:coverage
```

Esto generará un reporte HTML en `coverage/index.html` que puedes abrir en tu navegador.

## ✅ Mejores Prácticas

1. **Nombres descriptivos**: Usa nombres que describan qué está probando el test
2. **Un test, una cosa**: Cada test debe verificar una funcionalidad específica
3. **Arrange-Act-Assert**: Organiza tus tests en estas tres secciones
4. **Testing de comportamiento, no implementación**: Prueba qué hace el componente, no cómo lo hace
5. **Usa queries accesibles**: Prefiere `getByRole`, `getByLabelText` sobre `getByTestId`

## 🚀 Integración Continua

Los tests se ejecutan automáticamente en:
- Cada push a `main`, `develop`, `master`
- Cada Pull Request

Si los tests fallan, el CI bloqueará el merge.

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)








