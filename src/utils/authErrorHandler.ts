/**
 * Maneja errores de autenticación (401) de forma centralizada.
 * Limpia el localStorage, notifica al AuthContext y redirige al login cuando el token es inválido.
 */
export const handleAuthError = (): void => {
  // Limpiar datos de autenticación
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Disparar evento personalizado para notificar al AuthContext
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  // Redirigir al login solo si no estamos ya en la página de login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

/**
 * Verifica si una respuesta es un error 401 y maneja la autenticación.
 * @param response - La respuesta HTTP
 * @returns true si es un error 401, false en caso contrario
 */
export const checkAndHandleAuthError = (response: Response): boolean => {
  if (response.status === 401) {
    handleAuthError();
    return true;
  }
  return false;
};

