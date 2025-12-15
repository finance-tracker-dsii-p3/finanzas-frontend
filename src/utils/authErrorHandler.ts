export const handleAuthError = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  if (window.location.pathname !== '/login') {

    try {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      void err;
      try {
        window.location.href = '/login';
      } catch (err2) {
        void err2;
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

