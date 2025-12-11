export const handleAuthError = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  if (window.location.pathname !== '/login') {
    // En entorno de pruebas, usar history.pushState en lugar de location.href
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      try {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch {
        // Si pushState falla, intentar con href (puede generar warning en jsdom)
        try {
          window.location.href = '/login';
        } catch {
          // Ignorar errores de navigation en entorno de pruebas
        }
      }
    } else {
      window.location.href = '/login';
    }
  }
};

export const checkAndHandleAuthError = (response: Response): boolean => {
  if (response.status === 401) {
    handleAuthError();
    return true;
  }
  return false;
};

