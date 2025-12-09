export const handleAuthError = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export const checkAndHandleAuthError = (response: Response): boolean => {
  if (response.status === 401) {
    handleAuthError();
    return true;
  }
  return false;
};

