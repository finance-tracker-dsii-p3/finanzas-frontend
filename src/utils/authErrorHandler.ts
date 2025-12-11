export const handleAuthError = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  if (window.location.pathname !== '/login') {
    // Intentar usar pushState primero (funciona en tests y evita warnings de jsdom)
    try {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      // Si pushState falla (puede pasar en algunos entornos), usar href
      try {
        window.location.href = '/login';
      } catch {
        // Ignorar errores de navigation (puede pasar en jsdom)
      }
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

