import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'session_token';
const USER_COOKIE_NAME = 'session_user';

// Opciones de cookies seguras
const getCookieOptions = () => {
  const isProduction = import.meta.env.PROD;
  const isHttps = window.location.protocol === 'https:';
  
  return {
    expires: 7, // 7 días
    sameSite: 'Lax' as const,
    secure: isHttps || isProduction, // Secure solo en HTTPS o producción
    path: '/',
  };
};

export const cookieUtils = {
  /**
   * Guarda el token de sesión en una cookie
   */
  setToken(token: string): void {
    Cookies.set(TOKEN_COOKIE_NAME, token, getCookieOptions());
  },

  /**
   * Obtiene el token de sesión de la cookie
   */
  getToken(): string | undefined {
    return Cookies.get(TOKEN_COOKIE_NAME);
  },

  /**
   * Elimina el token de sesión
   */
  removeToken(): void {
    Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  },

  /**
   * Guarda los datos del usuario en una cookie
   */
  setUser(user: unknown): void {
    Cookies.set(USER_COOKIE_NAME, JSON.stringify(user), getCookieOptions());
  },

  /**
   * Obtiene los datos del usuario de la cookie
   */
  getUser<T>(): T | null {
    const userStr = Cookies.get(USER_COOKIE_NAME);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as T;
    } catch {
      return null;
    }
  },

  /**
   * Elimina los datos del usuario
   */
  removeUser(): void {
    Cookies.remove(USER_COOKIE_NAME, { path: '/' });
  },

  /**
   * Elimina todas las cookies de sesión
   */
  clearSession(): void {
    this.removeToken();
    this.removeUser();
  },
};


